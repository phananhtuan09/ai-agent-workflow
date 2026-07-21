---
phase: project
title: Workflow Orchestrator Config
description: Workflow config for the orchestrator skill. Human review required before implementation.
---

# Workflow Orchestrator Config

File này là bản draft để human review **trước khi** implement orchestrator skill và workflow config chính thức.
Sau khi chốt, file workflow `feature-standard` chính thức sẽ nằm ở `docs/ai/workflows/feature-standard.json` (không dùng `.pi/workflows/` để tránh ảnh hưởng PI agent).

## Goal

Orchestrator là 1 skill đọc 1 workflow config file và tự chạy các step (skill/subagent/inline) theo thứ tự đã định nghĩa, giảm số lần human phải gõ lệnh thủ công — nhưng vẫn dừng ở các human gate có chủ đích.

## Relationship với `WORKFLOW_CODING_STANDARD.md`

Orchestrator **không thay thế** workflow coding standard, mà là amendment có giới hạn:

- Standard hiện tại (line 46-47, 365) nói "the human decides which step to run" giữ nguyên làm **default** behavior.
- Orchestrator mở rộng thêm "run-until-gate" mode: khi human explicit invoke orchestrator với path config, human được xem là đã consent trước với thứ tự + flags trong config — orchestrator tự chạy các step `auto: true` tới khi gặp `human_gate: true`, `stop_on_outcome`, hoặc thiếu contract tối thiểu cho step kế.
- Spec slice phải bao gồm cả update tới `WORKFLOW_CODING_STANDARD.md` thêm section "Orchestrator-Driven Execution" carve-out, không chỉ tạo orchestrator skill + config.

## Design chốt (từ brainstorm)

1. Orchestrator = 1 skill mới (`orchestrator`)
2. Config định nghĩa steps trong file JSON riêng (không nằm trong `AGENTS.md` hay `WORKFLOW_CODING_STANDARD.md`)
3. Mỗi run có state file riêng để audit + hiển thị vị trí hiện tại (không cần lệnh `resume`, human chỉ gọi `/orchestrator next --run <run-id>` / `/orchestrator continue --run <run-id>`)
4. `Shape` / `Recon` / `Decide` là `exec: inline` — agent tự đọc `WORKFLOW_CODING_STANDARD.md` để biết phải làm gì, không tách thành skill
5. Outcome contract khép kín — orchestrator đọc HTML comment cuối output của skill; nếu thiếu comment thì outcome = `unknown` → pause cho human (không fallback heuristic)
6. `manual-checklist` và `review-pr` dù config có ghi `auto: true` thì orchestrator cũng override cấm auto-chain (workflow coding standard bắt buộc human-triggered)
7. Skill trả explicit contract/artifact metadata trong comment → orchestrator ghi vào state, step sau đọc từ state (không path inference ngầm)
8. Slice đầu tiên gồm: orchestrator skill + 1 workflow config (`feature-standard`) + amendment section trong `WORKFLOW_CODING_STANDARD.md` + contract-emitter update cho các skill/role tham gia workflow (`create-spec`, `execute-spec`, `sync-spec`, `verify-feature`, `verify-runtime`, `manual-checklist`, `review-pr`)
9. Cho phép nhiều run cùng tồn tại, nhưng chỉ dùng 1 global repo lock đơn giản. Step nào cần chặn chạy song song thì khai báo lock này; nếu lock đang do run khác giữ thì run hiện tại dừng ngay và báo user
10. Phải có cleanup path cho run-state và stale lock; không để state tăng mãi hoặc orphan lock block workflow vô thời hạn

## Outcome enum (khép kín, duy nhất)

Orchestrator chỉ chấp nhận các outcome sau khi parse comment:

| Outcome | Hành vi |
|---|---|
| `continue` | Step thành công, sang step kế (nếu `auto: true`) |
| `stop-ask-human` | Cần human input — pause, báo lý do |
| `stop-split-slices` | Spec quá rộng — pause, đề nghị slice |
| `stop-run-spike` | Cần spike trước spec — pause |
| `stop-escalate-conflict` | Conflict codebase/business — pause |
| `stop-blocked` | Blocked — pause, báo blocker |
| `stop-too-broad` | Spec quá broad cho 1 pass — pause |
| `stop-fail` | Fail cứng (review, verify) — pause |
| `stop-drift` | Drift business-level (sync-spec) — pause, chốt delta với human |
| `stop-budget` | Hết budget của step resumable — pause và giữ nguyên current step để chạy tiếp |
| `stop-total-budget` | Chạm tổng epoch/token budget của feature — pause để human tăng binding limit hoặc tạo run mới với scope hẹp hơn |
| `stop-no-progress` | Epoch không tạo tiến độ có bằng chứng — pause để kiểm tra blocker thay vì tiếp tục đốt token |
| `unknown` | Thiếu comment hoặc không match enum — **pause cho human**, không đoán tiếp |

