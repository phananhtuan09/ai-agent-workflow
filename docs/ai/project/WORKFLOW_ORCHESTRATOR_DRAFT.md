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
3. State file riêng để audit + hiển thị vị trí hiện tại (không cần lệnh `resume`, human chỉ gọi `/orchestrator next`/`/orchestrator continue`)
4. `Shape` / `Recon` / `Decide` là `exec: inline` — agent tự đọc `WORKFLOW_CODING_STANDARD.md` để biết phải làm gì, không tách thành skill
5. Outcome contract khép kín — orchestrator đọc HTML comment cuối output của skill; nếu thiếu comment thì outcome = `unknown` → pause cho human (không fallback heuristic)
6. `manual-checklist` dù config có ghi `auto: true` thì orchestrator cũng override cấm auto-chain (workflow coding standard bắt buộc human-triggered)
7. Skill trả explicit contract/artifact metadata trong comment → orchestrator ghi vào state, step sau đọc từ state (không path inference ngầm)
8. Slice đầu tiên gồm: orchestrator skill + 1 workflow config (`feature-standard`) + amendment section trong `WORKFLOW_CODING_STANDARD.md` + contract-emitter update cho các skill tham gia workflow (`create-spec`, `execute-spec`, `sync-spec`, `verify-feature`, `verify-runtime`, `manual-checklist`)

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
| `steps[].inputs` | object? | Metadata cho input phụ (vd runtime URL) — hỏi khi đến step, không hỏi upfront |

## Orchestrator rules (áp dụng lên tất cả workflow config)

- `manual-checklist` luôn được orchestrator override thành `human_gate: true` dù config khai báo khác (workflow coding standard cấm auto-chain)
- Outcome contract: orchestrator chỉ đọc dòng `<!-- orchestrator: outcome=... provides=... *_path=... -->` cuối output của skill; **không có fallback heuristic** — thiếu comment hoặc không match enum = `unknown` = pause cho human
- State file ở `docs/ai/workflows/.orchestrator-state.json` (single active run; không multi-run cho slice đầu)
- Run-id tự sinh theo format `<workflow-id>--<feature-slug>--<timestamp>`
- Skill trả explicit contract/artifact metadata trong comment → orchestrator ghi vào state `contracts` + `artifact_paths`; step sau đọc từ state (không path inference từ slug)
- `requires` check: trước khi chạy step, orchestrator verify mọi contract-id trong `requires` đã tồn tại trong state. `skip` **không** satisfy `requires`; nếu contract thiếu thì pause, báo blocker
- `provides` check: nếu step kết thúc với `outcome=continue` nhưng comment không emit đủ contract-id đã khai báo trong `provides`, orchestrator pause và mark run là blocked do contract mismatch
- `skippable: false` override lệnh `--skip` từ human — báo "step này là invariant, không skip được"
- Human có thể skip 1 step khi gọi orchestrator (vd `/orchestrator next --skip`) — chấp nhận nếu `skippable != false`; skip được log vào state history kèm warning
- Khi pause ở human_gate, orchestrator KHÔNG tự resume — human gọi lệnh kế tiếp để tiếp

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

Đây là JSON sẽ được đặt tại `docs/ai/workflows/feature-standard.json` sau khi chốt.
`review-spec` **không** ở trong slice đầu — giữ optional như hiện tại (xem `.pi/workflows/README.md:30`). Slice sau có thể thêm nếu đủ evidence theo `AI_WORKFLOW_RULES.md:42`.

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
      "id": "execute-spec",
      "title": "Execute spec",
      "type": "command",
      "value": "/execute-spec",
      "hint": "Implement từ spec, viết summary",
      "exec": "skill",
      "skill": "execute-spec",
      "auto": true,
      "human_gate": false,
      "stop_on_outcome": ["stop-blocked", "stop-too-broad"],
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
      "auto": false,
      "human_gate": true,
      "human_gate_reason": "Spec vừa được implement. Human cần đọc spec synced trước khi tiếp tục verify để chốt business intent không bị drift ngầm.",
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
      "hint": "Bundle artifacts thành checklist tiếng Việt cho human sign-off",
      "exec": "skill",
      "skill": "manual-checklist",
      "auto": false,
      "human_gate": true,
      "human_gate_reason": "Bước cuối sign-off — workflow coding standard cấm auto-chain bước này. Human trigger khi đã sẵn sàng review.",
      "requires": ["spec_path", "summary_path", "verification_path", "runtime_verified"],
      "provides": ["checklist_path"]
    }
  ]
}
```

## Ghi chú thêm

- `review-spec` **bỏ** khỏi slice đầu — giữ optional như `.pi/workflows/README.md:30` hiện tại. Thêm vào workflow mặc định cần evidence theo `AI_WORKFLOW_RULES.md:42`
- `verify-runtime` có `inputs.url = ask-at-step` → orchestrator hỏi runtime URL khi đến đúng step này, không hỏi upfront ngay từ đầu
- `requires` mang nghĩa "artifact/contract tối thiểu đã tồn tại trong state", **không** mang nghĩa "step trước từng chạy" và **không** được satisfy bởi skip log
- `Shape` / `Recon` / `Decide` cũng được contract hóa (`shape_checked`, `recon_checked`, `decision_ready`) và pin `skippable: false` để pre-spec gate không thể bị skip mà vẫn vào `/create-spec`
- `spec` / `execute-spec` / `sync-spec` / `verify-feature` / `verify-runtime` được pin `skippable: false` vì đều là provider của downstream contracts trong workflow chuẩn
- `verify-runtime` có `requires: ["spec_synced", "verification_path"]` + `skippable: false` đảm bảo invariant "latest synced spec tồn tại và verification artifact đã được tạo trước" không bị phá dù human cố skip
- `manual-checklist` có `requires: ["spec_path", "summary_path", "verification_path", "runtime_verified"]` để đảm bảo bundle sign-off chỉ chạy sau khi chuỗi verify cốt lõi đã hoàn tất
- Slice implement phải update output contract cho các skill tham gia workflow: `create-spec` emit `spec_path`, `execute-spec` emit `summary_path`, `sync-spec` emit `spec_synced`, `verify-feature` emit `verification_path`, `verify-runtime` emit `runtime_verified`, `manual-checklist` emit `checklist_path`
- State file schema sẽ nằm trong spec slice, không mô tả ở draft này để giữ file review ngắn
- Spec slice phải bao gồm cả update tới `WORKFLOW_CODING_STANDARD.md` để reconcile mâu thuẫn control model (line 46-47, 365)

## Cần human chốt

1. Pin canonical `create-spec` (không `/spec` alias) trong config — đã chốt
2. `sync-spec` đặt `human_gate: true` đã chốt
3. snake_case cho JSON fields — đã chốt
4. `requires` + `skippable: false` cho invariants đã thêm
5. `review-spec` bỏ khỏi slice đầu, giữ optional — đã chốt
6. Bỏ fallback heuristic, thiếu comment = `unknown` = pause — đã chốt
7. Skill trả explicit contract/path metadata trong comment, không path inference ngầm — đã chốt

Draft này ready cho bước `/create-spec` kế tiếp nếu human chốt.
