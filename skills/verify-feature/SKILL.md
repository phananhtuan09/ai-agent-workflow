---
name: verify-feature
description: Use when the user asks to verify implementation-level evidence (code tests, build checks, API checks) against an approved spec and its structured testcase definitions. Appends detailed evidence to the verification record without touching the checklist.
---

# Verify Feature

Verify implementation-level evidence for testcase types that can be checked without a browser.

## Input

- Required: testcase definitions path, for example `docs/ai/features/checklists/{feature-name}-testcases.json`.
- Required: approved spec path, for example `docs/ai/features/specs/{feature-name}.md`.
- Required: verification record path, for example `docs/ai/features/verifications/{feature-name}.md`; create it when absent.
- Required: verification results path, for example `docs/ai/features/verifications/{feature-name}.json`; create it when absent.
- Optional: execution summary path, for example `docs/ai/features/summaries/{feature-name}.md`.
- Optional: focused file or module scope when the feature touches a narrow area.

## Output

Write the authoritative testcase result to `docs/ai/features/verifications/{feature-name}.json` and render the corresponding detail in `docs/ai/features/verifications/{feature-name}.md`.

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
5. Read risk tags and required scenarios from testcase definitions; do not infer a risk level from implementation confidence.
6. Filter testcases to `code_test`, `build_check`, and `api_check` only.
7. For each testcase, read its `done_criteria` from the JSON.
8. Execute the verification strategy that matches the `test_type`:
   - `code_test`: find and run the relevant test file
   - `build_check`: run the relevant tool (lint, typecheck, analyze)
   - `api_check`: send real API request and validate response
9. Compare evidence against `done_criteria.required` — all items must be satisfied for green.
10. Check evidence against `done_criteria.not_sufficient` — if any item matches, evidence is insufficient.
11. Record one structured result per evaluated testcase in the verification results JSON.
12. Append or replace that testcase's human-readable evidence in the verification record from the same result.
13. Record `skipped: runtime_e2e testcase, belongs to verify-runtime` for any skipped testcase.

For skipped runtime testcases, write a structured result with `executor: verify-runtime`, `result: skipped`, `classification: not_applicable`, empty `satisfied` and `evidence`, and a `missing` note naming `verify-runtime` as the executor.

## Structured Results And Freshness

The JSON result is authoritative for downstream classification.
Markdown is the human-readable rendering and must not be parsed by `verify-workflow` to determine pass or fail.

The results root must contain:

- `schema_version: 1`
- `feature`, `spec_path`, and `testcases_path`
- `spec_sha256` copied from testcase definitions after verifying the current spec bytes match it
- `testcases_sha256` computed from the current testcase-definition bytes
- `source_sha256` computed over `source_files` using `verify-workflow/scripts/validate_verification.py`
- `repair` with `max_attempts: 2` and an `attempts` array
- `results`, keyed by testcase ID

Each evaluated testcase result must contain:

- `executor`: `verify-feature`
- `result`: `pass`, `fail`, `partial`, or `blocked`
- `classification`: one of the classifications accepted by the validator
- `satisfied`, `missing`, and `evidence` arrays
- `verified_at`

Before preserving an earlier result, verify that its spec, testcase-definition, and source fingerprints still match.
When the scoped source fingerprint changes, start a new verification cycle by clearing stale testcase results and repair attempts while preserving the approved spec and testcase definitions.
When the spec or testcase-definition fingerprint changes, stop with `stop-drift` so the upstream review/checklist contract can be regenerated.
Never reuse evidence from a different fingerprint.

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

- Do not modify specs or testcase definitions during verification.
- Production code and focused tests may be repaired only under the bounded repair rules below.
- Do not create test infrastructure.
- Do not touch the checklist file.
- Existing relevant tests may be executed.
- Detailed evidence belongs in the verification record.

## Bounded Auto-Repair

When direct evidence confirms an `implementation_defect`, repair it without human intervention only when the fix stays inside the approved behavior and affected source scope.

The bounded loop is:
`verify → classify → (implementation_defect in scope ? repair + record attempt → verify again : stop/continue)`.
The verifier must finish the loop inside this step; it must not hand an implementation defect to a later phase without first checking whether the bounded repair conditions apply.

Rules:

- Allow at most two repair attempts across the shared verification results file.
- Record each attempt with `skills/verify-workflow/scripts/record_repair_attempt.py`; this command rejects a third attempt, non-implementation classifications, unchanged fingerprints, and empty summaries.
- The command must run after the focused repair and before rerunning verification, with the failed testcase IDs and both source fingerprints supplied explicitly.
- Record attempt number, failed testcase IDs, source fingerprint before and after, and a short change summary.
- After a repair, rerun the failed testcase and any already-green testcase whose source surface changed.
- Stop immediately without repair for `spec_ambiguity`, `scope_change`, `risk_authority`, or `environment_blocker`.
- Stop when the same testcase fails with the same observable failure after a repair, or when the source fingerprint did not change.
- Never broaden expected behavior, weaken a testcase, relax required evidence, or accept security or destructive-operation risk to make the run pass.
- Recompute `source_sha256` after every repair and attach all later evidence only to the new fingerprint.

## Orchestrator Contract

When this skill is run under `/orchestrator`, append exactly one HTML comment as the final output line:

- Final status `Pass` or `Partial`:
  `<!-- orchestrator: outcome=continue provides=verification_path,verification_results_path verification_path=docs/ai/features/verifications/{feature-name}.md verification_results_path=docs/ai/features/verifications/{feature-name}.json -->`
- Final status `Fail`:
  `<!-- orchestrator: outcome=stop-fail -->`
- Final status `Blocked`:
  `<!-- orchestrator: outcome=stop-blocked -->`
- Spec or testcase-definition freshness mismatch:
  `<!-- orchestrator: outcome=stop-drift -->`

Rules:

- Emit the comment only after the verification record has been updated.
- `verification_path` must match the file actually written or updated.
- If this skill runs standalone, the comment is optional.
