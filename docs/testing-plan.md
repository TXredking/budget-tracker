# Testing Plan

## Philosophy

E2E tests are the primary layer. Unit tests are reserved for pure financial calculation functions that have non-obvious edge cases. Everything else — API routes, components, UI state — is better covered by E2E.

---

## Stack

| Tool | Purpose |
|---|---|
| **Playwright** | E2E — full user flows against a running Next.js dev server |
| **Vitest** | Unit — pure calculation functions in `src/lib/` |

---

## The Plaid Problem

The Plaid Link modal is a third-party iframe served from Plaid's servers. It cannot be directly driven in automated tests. The solution is to mock the three app API routes that wrap Plaid and test everything from the app outward — skipping the modal itself, which is Plaid's code, not ours.

Playwright's `page.route()` intercepts fetch calls before they leave the browser, making this straightforward:

```ts
await page.route('/api/create-link-token', route =>
  route.fulfill({ json: { link_token: 'test-token' } })
);
await page.route('/api/exchange-token', route =>
  route.fulfill({ json: { success: true } })
);
await page.route('/api/transactions', route =>
  route.fulfill({ json: { added: mockTransactions, modified: [], removed: [] } })
);
```

---

## E2E Coverage (Playwright)

### Happy path
- Connect bank → sync transactions → budget view renders with correct category totals
- Toggle from budget view to trend view

### Error states
- `/api/create-link-token` returns non-2xx → error message shown, Plaid Link not opened
- `/api/exchange-token` returns non-2xx → error message shown, app does not advance to connected state
- `/api/transactions` returns non-2xx → error message shown, dashboard not rendered

### Data edge cases
- Empty transaction list → dashboard renders without crashing
- Transactions with negative amounts (refunds, income) → not counted as spending
- Single month of transactions → trend view shows "not enough data" message
- Transactions spanning multiple months → trend view shows correct current vs. previous month

---

## Unit Coverage (Vitest)

Only for pure functions in `src/lib/`. Each function has edge cases that are worth pinning independently of the UI.

### `categorizeTransactions` (`src/lib/categorize.ts`)
- Transactions with a known `personal_finance_category.primary` are grouped correctly
- Transactions with null or missing category fall back to `UNCATEGORIZED`
- Negative amounts (refunds, income) are excluded from totals
- Results are sorted by total descending

### `compareToBudget` (`src/lib/budgets.ts`)
- Known category uses its specific budget
- Unknown category uses the default budget (`$250`)
- `percentUsed` calculates correctly, including values over 100%
- `remaining` is negative when over budget

### `calculateTrends` (`src/lib/trends.ts`)
- Single month of data returns `{ trends: [], hasEnoughData: false }`
- Two months of data returns `hasEnoughData: true` with correct `percentChange`
- Category present in current month but not previous → `percentChange: null`, `increased: false`
- Category present in previous month but not current → included with `currentMonth: 0`
- Negative amounts excluded from monthly totals
- `increased` is true only when `percentChange > 20`

---

## What Is Not Tested

- The Plaid Link modal — third-party iframe, Plaid's responsibility
- `src/lib/store.ts` — in-memory demo store, replaced entirely in v2
- `src/lib/plaid.ts` — Plaid SDK configuration, not application logic
- API route internals — covered by E2E via mocked responses

---

## Future Additions

As v2+ features are built, extend this plan:

- **v2**: E2E flows for multi-account connection, transaction persistence across page reloads, CSV import
- **v3**: Unit tests for burn rate and runway calculation functions; E2E for tiered runway display
- **v4**: Unit tests for pattern detection logic (habit creep threshold); E2E for overhead classification prompts
