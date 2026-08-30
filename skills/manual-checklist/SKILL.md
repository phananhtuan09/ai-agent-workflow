---
name: manual-checklist
description: "Create a Vietnamese spec-derived testcase checklist and structured testcase definitions after implementation so verification can update evidence status and the human can validate only the remaining cases. Runs automatically under supported orchestrator workflows and may be invoked directly to regenerate the checklist from an approved spec."
---

# Manual Checklist

Create the human validation checklist and structured testcase definitions from the approved spec.

## Role In The Workflow

- Under `feature-standard`, run automatically after `/execute-spec` and before `/verify-feature`.
- Under `feature-implement-gnhf`, run automatically after `/execute-gnhf` and before `/verify-feature` in the implementation workspace.
- When invoked directly, regenerate the checklist from the provided approved spec.
- This skill creates testcase definitions but does not verify them.
- `/verify-feature` and `/verify-runtime` update evidence status later.
- The checklist is the primary human-facing output of the completed workflow.

## Input

- Required: approved spec path, for example `docs/ai/features/specs/{feature}.md`.
- Required: project verify config, for example `skills/verify-workflow/references/verify-config.json` or project override.
- Required: changed files list (from git diff or implementation summary) for regression testcase generation.
- The orchestrator may require `summary_path` to prove execution completed, but this skill must not read the summary to define expected behavior.

## Source Of Truth Boundary

- The approved spec is the only source of truth for testcase definitions and expected results.
- Derive testcases only from acceptance criteria, key behavioral rules, edge cases, failure states, validation, persistence, fallback, and reset behavior explicitly present in the spec.
- Do not read code, implementation summaries, verification artifacts, or runtime behavior to add, remove, or rewrite testcases.
- Do not convert implemented behavior into an expected result when the spec does not require it.
- If the spec does not define an expected result clearly enough, record a red spec-gap testcase instead of inventing behavior.
- Verification evidence may change testcase status but must never change the testcase definition or expected result.

## Project Config

Read the project verify config before generating testcases. The config defines:

- `test_types`: available test types with their executor, tools, and done_criteria templates.
- `evidence_artifacts`: required evidence kinds per test type.
- `checklist_output`: output file patterns and language.

If the project config is missing, stop as blocked and report:
```
Missing project verify config: skills/verify-workflow/references/verify-config.json
```

If a testcase requires a `test_type` not defined in the config, stop and report the unknown type.

## Testcase Generation Rules

Each checklist item represents one independently executable testcase, not one acceptance criterion.

Structured testcase definition:
```json
{
  "id": "TC-001",
  "ac": ["AC1"],
  "test_type": "runtime_e2e",
  "done_criteria": {
    "required": ["browser screenshot showing error message", "network request captured"],
    "not_sufficient": ["code inspection", "build success"]
  },
  "steps": [
    "Navigate to registration page",
    "Enter 'invalid-email' in email field",
    "Click submit"
  ],
  "expected": "Error message 'Email format invalid' appears, form not submitted"
}
```

Rules:
- One acceptance criterion may produce multiple testcases for happy path, negative path, boundary conditions, persistence, fallback, or relevant environments.
- Map every testcase to one or more explicit spec acceptance criteria such as `AC1` or `AC1, AC3`.
- Use stable sequential IDs such as `TC-001`, `TC-002`, and `TC-003`.
- Assign `test_type` from the project config based on what the testcase actually requires to verify.
- Assign `done_criteria` from the project config template for the chosen `test_type`.
- Customize `done_criteria.required` items to match the specific testcase scenario.
- Keep `done_criteria.not_sufficient` from the template unchanged.
- Include concrete `steps` that an executor can follow without interpreting the spec.
- Write `expected` as observable behavior, not implementation detail.
- Do not generate testcases for behavior that is out of scope.
- Do not create generic testcases such as "works correctly" or "handle errors properly".
- If an existing checklist is regenerated from an unchanged testcase, preserve its testcase ID and human checkbox state.
- If the approved spec changes, refresh affected testcase definitions and mark their evidence status red until verification runs again.

## Regression Testcase Generation

After generating spec-derived testcases, generate regression testcases for changed files.

Read `skills/verify-workflow/references/regression-scope.md` for:
- Oracle selection rules
- Impacted surface derivation
- Selection limits (max 6)
- Status rules

Rules:
- Collect changed files from the implementation summary or git diff.
- Select L1 modules only: modules and routes that directly import, call, or render the changed code.
- Each regression testcase must include `mapped_to` (the changed file or function) and `rationale` (why this regression risk exists).
- Assign `test_type` based on the nature of the changed code (e.g., UI change → `runtime_e2e`, API change → `api_check`).
- Use ids `RG-001`, `RG-002`, and so on.
- Write regression testcases in their own checklist section.
- Keep regression counts separate from spec testcase counts.

## Output Files

This skill produces two files:

