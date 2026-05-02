# Personal Finance App — Spec

## Vision

A local-first, privacy-focused personal finance app that gives you an honest, complete picture of where you stand financially — from today's burn rate and runway to tax position, savings trajectory, and long-term retirement outlook. All data lives on your machine (SQLite). No cloud sync.

Budgeting is secondary. The primary questions are: *how long can I sustain my current life, what does it actually cost me to change that, and am I building toward the future I want?*

---

## Guiding Principles

- **Local-first**: SQLite on disk. No accounts, no cloud, no third-party data storage beyond what Plaid requires during sync.
- **Runway over budgets**: Net cash flow, burn rate, and how long reserves last matter more than whether you hit a $500 food category target.
- **Honest costs**: Whether it's liquidating savings (taxes, penalties, lost compounding), taking on debt (interest, minimum payments), or cutting expenses (long-term harm vs. short-term relief) — the real cost is always shown, not the optimistic version.
- **Intent over merchant**: Transactions are classified by what they mean to you, not what the merchant does. Plaid's categories are an internal implementation detail. Tags carry the context that drives insight — commute vs. vacation, business vs. personal, deductible vs. not.
- **Tax-aware by default**: Income type (W-2, 1099), charitable giving, business expenses, and estimated tax obligations are first-class citizens across the whole app, not a reporting afterthought.
- **Multi-account, multi-institution**: Chase, Capital One, USAA, Wealthfront via Plaid; Webull, Coinbase, Victory Capital, StartEngine via manual/CSV.

---

## Roadmap

### v1 — Current (Demo)
Single Plaid-connected bank. In-memory store. Category spend vs. hardcoded budgets. Month-over-month trends. No persistence.

### v2 — Foundation
- SQLite persistence
- Multiple bank accounts (Chase, Capital One, USAA, Wealthfront via Plaid)
- Manual balance entry for investment/savings accounts (Webull, Coinbase, Victory Capital, StartEngine)
- CSV import for accounts with export support
- Running totals and burn rate calculation
- Basic runway view (cash only)

### v3 — Runway Engine
- Savings account priority model with liquidation cost estimates
- Tiered runway projection (conservative → aggressive)
- Income tracking and net burn rate
- Trend-adjusted runway (uses 3-month rolling burn, not just current month)
- Scenario modeling ("what if I cut $X/mo?")

### v4 — Expense Intent
- Classify transactions as **overhead** (committed recurring spend) or **one-offs** (intentional, non-recurring)
- Overhead has a priority level (must-have vs. flexible/cuttable) and an expected duration
- Pattern detection: surface repeated merchants and ask the user to confirm intent
- Overhead committed floor feeds into runway and scenario modeling as a separate line
- Habit creep detection: one-offs that repeat get flagged for user review

### v5 — Liabilities
- Track existing liabilities (credit card balances, loans) as part of net worth
- Model taking on new debt as a runway extension option — an additional tier after savings drawdown, with a real cost (interest rate, minimum payments, repayment obligations)
- Runway with debt shown separately from savings-based runway so the tradeoff is explicit

### v6 — Income, Tax Classification & Business Tracking
- Multiple income sources with type (W-2, 1099, cash), frequency (ongoing / periodic / one-off), and gross vs. net distinction
- 1099 income: track gross received, estimate quarterly tax liability (SE tax + income tax), prompt for set-aside
- Tag transactions as charitable donations for Schedule A tracking
- Tag transactions or entire accounts as business expenses for Schedule C / LLC tracking
- Separate business P&L view alongside personal net cash flow

### v7 — Retirement & Savings Rate Projection
- Track savings rate (% of gross income going to investment accounts, contributions only vs. earnings)
- Project portfolio value at target retirement age using configurable return rate (default 7% real)
- Market rate configurable and optionally synced from a trusted source on a set schedule
- "At your current savings rate of X% you'll have ~$Y at age Z" — updates as contributions and burn rate change

### v8 — Data Portability & Reports
- JSON and CSV export of all app data, re-importable (full backup/restore)
- Excel and PDF report generation for sharing with tax preparer or financial advisor
- Reports scoped by date range, account, or tag

### v9 — Polish
- Transaction drill-down
- Merchant re-classification
- Tag management UI

