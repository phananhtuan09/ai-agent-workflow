---
name: check-implementation
description: Validates implementation against planning doc.
---

Compare current implementation against planning doc.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- Provide a high-signal summary at completion highlighting key mismatches and next steps.

1. Ask me for:

- Feature name (if not provided)
- Then locate planning doc by feature name:
  - Planning: `docs/ai/planning/feature-{name}.md`

2. Validation Scope (no inference):

- Verify code follows the acceptance criteria from the planning doc
- Verify code matches the steps/changes in the implementation plan phases
- Check that completed tasks (marked `[x]`) have corresponding code changes
- Do NOT invent or infer alternative logic beyond what the docs specify

3. Output

- List concrete mismatches between code and planning doc
- List missing pieces the planning doc requires but code lacks
- List tasks marked complete `[x]` but code not implemented
- Short actionable next steps
