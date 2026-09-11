---
phase: project
title: Workflow Orchestrator Config
description: Contract for running documented workflow configs until the next explicit stop condition
---

# Workflow Orchestrator Config

## Goal

Orchestrator đọc một workflow JSON và chạy các step theo thứ tự đã khai báo.
Human chọn workflow và chấp thuận trước các ranh giới auto-run trong config.
Orchestrator không tự thêm step hoặc skill không có trong config.

## Source Of Truth

Workflow `feature-standard` hiện tại nằm tại `docs/ai/workflows/feature-standard.json`.
File JSON là source of truth cho thứ tự step, dependency contract, auto-run, và human gate.
Tài liệu này mô tả execution model chung và không lặp lại toàn bộ JSON.

## Feature Standard Flow

```text
design-spec
  -> HUMAN REVIEW INSIDE LAVISH
  -> approved design decisions
  -> create-spec
  -> review-spec
  -> execute-spec
  -> manual-checklist
  -> verify-feature
  -> verify-runtime
  -> verify-workflow
  -> completed with checklist
```

`design-spec` giữ foreground review loop và chỉ emit `continue` sau structured human approval.
`review-spec` là AI-only gate và emit `spec_reviewed` khi detailed spec đủ an toàn để execute.
Sau approval, các step còn lại tự chạy theo contract nếu không gặp stop outcome, missing input, missing contract, hoặc failure.

`Shape`, `Recon`, và `Decide` không còn là orchestrator step.
`sync-spec` và `review-pr` không thuộc workflow tự động.
`manual-checklist` thuộc workflow tự động và tạo testcase từ approved spec sau execution.
Human vẫn có thể gọi trực tiếp skill này để regenerate checklist từ spec.

## Human Ownership

HTML design review là human-facing decision surface.
Decision manifest là approval provenance cho `create-spec` và `review-spec`, không phải implementation spec.
Detailed spec sau khi `review-spec` pass là durable source of truth cho execution và verification.
Orchestrator không được tự sửa spec sau implementation.
Human có thể gọi `/sync-spec` riêng khi chủ động muốn reconcile spec với codebase.
Checklist chỉ dùng approved spec để định nghĩa testcase và expected result.
Code, summary, và runtime chỉ được dùng làm evidence bởi các verification step; chúng không được thay đổi testcase theo implementation.
Human có thể gọi `/review-pr` riêng sau khi hoàn tất hoặc chấp nhận các testcase còn cần manual action.

## State And Locking

Mỗi run có một state file tại `docs/ai/workflows/runs/{run-id}.json`.
Registry active run nằm tại `docs/ai/workflows/.orchestrator-runs.json`.
Global repo lock nằm tại `docs/ai/workflows/.orchestrator-lock.json`.

State tối thiểu phải lưu:

- run id, workflow id, workflow path, và feature slug
- current step và status
- contracts và artifact paths đã được skill emit
- fingerprint metadata gắn approval hoặc evidence với source bytes đã được kiểm tra
- persisted step inputs
- history của các action và outcome
- trạng thái repo lock

Step có `uses_repo_lock: true` phải acquire lock trước khi chạy và release sau khi state đã được ghi.
Nếu run khác đang giữ lock hợp lệ, invocation làm workflow tiến lên phải pause và báo owner.

## Execution Rules

1. Load workflow config và run state.
2. Chọn pending step kế tiếp theo đúng thứ tự config.
3. Verify toàn bộ `requires` trước khi chạy step.
   Contract có fingerprint chỉ hợp lệ khi source hiện tại vẫn khớp fingerprint đã lưu.
4. Resolve và persist input khi step được chạm tới.
5. Acquire repo lock nếu step yêu cầu.
6. Execute theo `inline`, `skill`, hoặc `subagent` như config khai báo.
   Interactive skill phải giữ human review loop ở foreground và không được emit `continue` trước approval.
   Artifact được tạo trước approval không thỏa `provides`.
7. Parse orchestrator comment cuối output của skill hoặc subagent.
8. Ghi outcome, contracts, artifact paths, history, và updated timestamp vào state.
9. Release repo lock sau state write.
10. Chỉ auto-run step kế khi outcome là `continue`, step kế có `auto: true`, và không có stop condition.

Orchestrator phải dừng khi:

- step vừa chạy có `human_gate: true`
- outcome nằm trong `stop_on_outcome`
- outcome là `unknown`
- required input hoặc contract bị thiếu
- repo lock bị run khác giữ
- workflow đã hoàn tất

Mọi recoverable stop outcome giữ current step ở trạng thái pending.
Invocation `continue` chạy lại đúng pending step với inputs đã persist.