### 1. Checklist (human-facing, Vietnamese)

Write to `docs/ai/features/checklists/{feature}.md`.

```markdown
# Checklist kiểm thử thủ công — {feature}

## Tóm tắt xác minh
- Tổng số ca kiểm thử: {N}
- 🟢 Đã xác minh đầy đủ: {green}/{N} ({green_percent}%)
- 🟡 Có bằng chứng một phần: {yellow}/{N} ({yellow_percent}%)
- 🔴 Cần người kiểm tra: {red}/{N} ({red_percent}%)
- Tiêu chí chấp nhận được bao phủ đầy đủ: {covered_ac}/{total_ac}
- Bằng chứng chi tiết: {verification_path | Chưa có — chưa chạy xác minh}

## Chú giải bằng chứng
- 🟢 Bằng chứng trực tiếp cho thấy ca kiểm thử đã đạt đầy đủ.
- 🟡 Bằng chứng gián tiếp, chưa đầy đủ, hoặc chưa bao phủ toàn bộ phạm vi.
- 🔴 Chưa chạy, không đạt, bị chặn, có bằng chứng mâu thuẫn, hoặc đặc tả chưa rõ.

## Các ca kiểm thử
- [ ] 🔴 TC-001 [AC1] — {hành động} → {kết quả mong đợi} — AI: Chưa chạy
- [ ] 🔴 TC-002 [AC1, AC2] — {hành động} → {kết quả mong đợi} — AI: Chưa chạy

## Ca kiểm thử hồi quy
- [ ] 🔴 RG-001 — {hành động} → {kết quả mong đợi} — Nguồn: {test có sẵn | tính toàn vẹn luồng} — Phù hợp: {changed file/function} — Lý do: {tại sao cần test} — AI: Chưa chạy

## Rủi ro chưa kiểm
- {surface không được kiểm và lý do}

## Lỗ hổng đặc tả / Sai lệch
- Không có.

## Xác nhận của người kiểm tra
- [ ] Đã hoàn thành các ca kiểm thử còn ô checkbox.
- [ ] Đã chấp nhận các ca kiểm thử màu xanh và không cần kiểm tra lại.
- [ ] Tính năng đạt yêu cầu hoặc đã ghi rõ các ca kiểm thử chưa đạt.

## Nguồn
- Đặc tả đã duyệt: docs/ai/features/specs/{feature}.md
- Bằng chứng xác minh: docs/ai/features/verifications/{feature}.md
```

### 2. Testcase Definitions (structured, machine-readable)

Write to `docs/ai/features/checklists/{feature}-testcases.json`.

```json
{
  "feature": "{feature}",
  "spec_path": "docs/ai/features/specs/{feature}.md",
  "checklist_path": "docs/ai/features/checklists/{feature}.md",
  "verification_record_path": "docs/ai/features/verifications/{feature}.md",
  "generated_at": "ISO-8601 timestamp",
  "test_types_used": ["code_test", "runtime_e2e"],
  "testcases": [
    {
      "id": "TC-001",
      "ac": ["AC1"],
      "test_type": "runtime_e2e",
      "description": "Validate email format rejection",
      "steps": [
        "Navigate to registration page",
        "Enter 'invalid-email' in email field",
        "Click submit"
      ],
      "expected": "Error message 'Email format invalid' appears, form not submitted",
      "done_criteria": {
        "required": ["browser screenshot showing error message", "network request captured"],
        "not_sufficient": ["code inspection", "build success"]
      }
    }
  ],
  "regression_testcases": [
    {
      "id": "RG-001",
      "mapped_to": "src/auth/validate.ts",
      "rationale": "Changed email validation logic may affect login flow",
      "test_type": "runtime_e2e",
      "description": "Login still works after email validation change",
      "steps": [
        "Navigate to login page",
        "Enter valid credentials",
        "Click submit"
      ],
      "expected": "Login succeeds, redirect to dashboard",
      "done_criteria": {
        "required": ["browser screenshot showing dashboard", "network request successful"],
        "not_sufficient": ["code inspection"]
      }
    }
  ]
}
```

## Evidence Status Rules

Read `skills/verify-workflow/references/evidence-rules.md` for the complete evidence classification rules.

The checklist generator initializes every testcase as `🔴` with evidence `Chưa chạy`.

## Orchestrator Contract

When this skill is run under `/orchestrator`, append exactly one HTML comment as the final output line:

- Checklist written:
  `<!-- orchestrator: outcome=continue provides=checklist_path,testcases_path checklist_path=docs/ai/features/checklists/{feature}.md testcases_path=docs/ai/features/checklists/{feature}-testcases.json -->`
- The approved spec is missing or cannot produce honest testcases:
  `<!-- orchestrator: outcome=stop-blocked -->`

Rules:

- Emit the comment only after both output files are written.
- `checklist_path` and `testcases_path` must match the files actually written.
- If this skill runs standalone, the comment is optional.
