<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Context

This is a local-first personal finance app. Before writing any code, read:
- `docs/spec.md` — vision, guiding principles, full feature roadmap, and data model
- `docs/design.md` — architectural decisions (ORM choice, navigation structure) and v2 implementation details (DB schema, route structure, component states)
- `docs/review-2026-05-02.md` — known issues and their status (superseded vs. still valid)
- The relevant `docs/plan-v*.md` for the version being worked on

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: SQLite via `better-sqlite3` + Drizzle ORM (from v2; v1 uses in-memory store)
- **Bank data**: Plaid (Sandbox in v1; production credentials from v2)

## Key conventions

- All docs use kebab-case filenames (`plan-v2.md`, `testing-plan.md`)
- No comments that narrate obvious code — only comments for non-obvious constraints or caveats
- Transactions use Plaid's sign convention: positive = outflow (debit), negative = inflow (credit/refund)
- Primary category (from Plaid) is an internal field for math; user-facing classification uses overhead type + tags
