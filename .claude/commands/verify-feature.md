Verify implementation readiness against the latest synced spec and record what was actually checked.

INPUT:
- Required: spec path (e.g. docs/ai/specs/{feature-name}.md)
- Optional: summary path (e.g. docs/ai/summaries/{feature-name}.md)
- Optional: focused file or module scope when the feature touches a narrow area

OUTPUT: docs/ai/verifications/{feature-name}.md

IMPLEMENTATION WORKFLOW:
1. Read the synced spec.
2. If `docs/ai/verifications/{feature-name}.md` already exists, read it first and preserve still-valid sections instead of rewriting blindly.
3. Inspect the relevant implementation surfaces.
4. Map acceptance criteria to code areas before judging coverage.
5. Run only the relevant implementation checks for the changed feature.
6. Record passed checks, failed checks, coverage gaps, and runtime follow-ups.

EXECUTION REQUIREMENT:
- Creating `docs/ai/verifications/{feature-name}.md` is not sufficient by itself.
- Do not stop at scaffold or checklist generation.
- Complete the command only after you have either:
  - executed the relevant implementation checks and recorded their results, or
  - recorded explicit `Blocked` reasons for each check you could not run.

IMPLEMENTATION OUTPUT FORMAT:

## Sources
- Spec: docs/ai/specs/{feature-name}.md
- Summary: [optional]

## Implementation Surfaces
- AC1 → [file/module/function]
- AC2 → [file/module/function]

## Executed Checks
- Lint: [command] → Pass/Fail/Blocked
- Typecheck: [command] → Pass/Fail/Blocked
- Build: [command] → Pass/Fail/Blocked
- Tests: [command] → Pass/Fail/Blocked
- Migration Check: [command] → Pass/Fail/Blocked
- Docker Build: [command] → Pass/Fail/Blocked

## Passed
- [what has implementation evidence]

## Failed
- [what failed and why]

## Coverage Gaps
- [acceptance criteria or rules lacking implementation-level evidence]

## Needs Runtime Verification
- [observable behaviors to verify at runtime]

## Final Status
Pass | Fail | Partial | Blocked

RULES:
- All output files must be written in English
- Do not modify code, specs, or tests during implementation verification
- Do not write new unit tests in this command
- Run only the checks that are relevant to the feature's change type
- The verification artifact must contain actual findings from implementation inspection, not a blank template
- If a relevant check cannot run because of missing environment, setup, or tooling, mark it as `Blocked`
- If implementation evidence is incomplete but some checks passed, use final status `Partial`
- Keep runtime behavior judgments out of this phase; move them into `/verify-runtime`
- Do not include runtime-only evidence in this phase
- `/verify-feature` may update implementation-level sections, but must not delete valid runtime sections previously added by `/verify-runtime`
- If current implementation evidence conflicts with older verification content, replace only the conflicting implementation section and note the reason in `## Executed Checks` or `## Failed`