Quy ước comment dạng:
```
<!-- orchestrator: outcome=continue provides=spec_path,spec_synced spec_path=docs/ai/specs/foo.md -->
```

`provides` là danh sách contract-id mà step vừa satisfy khi `outcome=continue`.
Metadata `*_path` là optional nhưng bắt buộc có nếu contract đó là artifact-path contract như `spec_path`, `summary_path`, `verification_path`, `checklist_path`.
Step kế đọc contract và path từ state file thay vì tự derive.

Skill không thêm comment → chạy độc lập vẫn hoạt động bình thường (backward-compat intent ban đầu được giữ, chỉ khác ở chỗ orchestrator không đoán tiếp).

## Schema fields

| Field | Type | Ý nghĩa |
|---|---|---|
| `id` | string | Workflow ID (kebab-case) |
| `name` | string | Tên hiển thị |
| `description` | string | Mô tả ngắn |
| `steps[].id` | string | Step ID riêng trong workflow |
| `steps[].title` | string | Tên hiển thị của step |
| `steps[].type` | string | `gate` / `command` / `skill` / `subagent` — giữ tương thích với TUI hiện có |
| `steps[].value` | string | Giá trị hiển thị (vd `/create-spec`) — dùng cho TUI |
| `steps[].hint` | string | Hint text cho TUI |
| `steps[].exec` | `inline` / `skill` / `subagent` | Cách orchestrator thực thi step |
| `steps[].skill` | string? | Tên skill để load (khi `exec: skill`). Pin canonical tên skill thật (`create-spec`, không alias `/spec`) |
| `steps[].subagent` | string? | Tên subagent để dispatch (khi `exec: subagent`) |
| `steps[].value_inline` | string? | Keyword cho inline step (vd `shape`, `recon`, `decide`) |
| `steps[].auto` | bool | Orchestrator có tự chạy step này (true) hay phải human gọi (false) |
| `steps[].human_gate` | bool | Sau khi step chạy xong, buộc dừng để human review trước khi sang step kế |
| `steps[].human_gate_reason` | string? | Lý do dừng, hiển thị cho human |
| `steps[].stop_on_outcome` | string[]? | Subset của outcome enum khiến orchestrator dừng ngay cả khi `auto: true` |
| `steps[].provides` | string[]? | Danh sách contract-id step phải emit khi `outcome=continue` (vd `spec_path`, `summary_path`, `spec_synced`) |
| `steps[].requires` | string[]? | Danh sách contract-id/artifact key tối thiểu phải tồn tại trong state trước khi step này chạy |
| `steps[].skippable` | bool? | `false` = invariant, không cho skip dù human gọi `--skip`. Default `true` |
| `steps[].inputs` | object? | Metadata cho input phụ; `ask-at-step` hỏi khi đến step, `default:<value>` tự resolve và lưu để reuse |
| `steps[].cwd_from` | string? | Key trong `artifact_paths`; absolute directory tại key này trở thành working directory của toàn bộ step |
| `steps[].uses_repo_lock` | bool? | `true` = step phải acquire global repo lock trước khi chạy. Slice đầu chỉ có 1 lock loại này |

## Orchestrator rules (áp dụng lên tất cả workflow config)

