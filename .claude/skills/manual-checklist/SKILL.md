---
name: manual-checklist
description: "Use when the human is ready to complete manual checks after AI verification and before PR review. Bundles spec, summary, and verification artifacts into a single scannable checklist with immediate status visibility. Trigger phrases: \"manual checklist\", \"review checklist\", \"create checklist\", \"generate checklist\". Do not use for re-running verification, modifying code, or syncing the spec."
---

# Manual Checklist

Bundle all workflow artifacts (spec, summary, verification) into a single human-readable checklist before independent PR review.

## When To Run

- The human triggers this step explicitly (e.g. `/manual-checklist`)
- Only after `/verify-runtime` has completed, or the human confirms the feature is implementation-complete enough to review
- Do NOT auto-run this step as part of `/verify-runtime` or any other step

## Input

- Required: spec path (e.g. `docs/ai/specs/{feature}.md`)
- Read if present: summary path (e.g. `docs/ai/summaries/{feature}.md`)
- Read if present: verification path (e.g. `docs/ai/verifications/{feature}.md`)

## Output

Write to: `docs/ai/checklists/{feature}.md`

## Pre-Checklist: Determine Status

Before writing, read all available artifacts and determine the overall status from evidence:

- `Ready for PR Review`: all ACs are either AI-verified or deferred; no `Blocked / Stuck` items; human-verify items remain but are the only thing between now and PR review
- `Needs Human Verify`: implementation and runtime checks passed, but one or more ACs require human manual testing before PR review
- `Blocked`: one or more required artifacts (spec, summary, verification) missing, or one or more ACs Blocked / Stuck in implementation/runtime
- `In Progress`: not all ACs are implemented or verified yet (summary shows Not Done / Blocked)
- `Drift Detected`: summary's Decisions or runtime results contradict the latest synced spec; human must confirm before PR review

## Checklist Format

```markdown
# Manual Checklist — {feature}

## Trạng thái
{status} — {one-sentence reason}

## Tổng quan
- Mức: {Lite|Standard|Extended}
- AC: {total N}
- Spec: docs/ai/specs/{feature}.md ✓
- Summary: docs/ai/summaries/{feature}.md {✓|✗ thiếu}
- Verification: docs/ai/verifications/{feature}.md {✓|✗ thiếu}
- Trạng thái xác minh: {Pass|Partial|Fail|Blocked|N/A}

## AI đã xác minh
- AC1 → {tóm tắt bằng chứng} (src: verification)
- AC2 → {tóm tắt bằng chứng} (src: verification)
...

## Cần người kiểm tra
- AC3 → {bước test cụ thể, ví dụ: "mở http://localhost:3000/login, nhập sai password, kiểm tra message đỏ"}
- AC4 → {bước test cụ thể}
...

## Bị chặn / Kẹt
- AC5 → {lý do bị chặn} — gỡ bằng: {cần gì để unblock}
...

## Lệch spec / Câu hỏi mở
- {quyết định trong summary mâu thuẫn với spec}
- {câu hỏi mở chưa giải quyết từ spec}

## Next Gate
- [ ] Tôi đã đọc spec và kiểm tra toàn bộ manual checklist
- [ ] Tôi đã sửa các chỗ lệch spec (files: ...)
- [ ] Sẵn sàng cho `/review-pr`

## Artifacts nguồn
- Spec: docs/ai/specs/{feature}.md
- Summary: docs/ai/summaries/{feature}.md
- Verification: docs/ai/verifications/{feature}.md
- File chính: {paths to primary implementation files}
```

## Rules

### Language
- All checklist output files must be written in Vietnamese
- Spec, summary, and verification artifacts may be in English; translate terse summaries into Vietnamese when writing the checklist
- Keep evidence pointers (file paths, commands, test names) in their original English

### Artifact Reading
- Read the spec, summary, and verification artifact before producing the checklist
- If verification artifact exists but only has implementation-level sections (no runtime), treat Needs Runtime Verification items as Cần người kiểm tra
- If summary is missing, treat all ACs as Not Done and set trạng thái to Đang làm dở
- If verification is missing but summary exists, mark trạng thái Bị chặn with reason "thiếu file verification"

### Status Rules
- Produce the status from actual evidence in the artifacts, not from inference
- Put trạng thái first so the human sees it before scrolling
- Never mark a feature Ready for PR Review when any AC is Blocked / Stuck

### Content Rules
- Keep each list item terse; the goal is scannability, not re-narrating the spec
- Map every acceptance criterion to exactly one of: AI đã xác minh, Cần người kiểm tra, Bị chặn / Kẹt
- If an AC is not listed in any section, it belongs in Bị chặn / Kẹt with reason "chưa triển khai"
- Preserve evidence pointers (file path, line range, command output) instead of inline-quoting large blocks
- For Cần người kiểm tra, write concrete test steps the human can execute immediately; do not repeat the AC text verbatim

### Artifact Boundaries
- Do NOT modify the spec, summary, or verification file from this step
- Do NOT re-verify anything that was already verified
- Do NOT claim behavior the AI did not already verify

### Refresh Rules
- If `docs/ai/checklists/{feature}.md` already exists, refresh all sections from current artifacts
- Preserve the human's existing Next Gate block, or a legacy Sign-off block — move it to the bottom, do not reset or delete checkmarks
- If a previously signed-off item now shows as Blocked or Drift Detected, flag it explicitly in Lệch spec / Câu hỏi mở

## Done When

- All ACs from the spec are mapped to exactly one status section
- Trạng thái header reflects honest evidence
- Next Gate block is present and human-ready (no auto-checked boxes)
- File is written to `docs/ai/checklists/{feature}.md`

## Orchestrator Contract

When this skill is run under `/orchestrator`, append exactly one HTML comment as the final output line:

- Checklist written:
  `<!-- orchestrator: outcome=continue provides=checklist_path checklist_path=docs/ai/checklists/{feature}.md -->`
- Required artifact missing or checklist bundle cannot be produced honestly:
  `<!-- orchestrator: outcome=stop-blocked -->`

Rules:
- Emit the comment only after the main human-readable response is complete
- `checklist_path` must match the file actually written
- `/manual-checklist` remains human-triggered; this contract does not allow auto-chaining into it
- If this skill runs standalone, the comment is optional
