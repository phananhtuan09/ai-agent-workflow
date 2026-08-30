---
name: verify-feature
description: Use when the user asks to verify implementation-level evidence (code tests, build checks, API checks) against an approved spec and its structured testcase definitions. Appends detailed evidence to the verification record without touching the checklist.
---

# Verify Feature

Verify implementation-level evidence for testcase types that can be checked without a browser.

## Input

- Required: testcase definitions path, for example `docs/ai/features/checklists/{feature-name}-testcases.json`.
- Required: approved spec path, for example `docs/ai/features/specs/{feature-name}.md`.
- Required: existing verification record path, for example `docs/ai/features/verifications/{feature-name}.md`.
- Optional: execution summary path, for example `docs/ai/features/summaries/{feature-name}.md`.
- Optional: focused file or module scope when the feature touches a narrow area.

## Output

Append evidence to `docs/ai/features/verifications/{feature-name}.md`.

**This skill does NOT modify the checklist.** The checklist is updated only by `verify-workflow` after all evidence is collected.

## Scope

This skill handles only these test types:
- `code_test`: unit/integration tests executed through a test runner
- `build_check`: compile, lint, typecheck, or static analysis
- `api_check`: real API request with response validation

Testcases with `test_type: runtime_e2e` belong to `verify-runtime`. Skip them entirely and record `skipped: runtime_e2e testcase, belongs to verify-runtime` in the verification record.

## Source Of Truth And Ownership

- Treat the approved spec as the only source of truth for expected behavior.
- Treat testcase definitions as a projection of that spec.
- Read code, tests, and build output only as evidence about whether the implementation satisfies the spec.
- Do not add, delete, split, merge, or rewrite testcase definitions from code or implementation behavior.
- Do not change a testcase expected result to match the implementation.
- If code behavior conflicts with the spec, record drift and mark the affected testcase red.
- If a required behavior is missing from the testcase definitions because the spec is unclear, record a spec gap instead of inventing a testcase expectation.

## Verification Workflow

1. Read the testcase definitions JSON completely.
2. Read the approved spec completely.
3. Read the existing verification record if it exists.
4. Read the execution summary when provided, but treat it only as a navigation aid.
5. Filter testcases to `code_test`, `build_check`, and `api_check` only.
6. For each testcase, read its `done_criteria` from the JSON.
7. Execute the verification strategy that matches the `test_type`:
   - `code_test`: find and run the relevant test file
   - `build_check`: run the relevant tool (lint, typecheck, analyze)
   - `api_check`: send real API request and validate response
8. Compare evidence against `done_criteria.required` — all items must be satisfied for green.
9. Check evidence against `done_criteria.not_sufficient` — if any item matches, evidence is insufficient.
10. Append detailed evidence to the verification record.
11. Record `skipped: runtime_e2e testcase, belongs to verify-runtime` for any skipped testcase.

## Evidence Classification

Read `skills/verify-workflow/references/evidence-rules.md` for the complete evidence rules.

Key rule: evidence must match the testcase's `done_criteria.required` items. If the done_criteria requires "test file exists and test passes" and you only ran lint, the evidence is insufficient — do not mark green.

## Verification Record Format

Append or update these sections in the verification record:

```markdown
## Implementation Verification — {timestamp}

### Sources
- Testcase definitions: docs/ai/features/checklists/{feature-name}-testcases.json
- Approved spec: docs/ai/features/specs/{feature-name}.md

### Testcases Verified
| Testcase | Test type | Done criteria satisfied | Evidence | Result |
|---|---|---|---|---|
| TC-001 | code_test | [list of satisfied criteria] | [command, output, assertion] | Pass |
| TC-002 | build_check | [list of satisfied criteria] | [tool output] | Pass |

### Skipped (runtime_e2e)
- TC-003: runtime_e2e testcase, belongs to verify-runtime

### Failed
- [testcase with concrete reason]

### Spec Gaps / Drift
- [implementation conflict or unclear expected behavior]

### Coverage Summary
- Verified: {n}/{total}
- Skipped (runtime_e2e): {n}
- Failed: {n}
```

## Final Status Rules

- `Pass`: all implementation-level testcases passed with evidence matching their done_criteria.
- `Partial`: some implementation-level testcases passed but material gaps remain.
- `Fail`: at least one implementation-level testcase failed.
- `Blocked`: required inputs, environment, or artifacts prevented meaningful verification.

## Artifact Boundaries

- Do not modify code, tests, specs, or testcase definitions during verification.
- Do not repair failures in this phase.
- Do not create test infrastructure.
- Do not touch the checklist file.
- Existing relevant tests may be executed.
- Detailed evidence belongs in the verification record.

## Orchestrator Contract

When this skill is run under `/orchestrator`, append exactly one HTML comment as the final output line:

- Final status `Pass` or `Partial`:
  `<!-- orchestrator: outcome=continue provides=verification_path verification_path=docs/ai/features/verifications/{feature-name}.md -->`
- Final status `Fail`:
  `<!-- orchestrator: outcome=stop-fail -->`
- Final status `Blocked`:
  `<!-- orchestrator: outcome=stop-blocked -->`

Rules:

- Emit the comment only after the verification record has been updated.
- `verification_path` must match the file actually written or updated.
- If this skill runs standalone, the comment is optional.
