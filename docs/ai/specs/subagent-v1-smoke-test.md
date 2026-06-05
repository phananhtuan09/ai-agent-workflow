## Problem
A user needs a tiny smoke-test feature to validate the spec-driven Pi sub-agent workflow end to end without touching product code.

## Solution
Create a temporary markdown note file and document a short workflow for generating it.

## Acceptance Criteria
- [ ] AC1: A user can review this spec with `/review-spec` and receive a concise verdict.
- [ ] AC2: A user can enrich a plan for this feature and get phase detail files.
- [ ] AC3: A user can run readiness review on the spec, plan, and generated phase detail files.
- [ ] AC4: The workflow stays ephemeral for review output and does not create review result files automatically.
- [ ] AC5: All review commands use explicit artifact paths.

## Out of Scope
- Any production code changes
- Persistent review result files
- Additional sub-agent commands

## Open Questions
- none
