---
name: verify-workflow
description: "Use when the human wants to validate structured verification results and update the checklist with final status. Validates completeness and freshness without parsing Markdown for pass/fail state. Do not use to write production code, run tests, or repair failures."
---

# Verify Workflow

Validate verification evidence and update the checklist with final status.

This skill is the final step in the verification pipeline.
It does not run tests, drive browsers, or collect evidence itself.
It reads the structured results produced by `verify-feature` and `verify-runtime`, validates their completeness and freshness, and updates the checklist.

## Flow

```
1. manual-checklist  → creates checklist.md + testcase-definitions.json
2. verify-feature    → writes results JSON + implementation evidence Markdown
3. verify-runtime    → updates results JSON + E2E evidence Markdown
4. verify-workflow   → validates structured results → updates checklist.md
```

This skill runs step 4.

## Input

- Required: feature slug, for example `{feature-name}`.
- Required: approved spec path, for example `docs/ai/features/specs/{feature-name}.md`.
- Required: testcase definitions path, for example `docs/ai/features/checklists/{feature-name}-testcases.json`.
- Required: verification record path, for example `docs/ai/features/verifications/{feature-name}.md`.
- Required: verification results path, for example `docs/ai/features/verifications/{feature-name}.json`.
- Required: checklist path, for example `docs/ai/features/checklists/{feature-name}.md`.

## Output

Update `docs/ai/features/checklists/{feature-name}.md` with final evidence status.

## Validation Phase

Before updating the checklist, validate the artifacts:

### 1. Validate testcase-definitions.json schema

`validate_verification.py` enforces this schema before any checklist mutation. Check that the JSON file contains:
- `feature` field (string)
- `spec_path` field (string)
- `spec_sha256` field (64 lowercase hex string)
- `source_files` field (non-empty repository-relative path array)
- `source_files_origin` field equal to `git-working-tree+explicit`, proving the scope came from the collector rather than a hand-typed subset
- `risk_tags` and `risk_exceptions` fields (arrays)
- `testcases` array (non-empty)
- Each testcase has: `id`, `ac`, `test_type`, `steps`, `expected`, `done_criteria`
- Each `done_criteria` has: `required` (array), `not_sufficient` (array)
- `test_type` values are defined in the project config

If validation fails, stop and report:
```
Planning defect: testcase-definitions.json has invalid schema.
{specific error}
Fix the testcase definitions before running verification.
```

### 2. Validate structured results and freshness

Run:

```bash
python3 skills/verify-workflow/scripts/validate_verification.py \
  --testcases {testcases_path} \
  --results {verification_results_path} \
  --spec {spec_path} \
  --repo-root {repo_root} \
  --config skills/verify-workflow/references/verify-config.json \
  --complete
```

Stop without changing the checklist if validation fails.
Report whether the spec, testcase definitions, implementation source, or result schema is stale.
Do not recover status by parsing Markdown.

### 3. Cross-check test_type assignment

- `code_test`, `build_check`, `api_check` testcases should have evidence from `verify-feature`
- `runtime_e2e` testcases should have evidence from `verify-runtime`
- If a testcase type has no matching evidence section, record it as `🔴 Chưa chạy`

### 4. Validate risk-policy coverage

- Read `risk_tags` and `risk_exceptions` from testcase definitions.
- For every tag declared by `risk_policies` in the project config, require coverage for each configured test type and scenario.
- Accept an omission only when `risk_exceptions` identifies the exact requirement and gives a spec-backed reason.
- Unknown risk tags or silent omissions are planning defects, not partial verification.
- Do not calculate or infer a hidden numeric risk score.

## Migration And Compatibility

Read `skills/verify-workflow/MIGRATION.md` when a legacy manifest, gate, judge, or intent-mode artifact is encountered.

- Existing Markdown verification records remain readable, but they are not sufficient to establish a final status after this contract change.
- Existing testcase definitions without `spec_sha256`, `source_files`, `source_files_origin`, or risk fields must be regenerated with `/manual-checklist` before verification can continue.
- Existing evidence is never upgraded automatically; rerun the affected verifier to create structured results with fresh fingerprints.
- The removed experimental manifest/gate/judge files are no longer a second verification source of truth.
- Legacy invocations are retained only as deprecation shims; migrate to `validate_verification.py`, `record_repair_attempt.py`, and the structured results JSON.

