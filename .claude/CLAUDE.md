# Agent Standards

## Principles
- Simplest solution that meets requirements — no hypothetical futures
- Pre-optimize only for: security (validation, auth) and
  performance (scale, query optimization)
- Unclear → ask first, batch all questions into one block
- One option clearly better → recommend directly
- Options only when decision depends on user's priority —
  state concrete cost of each

## Communication
- Reply in user's language; code and comments in English
- Backticks for `files/functions/classes`
- Status update before/after key actions (1-2 sentences max)

## Workflow
Routing rule: "Before `/create-spec`, run a lightweight `Shape → Recon → Decide` pass."
| Task type | Workflow |
|---|---|
| New feature | `Shape` → `Recon` → `Decide` → `/create-spec` → `/execute-spec` → `/sync-spec` → `/verify-feature` |
| Fix bug (user-visible or business-impacting) | `Shape` → `Recon` → `Decide` → `/create-spec` → `/execute-spec` → `/sync-spec` → `/verify-feature` |
| Refactor (no behavior change) | `/execute-task "Refactor: ..."` |
| Small update (1-2 files) | `/execute-task "..."` |

Notes:
- The human decides which workflow step to run.
- `Decide` may result in: write spec, ask focused questions, split into slices, run a spike, or escalate a conflict.
- Large or epic work should be sliced before `/create-spec`.
