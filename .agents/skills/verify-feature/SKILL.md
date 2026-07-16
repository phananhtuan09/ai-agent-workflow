---
name: verify-feature
description: Use when the user asks to verify, check, or validate a feature against its latest synced spec. Generates a verification checklist, then continues with implementation verification instead of stopping at file creation.
---

# Verify Feature

Read the latest synced spec file and verify implementation readiness against the current codebase.

## Input

- Required: path to spec file (e.g. `docs/ai/specs/{feature-name}.md`)
- Optional: summary path (e.g. `docs/ai/summaries/{feature-name}.md`)
- Optional: focused file or module scope when the feature touches a narrow area

## Output

Write to: `docs/ai/verifications/{feature-name}.md`

After opening or creating the verification artifact, continue immediately with implementation verification for the relevant code paths and checks. Do not stop at scaffold creation.

## Verification Format

```markdown
## Sources
- Spec: docs/ai/specs/{feature-name}.md
- Summary: [optional]
- Existing Verification: [optional]

## Implementation Surfaces
- AC1 → [file/module/function]
- AC2 → [file/module/function]

## Evidence Strategy
- AC1 → [implementation check | focused automated test | runtime/E2E | manual checklist] → [reason]

## Executed Checks
- [check or inspection actually executed] → Pass/Fail/Blocked

## Passed
- [acceptance criteria or implementation checks supported by evidence]

## Failed
- [failed checks or unmet criteria with reason]

## Coverage Gaps
- [criteria or behaviors not yet proven at implementation level]

## Needs Runtime Verification
- [observable behaviors requiring browser/manual/runtime proof]

## Final Status
Pass | Fail | Partial | Blocked
```

## Rules

- All output files must be written in English
- Treat the provided spec file as the latest durable source of truth
- If `docs/ai/verifications/{feature-name}.md` already exists, read it first and preserve still-valid sections instead of rewriting blindly
- Map acceptance criteria to implementation surfaces before judging coverage
- For each AC, record the smallest suitable evidence strategy before judging coverage:
  - observable user behavior normally belongs to `/verify-runtime` using bounded runtime/E2E checks when a target is available
  - UX quality or business judgment normally belongs to human verification surfaced by `/manual-checklist`
  - lint, typecheck, build, and focused code inspection cover implementation-level correctness when relevant
  - a focused automated unit or integration test is warranted only when it has clear regression value: non-trivial validation or business rules, permission/authorization, persistence or state transitions, integration boundaries, or a regression bug
- Do not require unit or integration tests as a fixed workflow phase, and do not treat their absence alone as a failure for UI-first, simple, or test-hostile projects
- Do not create new test infrastructure or invent test cases in this verification phase; verify tests that implementation chose to add or update, plus existing relevant tests
- When a risk-sensitive behavior has neither focused automated evidence nor a credible runtime/manual evidence path, record the reason and missing evidence in `## Coverage Gaps`
- Record only implementation-level evidence in this phase
- Do not invent test cases beyond what the synced spec and implemented behavior require
- Do not include runtime-only evidence in this phase; move that into `/verify-runtime`
- If Open Questions remain unresolved, flag the affected checks as `Blocked`
- After opening or creating the file, continue with implementation verification and record actual findings or explicit `Blocked` reasons
- `/verify-feature` may update implementation-level sections, but must not delete valid runtime sections previously added by `/verify-runtime`
- If current implementation evidence conflicts with older verification content, replace only the conflicting implementation section and note the reason in `## Executed Checks` or `## Failed`
- Use final status:
  - `Pass` when all required implementation-level checks passed and no material coverage gaps remain
  - `Partial` when some checks passed but meaningful coverage gaps remain, especially risk-sensitive behavior without a credible evidence path
  - `Fail` when at least one required implementation-level check failed
  - `Blocked` when the phase cannot complete because required inputs, environment, or artifacts are unavailable
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
