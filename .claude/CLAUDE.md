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
Routing rule: "Does scope need human approval first?"
| Task type                     | Workflow                                |
|-------------------------------|-----------------------------------------|
| New feature                   | /create-spec → /create-plan → /enrich-plan → /execute-plan → /verify-feature |
| Fix bug (clear)               | /create-plan "Fix: ..." → /execute-plan                                       |
| Refactor (no behavior change) | /create-plan "Refactor: ..." → /execute-plan                                  |
| Fix bug (ambiguous/large)     | /create-spec → /create-plan → /enrich-plan → /execute-plan                   |
| Small update (1-2 files)      | /execute-plan "inline task"                                                   |