## Checklist Update Phase

Read `skills/verify-workflow/references/evidence-rules.md` for the complete evidence rules.

For each testcase in the JSON:

1. Find the matching entry in the verification results JSON
2. Classify evidence status using the rules from evidence-rules.md:
   - `🟢`: All `done_criteria.required` items satisfied, no `not_sufficient` items matched
   - `🟡`: Some evidence exists but incomplete or indirect
   - `🔴`: No evidence, or evidence contradicts expected result
3. Update the checklist line:
   - Change icon from `🔴` to `🟢` or `🟡`
   - Update AI verification note to one short method-and-result phrase
   - Remove `[ ]` task marker only for green testcases

For regression testcases (`RG-*`):
- Apply the same evidence classification rules
- Keep regression counts separate from spec testcase counts

## Summary Update

After updating all testcase statuses, update the checklist summary section:

```markdown
## Tóm tắt xác minh
- Tổng số ca kiểm thử: {N}
- 🟢 Đã xác minh đầy đủ: {green}/{N} ({green_percent}%)
- 🟡 Có bằng chứng một phần: {yellow}/{N} ({yellow_percent}%)
- 🔴 Cần người kiểm tra: {red}/{N} ({red_percent}%)
- Tiêu chí chấp nhận được bao phủ đầy đủ: {covered_ac}/{total_ac}
- Bằng chứng chi tiết: docs/ai/features/verifications/{feature-name}.md
```

Update the `## Rủi ro chưa kiểm` section if there are untested surfaces.

## Final Status

Determine the overall verification status:

- `ĐẠT`: all testcases are green
- `KHÔNG ĐẠT`: at least one testcase is red with confirmed failure
- `CẦN BẠN XÁC NHẬN`: at least one testcase is yellow
- `BỊ CHẶN`: verification could not run due to missing environment or artifacts

Freshness or schema failure is `BỊ CHẶN`, and the existing checklist statuses remain unchanged.

## Human-Facing Output

Return a short status in Vietnamese:

```text
KẾT QUẢ: {ĐẠT | KHÔNG ĐẠT | CẦN BẠN XÁC NHẬN | BỊ CHẶN} — {lý do ngắn}

🟢 {n}/{total} spec   🟡 {n}/{total} spec   🔴 {n}/{total} spec
🟢 {n}/{total} regression

  🔴 {TC-ID}  {một dòng: thực tế sai gì}
  🟡 {TC-ID}  {một dòng: thiếu bằng chứng gì}

Checklist: docs/ai/features/checklists/{feature-name}.md
```

Rules:

- List only non-green testcases, one line each.
- Omit the regression line when the run produced no regression testcase.
- When nothing is red or yellow, return at most three lines plus the checklist path.
- Never claim a verification the validation marked insufficient.
- When blocked, say what was unavailable and state that no checklist status was changed.

## Handoff

Offer `handoff` on the next line only when at least one testcase is red with confirmed failure.

The handoff prompt should reference:
- The specific testcase ID
- The evidence that shows the failure
- The expected behavior from the testcase definition

Route by failure type:
- Implementation defect → target `/fix-bug`
- Missing scope from spec → target `/execute-spec`
- Unclear expected result → state which expected result must be decided first

## Artifact Boundaries

- Do not modify code, tests, specs, or testcase definitions.
- Do not run tests or drive browsers.
- Do not repair failures.
- Only update the checklist file based on validated structured results.
- Treat the Markdown verification record as human-readable detail, never as the status contract.

## Orchestrator Contract

When this skill is run under `/orchestrator`, append exactly one HTML comment as the final output line:

- No confirmed failure:
  `<!-- orchestrator: outcome=continue provides=checklist_path checklist_path=docs/ai/features/checklists/{feature-name}.md -->`
- At least one confirmed failure:
  `<!-- orchestrator: outcome=stop-fail -->`
- Required inputs or environment prevented validation:
  `<!-- orchestrator: outcome=stop-blocked -->`
- Spec, testcase-definition, or implementation-source freshness mismatch:
  `<!-- orchestrator: outcome=stop-drift -->`

Rules:

- Emit the comment only after the checklist has been updated.
- `checklist_path` must match the file actually updated.
- If this skill runs standalone, the comment is optional.