- `manual-checklist` và `review-pr` luôn được orchestrator override thành `human_gate: true` dù config khai báo khác (workflow coding standard cấm auto-chain)
- Outcome contract: orchestrator chỉ đọc dòng `<!-- orchestrator: outcome=... provides=... *_path=... -->` cuối output của skill; **không có fallback heuristic** — thiếu comment hoặc không match enum = `unknown` = pause cho human
- State file theo run ở `docs/ai/workflows/runs/{run-id}.json`
- Registry active runs ở `docs/ai/workflows/.orchestrator-runs.json`
- Global lock ở `docs/ai/workflows/.orchestrator-lock.json`
- Run-id tự sinh theo format `<workflow-id>--<feature-slug>--<timestamp>`
- Skill trả explicit contract/artifact metadata trong comment → orchestrator ghi vào state `contracts` + `artifact_paths`; step sau đọc từ state (không path inference từ slug)
- `requires` check: trước khi chạy step, orchestrator verify mọi contract-id trong `requires` đã tồn tại trong state. `skip` **không** satisfy `requires`; nếu contract thiếu thì pause, báo blocker
- `provides` check: nếu step kết thúc với `outcome=continue` nhưng comment không emit đủ contract-id đã khai báo trong `provides`, orchestrator pause và mark run là blocked do contract mismatch
- Step input phải được lưu theo step id và reuse khi một resumable step chạy lại; chỉ hỏi lại khi human explicit override
- `start` và `continue` có thể nhận `--input <key>=<value>` để override input của step hiện tại; override được merge vào input đã lưu trước khi thực thi
- Nếu step có `cwd_from`, orchestrator phải resolve absolute directory từ `artifact_paths`, xác nhận directory tồn tại, rồi chạy toàn bộ skill/subagent trong directory đó
- `stop-budget`, `stop-total-budget`, và `stop-no-progress` giữ current step ở trạng thái pending; lần `continue` kế tiếp chạy lại chính step đó thay vì chuyển sang step sau
- `skippable: false` override lệnh `--skip` từ human — báo "step này là invariant, không skip được"
- Human có thể skip 1 step khi gọi orchestrator (vd `/orchestrator next --skip`) — chấp nhận nếu `skippable != false`; skip được log vào state history kèm warning
- Khi pause ở human_gate, orchestrator KHÔNG tự resume — human gọi lệnh kế tiếp để tiếp
- Trước mọi `start` / `next` / `continue`, orchestrator phải check global repo lock cho step sắp chạy. Nếu step khai báo `uses_repo_lock = true` và lock đang do run khác giữ thì run hiện tại dừng ngay với owner run id, feature slug, step id, và thời điểm acquire
- `status`, `list`, và `cleanup` vẫn được phép chạy khi có lock; chỉ chặn invocation làm workflow tiến lên
- Nếu step có `uses_repo_lock = true`, orchestrator acquire lock trước khi chạy và release ngay sau khi state của step đã được ghi
- Nếu lock tồn tại nhưng owner run không còn `status=running` hoặc `current_step_id` không còn khớp step đang giữ lock, lock được xem là orphan và có thể bị cleanup xoá
- Nếu lock đã stale theo TTL nhưng owner vẫn trông như đang chạy, orchestrator không tự clear; phải pause và yêu cầu human chạy cleanup explicit để tránh clear nhầm run còn sống
- Cleanup path bắt buộc:
  - archive run terminal (`completed`, `blocked`) sang `docs/ai/workflows/runs/archive/`
  - archive run `paused` quá TTL stale
  - xoá orphan lock
  - chỉ force-release stale lock khi human explicit invoke cleanup

## Run status lifecycle

- Allowed `status` values:
  - `running`: orchestrator đang thực thi invocation hiện tại cho run này
  - `paused`: run dừng ở human gate, lock contention, hoặc một outcome cần human quyết định trước khi chạy tiếp
  - `blocked`: run gặp failure cứng hoặc thiếu invariant bắt buộc; coi như terminal cho cleanup
  - `completed`: run đã đi hết workflow config
- `paused` dùng cho các tình huống:
  - `human_gate: true`
  - `unknown`
  - `stop-ask-human`
  - `stop-split-slices`
  - `stop-run-spike`
  - `stop-escalate-conflict`
  - `stop-too-broad`
  - `stop-drift`
  - `stop-budget`
  - `stop-total-budget`
  - `stop-no-progress`
  - repo lock đang do run khác giữ
- `blocked` dùng cho các tình huống:
  - `stop-blocked`
  - `stop-fail`
  - contract mismatch giữa `provides` khai báo và comment emit thực tế
  - thiếu workflow file, run state, hoặc required contract tối thiểu để step chạy
- `completed` chỉ set khi step cuối cùng của workflow kết thúc với `continue`

## Contract keys chuẩn cho `feature-standard`

- `shape_checked`: `Shape` đã chạy xong trong run hiện tại
- `recon_checked`: `Recon` đã chạy xong trong run hiện tại
- `decision_ready`: `Decide` đã kết luận workflow được phép đi tiếp sang spec
- `spec_path`: path tới spec hiện tại trong `docs/ai/specs/`
- `summary_path`: path tới execution summary trong `docs/ai/summaries/`
- `spec_synced`: sync-spec đã hoàn tất mà không dừng ở `stop-drift`
- `verification_path`: path tới verification artifact trong `docs/ai/verifications/`
- `runtime_verified`: verify-runtime đã append/update xong runtime sections
- `checklist_path`: path tới manual checklist trong `docs/ai/checklists/`

## Sample config: `feature-standard` (slice đầu)

