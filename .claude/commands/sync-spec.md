Update an existing spec so it matches the implemented codebase state.

INPUT: path to spec file (e.g. `docs/ai/specs/{feature-name}.md`)

GOAL:
Keep the spec as the durable source of truth after implementation and feedback-driven code changes.

PROCESS:
1. Read the current spec completely
2. Identify:
   - acceptance criteria
   - key behavioral rules
   - technical approach
   - architecture or pattern notes
   - open questions
3. Inspect the relevant implemented code paths
4. Compare the codebase against the current spec
5. Update the spec in place using the rules below

AUTO-SYNC ALLOWED:
You may update these sections automatically when the codebase confirms them:
- `## Technical Approach`
- `## Architecture / Pattern Notes`
- `## Decision Log`
- implementation constraints
- technical clarifications
- status wording tied to implementation shape

HUMAN CONFIRMATION REQUIRED:
Do NOT silently change these sections:
- `## Problem`
- `## Scope`
- `## Acceptance Criteria`
- `## Key Behavioral Rules`
- `## Out of Scope`

If the implementation no longer matches those sections:
- do not force the code to fit the spec during sync
- propose a spec delta
- clearly state which section drifted
- ask for human confirmation before applying the business-level change

OUTPUT RULES:
- Update the same spec file in `docs/ai/specs/`
- Keep the spec concise and human-readable
- Add or update `## Decision Log` when implementation introduced important durable decisions
- Preserve unresolved product questions instead of guessing

DRIFT HANDLING:
When drift is technical-only:
- sync the spec directly

When drift changes user-visible behavior or acceptance:
- stop before applying that part
- report the proposed delta
- wait for confirmation

DONE WHEN:
- the technical sections match the implemented codebase
- important implementation decisions are reflected in the spec
- business-level drift is either confirmed and applied or explicitly reported as pending
