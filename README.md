# Budget Tracker

Personal finance dashboard built with Next.js and Plaid. Connects to a bank account via Plaid, syncs transactions, and shows spending by category with month-over-month trends.

## Prerequisites

- Node.js 18+
- A [Plaid](https://plaid.com) account with Sandbox credentials

## Environment variables

Create a `.env.local` file at the project root:

```
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
```

Both values are available in the [Plaid Dashboard](https://dashboard.plaid.com) under Team Settings → Keys.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs against the Plaid Sandbox environment. Use Plaid's [test credentials](https://plaid.com/docs/sandbox/test-credentials/) when prompted by the bank connection flow — no real bank account is needed or accessed.

## Project structure

```
src/
  app/
    page.tsx                  # Main UI — connection flow and dashboard state
    api/
      create-link-token/      # POST — generates a Plaid Link token
      exchange-token/         # POST — exchanges public token for access token
      transactions/           # GET  — syncs transactions from Plaid
  components/
    PlaidLinkButton.tsx       # Plaid Link modal integration
    Dashboard.tsx             # Budget vs. actual spend view
    TrendView.tsx             # Month-over-month trend view
  lib/
    plaid.ts                  # Plaid SDK client
    store.ts                  # In-memory token/cursor store (demo only)
    categorize.ts             # Groups transactions by Plaid category
    budgets.ts                # Compares category spend to hardcoded monthly budgets
    trends.ts                 # Calculates month-over-month % change per category
```

## Known limitations

This is a demo. The in-memory store in `src/lib/store.ts` resets on every server restart and is not suitable for production use. See `docs/spec.md` for the planned persistence and multi-account roadmap.