Đây là JSON đã được dùng tại `docs/ai/workflows/feature-standard.json` và là source of truth cho workflow hiện tại.
Sample dưới đây phải khớp với config thật.

```json
{
  "id": "feature-standard",
  "name": "Feature Standard",
  "description": "Workflow chuẩn cho feature: Shape, Recon, Decide trước spec; sau đó execute, sync, verify implementation, rồi verify runtime.",
  "steps": [
    {
      "id": "shape",
      "title": "Shape",
      "type": "gate",
      "value": "shape",
      "hint": "Làm rõ expectation, happy path, must-not-happen, và rough size",
      "exec": "inline",
      "value_inline": "shape",
      "auto": true,
      "human_gate": false,
      "provides": ["shape_checked"],
      "skippable": false
    },
    {
      "id": "recon",
      "title": "Recon",
      "type": "gate",
      "value": "recon",
      "hint": "Check behavior hiện tại, pattern gần nhất, constraint, và conflict",
      "exec": "inline",
      "value_inline": "recon",
      "auto": true,
      "human_gate": false,
      "requires": ["shape_checked"],
      "provides": ["recon_checked"],
      "skippable": false
    },
    {
      "id": "decide",
      "title": "Decide",
      "type": "gate",
      "value": "decide",
      "hint": "Chọn: write spec / ask / slice / spike / conflict",
      "exec": "inline",
      "value_inline": "decide",
      "auto": true,
      "human_gate": false,
      "stop_on_outcome": ["stop-ask-human", "stop-split-slices", "stop-run-spike", "stop-escalate-conflict"],
      "requires": ["recon_checked"],
      "provides": ["decision_ready"],
      "skippable": false
    },
    {
      "id": "spec",
      "title": "Create spec",
      "type": "command",
      "value": "/create-spec",
      "hint": "Tạo spec từ kết quả Shape/Recon/Decide",
      "exec": "skill",
      "skill": "create-spec",
      "auto": true,
      "human_gate": false,
      "stop_on_outcome": ["stop-ask-human", "stop-split-slices", "stop-run-spike", "stop-escalate-conflict"],
      "requires": ["decision_ready"],
      "provides": ["spec_path"],
      "skippable": false
    },
    {
      "id": "review-spec",
      "title": "Review spec",
      "type": "subagent",
      "value": "review-spec",
      "hint": "Review spec một lần cho clarity, bounded scope, và execution readiness",
      "exec": "subagent",
      "subagent": "review-spec",
      "auto": true,
      "human_gate": true,
      "human_gate_reason": "Spec vừa được tạo và review xong. Human cần đọc kết quả review-spec trước khi cho phép execute.",
      "stop_on_outcome": ["stop-fail"],
      "requires": ["spec_path"],
      "skippable": false
    },
    {
      "id": "execute-spec",
      "title": "Execute spec",
      "type": "command",
      "value": "/execute-spec",
      "hint": "Implement từ spec, viết summary",
      "exec": "skill",
      "skill": "execute-spec",
      "auto": true,
      "human_gate": true,
      "human_gate_reason": "Implementation vừa chạy xong. Human cần review code/result trước khi sync spec và verify tiếp.",
      "stop_on_outcome": ["stop-blocked", "stop-too-broad"],
      "uses_repo_lock": true,
      "requires": ["spec_path"],
      "provides": ["summary_path"],
      "skippable": false
    },
    {
      "id": "sync-spec",
      "title": "Sync spec",
      "type": "command",
      "value": "/sync-spec",
      "hint": "Reconcile spec với codebase sau implement",
      "exec": "skill",
      "skill": "sync-spec",
      "auto": true,
      "human_gate": false,
      "requires": ["spec_path", "summary_path"],
      "provides": ["spec_synced"],
      "skippable": false
    },
    {
      "id": "verify-feature",
      "title": "Verify feature",
      "type": "skill",
      "value": "verify-feature",
      "hint": "Verify implementation readiness theo latest synced spec",
      "exec": "skill",
      "skill": "verify-feature",
      "auto": true,
      "human_gate": false,
      "stop_on_outcome": ["stop-fail", "stop-blocked"],
      "requires": ["spec_synced"],
      "provides": ["verification_path"],
      "skippable": false
    },
    {
      "id": "verify-runtime",
      "title": "Verify runtime",
      "type": "command",
      "value": "/verify-runtime",
      "hint": "Verify observable runtime behavior theo latest synced spec",
      "exec": "skill",
      "skill": "verify-runtime",
      "auto": true,
      "human_gate": false,
      "stop_on_outcome": ["stop-fail", "stop-blocked"],
      "requires": ["spec_synced", "verification_path"],
      "provides": ["runtime_verified"],
      "skippable": false,
      "inputs": {
        "url": "ask-at-step"
      }
    },
    {
      "id": "manual-checklist",
      "title": "Manual checklist",
      "type": "command",
      "value": "/manual-checklist",
      "hint": "Bundle artifacts thành checklist tiếng Việt trước independent PR review",
      "exec": "skill",
      "skill": "manual-checklist",
      "auto": false,
      "human_gate": true,
      "human_gate_reason": "Human hoàn thành manual checks và đọc checklist trước khi trigger PR review.",
      "requires": ["spec_path", "summary_path", "verification_path", "runtime_verified"],
      "provides": ["checklist_path"],
      "skippable": false
    },
    {
      "id": "review-pr",
      "title": "Review PR",
      "type": "subagent",
      "value": "review-pr",
      "hint": "Review diff và evidence; tách Must fix, human decision, và manual verification trước khi tạo PR",
      "exec": "subagent",
      "subagent": "review-pr",
      "auto": false,
      "human_gate": true,
      "human_gate_reason": "PR review hoàn tất. Human quyết định có tạo/approve PR hay quay lại sửa.",
      "stop_on_outcome": ["stop-fail", "stop-ask-human", "stop-blocked"],
      "requires": ["spec_path", "summary_path", "verification_path", "runtime_verified", "checklist_path"],
      "provides": ["pr_review_path"],
      "skippable": false,
      "inputs": {
        "base_ref": "ask-at-step"
      }
    }
  ]
}
```