### v10 — Historical Analysis
- PDF statement import and transaction extraction (for accounts where CSV exports aren't available or historical data predates digital exports)
- Multi-year trend analysis once sufficient history is loaded

---

## Feature Specs

### Running Totals

Track per-account and aggregate balances over time. Synced from Plaid where available; manually entered otherwise.

- Total net worth (all accounts summed)
- Liquid cash (checking + savings + Wealthfront Cash)
- Invested assets (brokerage + crypto + retirement, separately)
- 30/60/90-day spend totals

### Burn Rate and Net Cash Flow

**Gross burn rate** = total monthly cash outflows (all expenses). Always a positive number as long as any spending occurs — every person or organization with expenses has a gross burn rate.

**Net cash flow** = monthly income − gross burn rate, calculated as a rolling 3-month average.
- Positive = surplus (income exceeds expenses; reserves grow)
- Negative = deficit (expenses exceed income; reserves deplete)

**Net burn** = the magnitude of the deficit when net cash flow is negative. This is the denominator for runway. When net cash flow is positive there is no net burn — runway is not a relevant concern.

All three figures are shown together:

```
Gross burn rate      $2,900/mo
Net cash flow        -$1,900/mo   (after $1,000/mo income)
Net burn              $1,900/mo   (deficit — runway denominator)
```

### Runway

How long existing reserves last at the current net burn rate, expressed in months. Only calculated and surfaced when net cash flow is negative (net burn > 0). Shown in tiers based on which assets are available to draw down and in what order.

#### Savings liquidation priority

| Priority | Account | Type | Liquidation cost / notes |
|---|---|---|---|
| 1 (first) | Checking / Savings | Liquid cash | No cost, immediate |
| 2 | Wealthfront Cash | High-yield savings | No cost, 1–2 day transfer |
| 3 | Webull | Taxable brokerage | Cap gains tax (15% long-term if >1 yr, ordinary income if short-term); settlement T+1 |
| 4 | Wealthfront Investing | Taxable brokerage | Same as Webull; tax-loss harvesting may offset some gains |
| 5 | Coinbase | Crypto | Cap gains tax + high volatility risk; treat balance as uncertain |
| 6 | Victory Capital (Roth IRA) — contributions | Retirement | Contributions always withdrawable tax/penalty-free |
| 7 | Victory Capital (Roth IRA) — earnings | Retirement | 10% early withdrawal penalty + income tax on earnings before age 59½; permanent loss of tax-advantaged growth |
| — | StartEngine | Illiquid equity | No secondary market; treat as $0 for runway purposes unless a liquidity event occurs |

#### Tiered runway display

Each row shows the cumulative runway if you drew down through that tier:

```
Tier                             Available (est.)   Adds      Cumulative
─────────────────────────────────────────────────────────────────────────
Cash only                        $1,000             1.0 mo    1.0 mo
+ Wealthfront Cash               $2,500             2.5 mo    3.5 mo
+ Webull                         $4,800 (after tax) 4.8 mo    8.3 mo
+ Wealthfront Investing          $2,400 (after tax) 2.4 mo   10.7 mo
+ Coinbase                       $1,100 (after tax) 1.1 mo   11.8 mo
+ Roth IRA (contributions)       $8,000 (no cost)   8.0 mo   19.8 mo
+ Roth IRA (earnings)            $3,200 (after pen) 3.2 mo   23.0 mo
```

Tax/penalty estimates are configurable in settings (defaults: 15% long-term cap gains, 10% Roth early withdrawal penalty + 22% income tax on earnings).

#### Runway with liabilities *(v5)*

After savings tiers are exhausted, debt is a last resort for extending runway — but unlike savings drawdown it introduces ongoing obligations that increase gross burn rate. This must be shown honestly:

```
+ Personal loan ($10k @ 8% APR)  $9,600 (net of interest est.)   ~5 mo    28.0 mo
                                  adds $208/mo minimum payment to gross burn going forward
```

Existing liabilities (credit card balances, outstanding loans) are tracked as negative net worth items and factored into the overall financial picture even before the runway tier is reached.

#### Scenario toggle

Let the user ask "what if I cut monthly spend by $X?" or "what if income increases by $Y?" and see how runway changes across all tiers in real time — without saving it as the actual plan.

Once expense intent classification (v4) is in place, the scenario view gains a more precise control: "what if I cut all flexible overhead?" computes against the confirmed recurring spend list rather than a raw dollar estimate.

---

### Expense Intent Classification *(v4)*

The gap most personal finance tools miss: knowing which recurring spend is *intentional and committed* vs. *accidentally habitual*. This distinction matters for both burn rate accuracy and for meaningful scenario modeling.

#### Two expense types

**Overhead** — ongoing, recurring, explicitly acknowledged:

| Sub-type | Description | Example |
|---|---|---|
| Must-have | Would not cut except in dire situation | Rent, tuition, insurance |
| Flexible | Recurring but cuttable given sufficient motivation | Netflix, gym membership, subscriptions |

Each overhead item has:
- **Priority** (must-have / flexible)
- **Expected duration**: indefinite, or an end date / condition (e.g., "until graduation ~May 2026")
- **Monthly cost** (auto-calculated from transaction history or manually set)

**One-offs** — intentional, non-recurring purchases:
- A vacation, a concert ticket, a one-time equipment purchase
- Explicitly marked so they don't inflate the burn rate baseline or trigger trend alerts
- A dinner out *once* is a one-off; going every Friday is overhead

#### Pattern detection — habit creep

When a merchant or transaction pattern repeats on a regular cadence and has not been classified, surface a prompt:

> "You've spent at **[Merchant]** 4 times in the last 8 weeks (~$X/mo). Is this becoming a regular expense?"

User responses:
- **"Yes, it's overhead"** → classify with priority + expected duration
- **"No, these are intentional one-offs"** → mark explicitly; suppress future prompts for that merchant unless cadence significantly changes
- **"Remind me later"** → resurface after 2 more occurrences

Trigger threshold: 3+ transactions at the same merchant/category within a 60-day rolling window, where the gap between transactions is < 45 days.

#### Impact on burn rate and runway

Once overhead is classified, gross burn rate gains a structured breakdown:

```
Must-have overhead   $2,100/mo    (committed gross burn floor)
Flexible overhead      $350/mo    (recurring but cuttable)
One-offs (avg)         $450/mo    (trailing average of non-recurring spend)
─────────────────────────────────
Gross burn rate      $2,900/mo

Income               $1,000/mo
Net cash flow       -$1,900/mo
Net burn             $1,900/mo
```

Runway scenarios become concrete because each "what if" maps to a real number:
- **Floor scenario**: cut all flexible overhead → gross burn drops to $2,100/mo, net burn to $1,100/mo
- **Overhead only**: remove one-offs from baseline → gross burn $2,450/mo
- **As-is**: current gross burn including one-offs trailing average

The question "how long can I last if I cut everything non-essential?" gets a real answer instead of a made-up dollar estimate.

#### Net burn warning and cut list *(v4, exact UX TBD)*

When net cash flow goes negative (net burn begins), surface a persistent warning — a banner or similarly hard-to-ignore element. The goal is to make the user think about expense cuts *before* the app surfaces savings drawdown options.

The recurring expenses view in this state becomes a **cut list**:
- Flexible overhead items are visually highlighted as candidates to cut, each showing its monthly cost
- Must-have overhead items show a lock indicator — surfaced for context but not suggested as options
- Show a running total: "Cutting all flexible overhead would reduce gross burn by $X/mo, eliminating net burn"

This is an initial direction, not a fixed design. The core intent is: the path of least resistance should be reviewing cuttable expenses, not jumping straight to savings drawdown.

#### Financial health signals *(v4–v5)*

A set of proactive checks that run on sync and flag meaningful changes for user confirmation. These are distinct from the runway calculation — they watch for *behavioral drift* rather than just balance levels.

**1. Significant savings / investment balance drop**

When a savings or investment account balance drops by more than a threshold (e.g., > $500 or > 10% since last sync), prompt:

> "Your [Wealthfront Cash] balance dropped by $X since last sync. Was this intentional?"

- **Yes** — log it as a confirmed withdrawal, link to the burn rate narrative if relevant
- **No** — surface the account for review; could be fees, a missed transfer, or an unauthorized transaction

**2. Contribution reduction detection**

Track regular deposits *into* savings and investment accounts (outbound transfers that appear as recurring transactions). If those deposits stop or decrease:

- Cross-check whether the user still has active flexible overhead expenses
- If yes, prompt: *"Your contributions to [Wealthfront] have stopped or decreased. You have flexible recurring expenses totaling $X/mo. Consider reviewing those before reducing savings contributions."*

The logic here: reducing savings contributions to cover day-to-day expenses is a slow version of dipping into savings — it just doesn't feel like it yet. If the user has confirmed certain expenses as cuttable, stopping contributions without cutting those is worth flagging.

**3. Contribution reclassification prompt**

If a user has flexible overhead expenses *and* reduces savings contributions (or stops them entirely), those flexible items should resurface for re-confirmation:

> "You've marked [Netflix, gym] as flexible overhead. It looks like you may be covering these by reducing savings contributions rather than cutting them. Are these still flexible, or have they become must-haves?"

This prevents the classification from going stale. An expense the user said was cuttable six months ago may have quietly become non-negotiable — the app should surface that tension rather than silently hold onto an outdated label.

---

## Bank Connectivity

### Plaid — confirmed coverage

| Institution | Plaid products available |
|---|---|
| Chase | Assets, Auth, Balance, Income, Investments, Liabilities, Statements, Transactions, Transfer |
| USAA | Assets, Auth, Balance, Income, Liabilities, Transactions, Transfer |
| Capital One | Assets, Auth, Balance, Income, Liabilities, Transactions, Transfer |
| Wealthfront | Assets, Auth, Balance, Income, Investments, Investments Move, Transactions, Transfer |

Plaid Auth coverage is for instant credential-based connections only; micro-deposits available as fallback where instant is unsupported. Same caveat applies to Transfer.

For Wealthfront specifically: the app should treat the Cash account and Investing account as separate accounts with different account types (`savings` vs. `brokerage`) since their liquidation costs differ.

### Manual balance entry — required for

| Account | Why manual |
|---|---|
| Webull | No confirmed Plaid support |
| Coinbase | No confirmed Plaid support |
| Victory Capital (Roth IRA) | No confirmed Plaid support |
| StartEngine | Illiquid equity crowdfunding; no balance API |

Manual balances show a "last updated" timestamp and prompt for refresh when stale (>7 days). For Coinbase, surface a warning that the balance is volatile and the figure may be significantly different at time of liquidation.

### CSV / OFX import

Support statement import as a supplement to manual entry, particularly for transaction history on accounts without Plaid. Map common export formats (Webull CSV, Coinbase CSV) to the internal transaction schema.

### PDF statement import *(v10)*

For historical analysis where CSV exports are unavailable — older statements, accounts that only export PDF, or gaps in Plaid history.

- Extract raw text from PDF using a library like `pdfjs-dist` or `pdf-parse`
- Institution-aware parsing: each bank's statement layout is different; need a parser per institution (Chase, USAA, Capital One, etc.)
- Output is mapped to the same `Transaction` schema as CSV imports, with `importSource: 'pdf'`
- Duplicate detection against existing transactions (match on date + amount + normalized merchant name) to safely re-import overlapping date ranges
- Expect imperfect results: some PDFs are scanned images, not text — flag those for manual review rather than silently dropping transactions
- Primary use case is backfilling history, not ongoing data entry

---

## Transaction Organization: Tags vs. Categories

Most personal finance apps use categories as the primary organizing axis. The problem is that categories are **merchant-side** — they describe what the business does, not what the transaction means to you. That's the wrong axis for personal financial insight.

**The core problem**: the same merchant, same transaction type, can mean completely different things:

| Transaction | Plaid category | What it actually is |
|---|---|---|
| Shell, every Monday | `TRANSPORTATION` | Commute overhead — must-have recurring cost |
| Shell, during road trip | `TRANSPORTATION` | Vacation one-off |
| Shell, driving to a client | `TRANSPORTATION` | Business expense, potentially deductible |

No category rename or hierarchy fixes this. The information about *why* you made the purchase simply isn't in the merchant. Similarly: is internet "Rent and Utilities"? Is a work flight "Travel" or "Transportation"? These questions dissolve once you stop trying to answer them with categories.

**The hybrid approach**:

Three orthogonal dimensions per transaction, each answering a different question:

| Dimension | What it answers | Examples | Used for |
|---|---|---|---|
| **Category** | What did the merchant sell? | `transportation`, `food_and_drink`, `utilities` | Burn rate math, spend rollups |
| **Overhead type** | Is this recurring or a one-off? | `must-have`, `flexible`, `one-off` | Runway scenarios, cut lists, habit creep detection |
| **Tags** | Why did you spend it / what does it mean? | `commute`, `vacation`, `business`, `charitable`, `reimbursable` | Tax tracking, business P&L, trip analysis, anything cross-cutting |

The gas station example resolved:
```
transaction: "Shell Gas Station, $48"
  category: transportation      ← what was bought (Plaid, internal)
  overhead: must-have           ← recurrence / commitment
  tags: [commute]               ← why / context (user-side)

transaction: "Shell Gas Station, $52"
  category: transportation
  overhead: one-off
  tags: [vacation, road-trip-2026]
```

Same category, completely different financial treatment. The category handles math; overhead handles runway; tags handle everything contextual.

**Category is an implementation detail**: Plaid's raw category strings are never shown to the user as-is. They are mapped to a simplified internal set used only for aggregation. Users interact with overhead classification and tags — the two dimensions that actually carry meaning.

**System-suggested tags**: the app will suggest relevant tags based on merchant patterns, overhead classification, and context (e.g., a flight during a period with other `vacation`-tagged transactions gets a `vacation` suggestion). User confirms or overrides.

**Tag groups** (loosely structured, not enforced):
- *Intent*: `commute`, `vacation`, `business-travel`, `personal`
- *Tax*: `charitable`, `business`, `deductible`, `1099-expense`, `home-office`
- *Status*: `reimbursable`, `pending-reimbursement`, `reimbursed`
- *User-defined*: anything else

**Design implication**: `tags` must be in the Transaction schema from v2. Every transaction starts with `tags: []` and accumulates context over time. Retrofitting this onto years of existing transactions is painful — ship it from the start.

---

## Data Model (v2+)

### Account
```ts
{
  id: string
  name: string                  // "Chase Checking", "Wealthfront Cash", "Victory Capital Roth IRA"
  type: 'checking' | 'savings' | 'brokerage' | 'crypto' | 'retirement' | 'illiquid'
  institution: string
  plaidAccountId?: string       // if synced via Plaid
  manualBalance?: number        // if manually entered
  balanceUpdatedAt?: string
  liquidationPriority: number   // 1 = first to draw down; 0 = excluded (illiquid)
  liquidationCostPct: number    // estimated % lost to taxes/penalties on withdrawal
  notes?: string                // e.g. "contributions only — earnings tracked separately"
}
```

### Transaction
```ts
{
  id: string
  accountId: string
  date: string
  amount: number                // positive = expense, negative = income deposit
  name: string
  category: string              // primary category (required) — burn rate math axis
  tags: string[]                // flexible cross-cutting labels (charitable, business, reimbursable, etc.)
  plaidTransactionId?: string
  importSource?: 'plaid' | 'csv' | 'manual' | 'pdf'
}
```

### IncomeSource *(v6)*
```ts
{
  id: string
  name: string                  // "Employer", "Freelance Client A", "Rental income"
  type: 'w2' | '1099' | 'cash' | 'investment' | 'other'
  frequency: 'ongoing' | 'periodic' | 'one-off'
  grossMonthlyEstimate?: number // for 1099: gross before taxes; for W-2: optional, net is derived from transactions
  estimatedTaxRatePct?: number  // for 1099: self-employment tax + income tax estimate (default ~30%)
  active: boolean
}
```

### RunwaySnapshot (computed, not persisted)
```ts
{
  burnRateMonthly: number
  burnRateWindow: '1mo' | '3mo' | '6mo'
  tiers: Array<{
    accountId: string
    balanceRaw: number
    availableAfterCosts: number
    monthsAdded: number
    cumulativeMonths: number
  }>
}
```

---

## Tech Stack (v2+)

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | Current |
| DB | SQLite via `better-sqlite3` | Local-first, zero infra |
| ORM | Drizzle ORM | Lightweight, good SQLite support, type-safe |
| Bank data | Plaid (production tier) | Confirmed coverage for all four institutions |
| Styling | Tailwind CSS 4 | Current |
| Auth | None (single-user local app) | No need |

---

## Current Implementation (v1)

The app at `/src` is a working v1 demo:

- Plaid Sandbox connection (one account)
- In-memory token/cursor store (resets on restart)
- Transaction sync with category grouping
- Budget view (hardcoded monthly budgets, progress bars)
- Trend view (month-over-month % change per category)

No changes to v1 are needed before starting v2. It serves as a reference for the Plaid integration pattern.
