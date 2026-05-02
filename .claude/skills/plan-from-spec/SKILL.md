---
name: plan-from-spec
description: Generate a PR-by-PR implementation plan from docs/spec.md for a target version. Writes to docs/plan-<version>.md. If no version is given, asks the user to pick one.
---

## Spec

!`cat docs/spec.md`

## Existing plan files

!`ls docs/plan-*.md 2>/dev/null || echo "none"`

## Instructions

Target version from arguments: "$ARGUMENTS"

**Step 1 — Confirm the target version**

If `$ARGUMENTS` is empty or not a recognizable version from the roadmap:
- List the available unbuilt versions from the spec above (everything after the "Current" version)
- Ask the user which version they want to plan
- Do not proceed to step 2 until they answer

**Step 2 — Determine the output file**

The output file is `docs/plan-<version>.md` where `<version>` is the version identifier lowercased with no spaces, e.g. `plan_v2.md`, `plan_v3.md`.

Check the existing plan files listed above:
- If `docs/plan-<version>.md` does **not** exist → create it fresh
- If `docs/plan-<version>.md` **already exists** → ask the user: "A plan for this version already exists. Overwrite it, or append a revised section?" Wait for their answer before writing.

**Step 3 — Build the plan**

Read the full spec section for the confirmed target version. Write the file with a complete implementation plan where **one task = one pull request** — each PR is a discrete, independently reviewable, and mergeable unit of work. A PR should never mix infrastructure changes with feature work unless they are truly inseparable.

Use this format for each PR:

---

```
## PR N — <branch-name>

**What**: 1–2 sentences. What changes and why it's needed.

**Files**:
- `path/to/file.ts` (create | modify)

**Acceptance criteria**:
- Specific, verifiable conditions that define "done"
- Include any migration steps, env vars needed, or manual verification steps

**Depends on**: PR N (or "none")
**Size**: S = under half a day · M = half to full day · L = one to two days
```

---

**Ordering rules**:
1. Database schema and migrations before any code that touches them
2. Infrastructure / config (new packages, env vars, db connection) before feature code
3. Data layer (queries, lib functions) before UI that calls them
4. New API routes before frontend that calls them
5. Tests and integration wiring last, unless a PR is too small without them

**Scope guidance**:
- If a PR would touch more than ~5 files it is probably too large — split it
- If two PRs are always merged together they should be one PR
- Prefer vertical slices (one full feature end-to-end) over horizontal layers (all models, then all routes, then all UI) where the feature is small enough

**File header** (always at the top of the file, whether creating or appending):

```markdown
# Implementation Plan — <version label from spec>

> Generated: <today's date>
> Based on: docs/spec.md

---
```

When appending, add a `---` divider and a `## Revision — <today's date>` heading before the new content.

**After writing**, give the user a brief summary:
- Output file path
- Total PR count
- Critical path (the longest dependency chain)
- Any open design questions that must be resolved before a specific PR can start
