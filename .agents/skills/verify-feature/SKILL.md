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
- Record only implementation-level evidence in this phase
- Do not invent test cases beyond what the synced spec and implemented behavior require
- Do not include runtime-only evidence in this phase; move that into `/verify-runtime`
- If Open Questions remain unresolved, flag the affected checks as `Blocked`
- After opening or creating the file, continue with implementation verification and record actual findings or explicit `Blocked` reasons
- `/verify-feature` may update implementation-level sections, but must not delete valid runtime sections previously added by `/verify-runtime`
- If current implementation evidence conflicts with older verification content, replace only the conflicting implementation section and note the reason in `## Executed Checks` or `## Failed`
- Use final status:
  - `Pass` when all required implementation-level checks passed and no material coverage gaps remain
  - `Partial` when some checks passed but meaningful coverage gaps or deferred runtime proof remain
  - `Fail` when at least one required implementation-level check failed
  - `Blocked` when the phase cannot complete because required inputs, environment, or artifacts are unavailable