## Ghi chú thêm

- Workflow config thật hiện tại **có** `review-spec` trong slice đầu và sample này đã được kéo về khớp config checked-in
- `verify-runtime` có `inputs.url = ask-at-step` → orchestrator hỏi runtime URL khi đến đúng step này, không hỏi upfront ngay từ đầu
- `requires` mang nghĩa "artifact/contract tối thiểu đã tồn tại trong state", **không** mang nghĩa "step trước từng chạy" và **không** được satisfy bởi skip log
- `Shape` / `Recon` / `Decide` cũng được contract hóa (`shape_checked`, `recon_checked`, `decision_ready`) và pin `skippable: false` để pre-spec gate không thể bị skip mà vẫn vào `/create-spec`
- `spec` / `execute-spec` / `sync-spec` / `verify-feature` / `verify-runtime` được pin `skippable: false` vì đều là provider của downstream contracts trong workflow chuẩn
- `execute-spec` chỉ là consumer đầu tiên của `uses_repo_lock = true`; sau này step khác muốn chặn chạy song song chỉ cần bật cùng flag này
- `verify-runtime` có `requires: ["spec_synced", "verification_path"]` + `skippable: false` đảm bảo invariant "latest synced spec tồn tại và verification artifact đã được tạo trước" không bị phá dù human cố skip
- `manual-checklist` có `requires: ["spec_path", "summary_path", "verification_path", "runtime_verified"]` để đảm bảo manual-check bundle chỉ chạy sau khi chuỗi verify cốt lõi đã hoàn tất
- `review-pr` yêu cầu thêm `checklist_path`, có `inputs.base_ref = ask-at-step`, và không thể bị skip để diff review luôn có phạm vi rõ ràng
- Slice implement phải update output contract cho các skill/role tham gia workflow: `create-spec` emit `spec_path`, `execute-spec` emit `summary_path`, `sync-spec` emit `spec_synced`, `verify-feature` emit `verification_path`, `verify-runtime` emit `runtime_verified`, `manual-checklist` emit `checklist_path`, `review-pr` emit `pr_review_path`
- State file schema sẽ nằm trong spec slice, không mô tả ở draft này để giữ file review ngắn
- Spec slice phải bao gồm cả update tới `WORKFLOW_CODING_STANDARD.md` để reconcile mâu thuẫn control model (line 46-47, 365)

## Cần human chốt

1. Pin canonical `create-spec` (không `/spec` alias) trong config — đã chốt
2. `review-spec` nằm trong config thật hiện tại và được coi là source of truth — đã chốt
3. snake_case cho JSON fields — đã chốt
4. `requires` + `skippable: false` cho invariants đã thêm
5. `execute-spec` là human gate, còn `sync-spec` auto-run tiếp theo config thật — đã chốt
6. Bỏ fallback heuristic, thiếu comment = `unknown` = pause — đã chốt
7. Skill trả explicit contract/path metadata trong comment, không path inference ngầm — đã chốt
8. Multi-run + single repo lock + cleanup path — đã chốt

Draft này ready cho bước `/create-spec` kế tiếp nếu human chốt.
