---
name: verify-feature
description: "Use when the user asks to verify, check, or validate a feature against its latest synced spec. Generates a verification checklist, then continues with implementation verification instead of stopping at file creation."
---

# Verify Feature

Verify implementation readiness against the latest synced spec and record what was actually checked.

## Input

- Required: spec path (e.g. `docs/ai/specs/{feature-name}.md`)
- Optional: summary path (e.g. `docs/ai/summaries/{feature-name}.md`)
- Optional: focused file or module scope when the feature touches a narrow area

## Output

`docs/ai/verifications/{feature-name}.md`

## Implementation Workflow

1. Read the synced spec.
2. If `docs/ai/verifications/{feature-name}.md` already exists, read it first and preserve still-valid sections instead of rewriting blindly.
3. Inspect the relevant implementation surfaces.
4. Map acceptance criteria to code areas before judging coverage.
5. Run only the relevant implementation checks for the changed feature.
6. Record passed checks, failed checks, coverage gaps, and runtime follow-ups.

## Execution Requirement

- Creating `docs/ai/verifications/{feature-name}.md` is not sufficient by itself.
- Do not stop at scaffold or checklist generation.
- Complete the command only after you have either:
  - Executed the relevant implementation checks and recorded their results, or
  - Recorded explicit `Blocked` reasons for each check you could not run.

## Implementation Output Format

```markdown
## Sources
- Spec: docs/ai/specs/{feature-name}.md
- Summary: [optional]

## Implementation Surfaces
- AC1 → [file/module/function]
- AC2 → [file/module/function]

## Evidence Strategy
- AC1 → [implementation check | focused automated test | runtime/E2E | manual checklist] → [reason]

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
```

## Rules

- All output files must be written in English
- Do not modify code, specs, or tests during implementation verification
- Do not write new unit tests in this command
- Run only the checks that are relevant to the feature's change type
- For each AC, record the smallest suitable evidence strategy before judging coverage:
  - observable user behavior normally belongs to `/verify-runtime` using bounded runtime/E2E checks when a target is available
  - UX quality or business judgment normally belongs to human verification surfaced by `/manual-checklist`
  - lint, typecheck, build, and focused code inspection cover implementation-level correctness when relevant
  - a focused automated unit or integration test is warranted only when it has clear regression value: non-trivial validation or business rules, permission/authorization, persistence or state transitions, integration boundaries, or a regression bug
- Do not require unit or integration tests as a fixed workflow phase, and do not treat their absence alone as a failure for UI-first, simple, or test-hostile projects
- Do not create new test infrastructure or invent test cases in this verification phase; verify tests that implementation chose to add or update, plus existing relevant tests
- When a risk-sensitive behavior has neither focused automated evidence nor a credible runtime/manual evidence path, record the reason and missing evidence in `## Coverage Gaps`
- The verification artifact must contain actual findings from implementation inspection, not a blank template
- If a relevant check cannot run because of missing environment, setup, or tooling, mark it as `Blocked`
- Use `Partial` when meaningful coverage gaps remain, especially risk-sensitive behavior without a credible evidence path
- Keep runtime behavior judgments out of this phase; move them into `/verify-runtime`
- Do not include runtime-only evidence in this phase
- `/verify-feature` may update implementation-level sections, but must not delete valid runtime sections previously added by `/verify-runtime`
- If current implementation evidence conflicts with older verification content, replace only the conflicting implementation section and note the reason in `## Executed Checks` or `## Failed`
- Deferred runtime or manual proof alone is not a `Partial` result here when it is explicitly assigned to `/verify-runtime` or `/manual-checklist`

## Orchestrator Contract

When this skill is run under `/orchestrator`, append exactly one HTML comment as the final output line:

- Final status `Pass` or `Partial`:
  `<!-- orchestrator: outcome=continue provides=verification_path verification_path=docs/ai/verifications/{feature-name}.md -->`
- Final status `Fail`:
  `<!-- orchestrator: outcome=stop-fail -->`
- Final status `Blocked`:
  `<!-- orchestrator: outcome=stop-blocked -->`

Rules:
- Emit the comment only after the main human-readable response is complete
- `verification_path` must match the artifact actually written or updated
- If this skill runs standalone, the comment is optional
