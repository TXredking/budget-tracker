# Design Document

> This document covers implementation and UX decisions. For feature requirements see `docs/spec.md`.

---

## Architectural Decisions

### ORM: Drizzle over Prisma or raw SQL

**Decision**: Drizzle ORM with `better-sqlite3` as the driver.

**Rejected: raw `better-sqlite3`**
- No type safety on query results — a column rename breaks at runtime, not compile time
- No migration framework; schema changes require hand-written SQL files
- More boilerplate for common patterns
- Right choice for a trivial, stable schema; wrong choice here given the schema evolves across 10 versions

**Rejected: Prisma**
- Heavier generated client, more "magic" — harder to see what SQL runs
- Better optimized for Postgres; SQLite support works but feels off-grain
- More opinionated migration system

**Chosen: Drizzle**
- Schema defined in TypeScript → generates DB schema and TS types from one source of truth
- Rename a column in the schema and TypeScript surfaces every broken query at compile time
- Thin abstraction: queries read close to SQL (`db.select().from(accounts).where(...)`)
- Raw SQL escape hatch via tagged template literals when needed
- `drizzle-kit` handles migration generation and execution
- Scales cleanly across all planned schema versions

---

### Navigation: Sidebar with Overview as landing

**Decision**: Persistent left sidebar; Overview page is the default route (`/`).

The app's primary value is financial clarity. Landing on the Overview — burn rate, net cash flow, runway — is the correct default because that's the question the app exists to answer. Account management is secondary.

The sidebar stays visible across all views so key metrics are never more than one click away.

On narrow viewports the sidebar collapses; a bottom nav bar takes over for the three primary sections.

---

## UI/UX Conventions

### Financial display

- **Runway** is only shown when net cash flow is negative (net burn > 0). When cash flow is positive, show the surplus figure instead. "∞ months runway" is misleading.
- **Burn rate rolling window** (1mo / 3mo / 6mo) is always user-selectable and visible near the metric — the number is meaningless without knowing the window.
- **Data freshness**: manual account balances older than 7 days show a stale indicator. Plaid accounts show last-synced timestamp. Stale state is surfaced inline on the account card, not as a modal or blocking alert.
- **Partial state** (some accounts connected, no transaction history yet, etc.) is handled gracefully with contextual empty states — not broken layouts or blank panels.

### Sign convention

Follows Plaid's convention throughout: **positive amount = outflow (debit), negative amount = inflow (credit/refund/income)**. This is enforced in all calculation functions. Never use `Math.abs()` on transaction amounts.

### Transaction classification

Three orthogonal dimensions — see `docs/spec.md` Transaction Organization section for the full rationale. The practical rule for UI:
- `category` (Plaid internal field) is never shown directly to the user as a primary label
- Overhead type and tags are the user-facing axes
- Tags ship as an empty array in v2; the UI column exists but shows a placeholder until v4

---

## V2 Implementation

### DB Schema (Drizzle)

```ts
// src/lib/db/schema.ts

import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

// One row per Plaid institution connection
export const plaidItems = sqliteTable('plaid_items', {
  id: text('id').primaryKey(),
  accessToken: text('access_token').notNull(),
  cursor: text('cursor'),
  institution: text('institution').notNull(),
  lastSyncedAt: text('last_synced_at'),
  createdAt: text('created_at').notNull(),
});

// One row per account (Plaid-linked or manual)
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  // ^ checking | savings | brokerage | crypto | retirement | illiquid
  institution: text('institution').notNull(),
  plaidItemId: text('plaid_item_id').references(() => plaidItems.id),
  // ^ null for manual accounts
  manualBalance: real('manual_balance'),
  balanceUpdatedAt: text('balance_updated_at'),
  liquidationPriority: integer('liquidation_priority').notNull().default(0),
  // ^ 0 = excluded (illiquid); 1 = first to draw down
  liquidationCostPct: real('liquidation_cost_pct').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

// One row per transaction
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  plaidTransactionId: text('plaid_transaction_id'),
  // ^ for dedup on re-sync
  date: text('date').notNull(),
  // ^ YYYY-MM-DD
  amount: real('amount').notNull(),
  // ^ positive = outflow (debit), negative = inflow (credit/refund)
  name: text('name').notNull(),
  category: text('category').notNull(),
  // ^ Plaid primary category — internal math axis, not shown directly to user
  tags: text('tags').notNull().default('[]'),
  // ^ JSON array — empty in v2, populated from v4
  importSource: text('import_source').notNull().default('plaid'),
  // ^ plaid | csv | manual | pdf
  createdAt: text('created_at').notNull(),
});
```

### App Router structure

```
src/app/
  page.tsx                          ← Overview (landing page)
  accounts/
    page.tsx                        ← Account list + management
    new/
      page.tsx                      ← Add account (Plaid or manual)
  transactions/
    page.tsx                        ← Transaction list
  api/
    create-link-token/route.ts      ← existing
    exchange-token/route.ts         ← update: persist plaid_item to DB
    transactions/
      route.ts                      ← update: sync all items, persist to DB
    accounts/
      route.ts                      ← new: GET list, POST manual account
      [id]/
        route.ts                    ← new: PATCH balance, DELETE
```

### Sidebar layout

```
┌──────────┬────────────────────────────────┐
│          │                                │
│ Overview │   <page content>               │
│ Accounts │                                │
│ Transact │                                │
│          │                                │
└──────────┴────────────────────────────────┘
```

Sidebar width: ~200px. Active item highlighted. App name at top. Collapses to bottom nav on narrow viewports.

### Overview page layout

```
┌────────────────────────────────────────────────────┐
│  Gross Burn        Net Cash Flow     Liquid Cash   │
│  $2,900/mo         −$1,900/mo        $3,500        │
│                                      1.8 mo runway │
│                                                    │
│  Window: [1mo]  3mo  6mo                           │
├────────────────────────────────────────────────────┤
│  Recent transactions                 [View all →]  │
│  ...                                               │
└────────────────────────────────────────────────────┘
```

- Runway figure appears only when net cash flow is negative
- When net cash flow is positive, replace runway with "Surplus: +$X/mo"
- When insufficient transaction history (<1 month): replace burn cards with "Connect accounts and sync transactions to calculate burn rate"
- When no accounts: replace entire content with "Add your first account to get started" + connect CTA

### Account card states

Each account in the Accounts view renders one of these states:

| State | Visual cue | Action |
|---|---|---|
| Plaid — synced | Last synced timestamp | Sync button |
| Plaid — syncing | Spinner | Disabled |
| Plaid — error / re-auth needed | Red indicator | Re-connect button |
| Manual — fresh | Last updated timestamp | Edit button |
| Manual — stale (>7 days) | Amber indicator + "Balance may be outdated" | Refresh button |
| Manual — Coinbase | Amber indicator + "Volatile asset — balance may differ at liquidation" | Edit button |

### Transaction list

- Filterable by: account, date range, merchant name search
- Columns: date, merchant, account, amount, category
- Tags column present but shows `—` placeholder in v2
- Amount formatted as outflow (positive, no sign) or inflow (green, with `+`)
- Default sort: date descending
- No drill-down in v2 (v9)

### Sync state model

Plaid sync operates per-item, not globally. Each `plaid_item` row has independent sync state:

```ts
type SyncState = 'idle' | 'syncing' | 'error';
```

The Overview and Accounts pages reflect per-account sync state. A single slow institution does not block the rest of the dashboard. Errors surface as inline account card warnings, not page-level alerts.