## Outcome Contract

Orchestrator chỉ chấp nhận các outcome sau:

- `continue`
- `stop-ask-human`
- `stop-split-slices`
- `stop-run-spike`
- `stop-escalate-conflict`
- `stop-blocked`
- `stop-too-broad`
- `stop-fail`
- `stop-drift`
- `stop-budget`
- `stop-total-budget`
- `stop-no-progress`
- `unknown`

Skill và subagent giao tiếp bằng comment:

```html
<!-- orchestrator: outcome=continue provides=spec_path spec_path=docs/ai/features/specs/foo.md -->
```

Thiếu comment hoặc comment không hợp lệ phải trở thành `unknown`.
Orchestrator không được suy đoán outcome hoặc artifact path từ prose hay feature slug.

## Feature Standard Contracts

- `design_path`: design-plan JSON do `design-spec` tạo và human duyệt qua fixed viewer/local runner
- `design_decisions_path`: validated approval manifest do `design-spec` persist sau approval
- `spec_path`: spec đã được tạo và dùng làm source of truth cho các step sau
- `spec_reviewed`: `review-spec` đã pass decision traceability và execution readiness
- `spec_reviewed` phải lưu `spec_sha256` của đúng spec bytes đã review
- `summary_path`: execution summary do `execute-spec` tạo
- `checklist_path`: checklist testcase do `manual-checklist` tạo từ approved spec và `verify-workflow` cập nhật
- `verification_path`: verification artifact do `verify-feature` tạo
- `verification_results_path`: structured result contract do verifier cập nhật và `verify-workflow` tiêu thụ
- testcase definitions phải có `source_files_origin=git-working-tree+explicit`; scope được thu thập bằng `collect_source_files.py` để bao gồm untracked files
- `runtime_verified`: runtime sections đã được `verify-runtime` cập nhật trong structured results và evidence record

`create-spec` yêu cầu `design_decisions_path`.
`review-spec` yêu cầu `design_decisions_path` và `spec_path`.
`execute-spec` yêu cầu `spec_path` và `spec_reviewed`.
`manual-checklist` yêu cầu `spec_path` và `summary_path`, nhưng chỉ đọc spec để định nghĩa testcase.
`verify-feature` yêu cầu `spec_path`, `summary_path`, và `testcases_path`.
`verify-runtime` yêu cầu `spec_path`, `testcases_path`, `verification_path`, và `verification_results_path`.
`verify-workflow` yêu cầu `spec_path`, `testcases_path`, `verification_path`, `verification_results_path`, và `checklist_path`.
`verify-workflow` re-emit `checklist_path` để checklist là artifact chính khi workflow hoàn tất.
Workflow chuẩn không có contract `shape_checked`, `recon_checked`, `decision_ready`, `spec_synced`, hoặc `pr_review_path`.

## Status Lifecycle

- `running`: invocation hiện tại đang thực thi run
- `paused`: run đang chờ human gate, input, lock, hoặc recoverable stop outcome
- `blocked`: run gặp hard failure hoặc invariant violation
- `completed`: final step đã kết thúc với `continue`

## Cleanup

`cleanup` archive run terminal và run paused quá TTL theo policy.
Orphan lock có thể được xóa tự động khi owner không còn hợp lệ.
Stale lock vẫn trông như đang chạy chỉ được force-release khi human gọi explicit cleanup cho đúng run id.

## Validation Invariants

- `feature-standard` có một human decision loop bên trong `design-spec` và không có human gate thứ hai sau detailed spec review.
- `design-spec` chỉ emit `continue` khi cả `design_path` và validated `design_decisions_path` tồn tại.
- Workflow hiện được đánh dấu `experimental` cho đến khi có runtime evidence.
- Mọi step trong `feature-standard` đều có `skippable: false`.
- `execute-spec` là step duy nhất của workflow chuẩn dùng repo lock.
- `manual-checklist` chạy ngay sau `execute-spec` và không phải human gate.
- Chỉ `verify-workflow` cập nhật checklist từ structured results đã validate.
- Spec đổi sau review chỉ invalidate `spec_reviewed` và downstream contracts; design approval còn hợp lệ nếu design checksum vẫn khớp.
- Source code đổi sau verification chỉ invalidate evidence gắn với source fingerprint đó và rerun verifier gần nhất cần thiết.
- Khi `checklist_path` tồn tại, orchestrator phải hiển thị nó như artifact chính cho human.
- Step không có trong config không được orchestrator tự chạy.
- Spec không bị workflow tự động sửa sau khi `review-spec` pass.
