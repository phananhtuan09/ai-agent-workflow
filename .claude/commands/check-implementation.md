---
name: check-implementation
description: Executes the implementation doc tasks, edits code, and persists notes.
---

Compare current implementation against planning and implementation notes.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- Provide a high-signal summary at completion highlighting key mismatches and next steps.

1. Ask me for:

- Feature name (if not provided)
- Then locate docs by feature name:
  - Planning: `docs/ai/planning/feature-{name}.md`
  - Implementation (optional): `docs/ai/implementation/feature-{name}.md`

2. Validation Scope (no inference):

- Verify code follows the acceptance criteria from the planning doc
- Verify code matches the steps/changes in the implementation notes (when present)
- Do NOT invent or infer alternative logic beyond what the docs specify

3. Output

- List concrete mismatches between code and docs
- List missing pieces the docs require but code lacks
- Short actionable next steps
