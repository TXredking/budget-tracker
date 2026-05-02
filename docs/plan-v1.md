# Implementation Plan — v1

> Generated: 2026-05-02
> Based on: docs/spec.md (v1), docs/review.md (still valid findings)

---

## Already Implemented

v1 is a functional single-account Plaid Sandbox demo. The following is complete and working:

**Bank connection flow**
- `POST /api/create-link-token` — generates a Plaid Link token for the frontend
- `POST /api/exchange-token` — exchanges the public token from Plaid Link for a permanent access token
- `src/components/PlaidLinkButton.tsx` — opens the Plaid Link modal, triggers the exchange on success
- `src/lib/store.ts` — in-memory access token and cursor storage (demo only; replaced in v2)

**Transaction sync**
- `GET /api/transactions` — fetches transactions from Plaid Transactions Sync API with cursor-based pagination
- `src/lib/categorize.ts` — groups transactions by `personal_finance_category.primary`

**Dashboard**
- `src/components/Dashboard.tsx` — budget vs. actual spend per category with labeled progress bars (green / yellow / red by % used)
- `src/lib/budgets.ts` — hardcoded monthly budget targets per Plaid category
- `src/components/TrendView.tsx` — month-over-month spend change per category, rows highlighted when increase > 20%
- `src/lib/trends.ts` — groups transactions by YYYY-MM month, calculates % change between current and previous month

**UI flow**
- Three-state layout in `src/app/page.tsx`: no connection → connected (sync pending) → dashboard
- Toggle between Budget View and Trend View

---

## Fixes — All Done ✓

All three fixes shipped. An additional bug was discovered and fixed during PR 1 (see note below).

---

## ~~PR 1 — fix/plaid-link-error-handling~~ *(Done — commit 48d6c54)*

**What**: `PlaidLinkButton` never checks `response.ok` on either API call. A failed link token fetch silently passes `undefined` to Plaid Link; a failed token exchange silently calls `onConnected()` and marks the account as connected when it isn't.

**Files**:
- `src/components/PlaidLinkButton.tsx` (modify)

**Changes**:
- `fetchLinkToken`: check `response.ok`, set an error state and bail early if the request fails
- `onSuccess`: check `response.ok` on the exchange response; only call `onConnected()` on success, otherwise surface the error to the user
- Expose an `error` string state and render it below the button (same pattern as `page.tsx`)
- Strip the three remaining comments that narrate obvious code (missed in the cleanup pass)

**Acceptance criteria**:
- If `/api/create-link-token` returns a non-2xx, the button renders an error message and does not attempt to open Plaid Link
- If `/api/exchange-token` returns a non-2xx, `onConnected()` is not called and an error message is shown
- Happy path behaviour is unchanged

**Depends on**: none
**Size**: S

> **Bonus fix (same commit)**: `exchange-token/route.ts` was not resetting the sync cursor when storing a new access token. A stale cursor from a previous Plaid item caused 400 errors on the next `transactionsSync` call after reconnecting. `setCursor(null)` now called alongside `setAccessToken`; `setCursor` updated to accept `string | null`.

---

## ~~PR 2 — fix/transaction-sign-handling~~ *(Done — commit 5cc5701)*

**What**: `categorize.ts` and `trends.ts` both use `Math.abs(txn.amount)`, which counts refunds, income, and credits as spending. In Plaid's convention positive amounts are debits (money out) and negative amounts are credits (money in). Spend calculations should include only outflows.

**Files**:
- `src/lib/categorize.ts` (modify)
- `src/lib/trends.ts` (modify)

**Changes**:
- `categorize.ts` — in the reduce, filter to `t.amount > 0` before summing and drop `Math.abs`:
  ```ts
  const total = txns.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  ```
- `trends.ts` — same change in the per-category accumulation:
  ```ts
  (categoryMap.get(category) || 0) + (txn.amount > 0 ? txn.amount : 0)
  ```

**Acceptance criteria**:
- A refund transaction (negative amount) does not increase the category total or trend spend
- An income deposit (negative amount) does not appear as spending
- Positive outflows continue to accumulate correctly
- Sandbox test: confirm totals change when a known credit/refund transaction is present in the dataset

**Depends on**: none
**Size**: S

---

## ~~PR 3 — fix/plaid-env-config~~ *(Done — commit 36267a3)*

**What**: `plaid.ts` hardcodes `PlaidEnvironments.sandbox` and uses non-null assertions (`!`) on env vars with no validation. v2 requires production Plaid credentials — this must be configurable before that work starts.

**Files**:
- `src/lib/plaid.ts` (modify)
- `.env.local` example in `README.md` (modify)

**Changes**:
- Replace `PlaidEnvironments.sandbox` with a lookup from `PLAID_ENV`:
  ```ts
  const env = process.env.PLAID_ENV ?? 'sandbox';
  const basePath = PlaidEnvironments[env as keyof typeof PlaidEnvironments];
  if (!basePath) throw new Error(`Invalid PLAID_ENV: "${env}"`);
  ```
- Validate `PLAID_CLIENT_ID` and `PLAID_SECRET` explicitly and throw a clear error if either is missing, rather than relying on `!`
- Strip the two remaining comments that narrate obvious code
- Add `PLAID_ENV=sandbox` to the env var example in `README.md` with a note that valid values are `sandbox`, `development`, `production`

**Acceptance criteria**:
- Starting the server without `PLAID_CLIENT_ID` or `PLAID_SECRET` throws a readable error naming the missing variable
- Setting `PLAID_ENV=sandbox` (explicit) behaves identically to the current implicit default
- Setting an invalid `PLAID_ENV` value throws a readable error
- No behaviour change when all env vars are correct

**Depends on**: none
**Size**: S
