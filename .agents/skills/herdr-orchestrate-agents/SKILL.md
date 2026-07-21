---
name: herdr-orchestrate-agents
description: Coordinate a shared task backlog with existing Codex, Claude Code, OpenCode, and other agent sessions in Herdr. Use when the user wants to capture tasks, view a task-centric board, assign a stored or new task to an existing Herdr agent, follow up by task ID, or sync task outcomes from agent sessions. Do not use to list all agent statuses, inspect an unrelated session, or create, start, close, focus, attach, or rename Herdr resources.
---

# Herdr Task Orchestrator

Use the centralized task store as the source of truth and Herdr as the execution transport.
Organize work around task IDs instead of asking the user to remember which session owns each task.

Do not reproduce the Herdr sidebar.
Never provide a general overview of all agent statuses.
Show live agent state only when it explains the state of an assigned task.

## Operating Boundary

Store-only actions such as capture and task board can run without Herdr.
Before any Herdr command, verify:

```bash
test "${HERDR_ENV:-}" = 1
```

If the check fails, continue only with store-only actions.
For dispatch, sync, inspect, or follow-up, stop and tell the user to open the orchestrator inside Herdr.

Operate against the current Herdr session only.
Never perform these actions under this skill:

- create or start a workspace, tab, pane, session, or coding agent
- close, stop, focus, attach, move, or rename Herdr resources
- approve permissions or answer product decisions on the user's behalf
- send input to an ambiguous target
- inspect an unrelated session that has no task assignment

Use `herdr-guide` when the user explicitly asks for direct pane or session control.

## Output Language

Return all user-facing output in Vietnamese unless the user explicitly requests another language.
Preserve commands, paths, IDs, agent names, workspace labels, code, and Herdr status values exactly.
Write stored task titles in Vietnamese.

## Task Store

Read and write `~/.ai-workflow/tasks.json`, shared with `task-manager`.
Accept version 1 data without requiring a separate migration.
On the next mutation, write version 2 and preserve every unknown field.

Use this compatible schema:

```jsonc
{
  "version": 2,
  "projects": [
    {
      "id": "p_<random6>",
      "name": "folder-name",
      "root": "/absolute/path"
    }
  ],
  "tasks": [
    {
      "id": "t_<random6>",
      "project_id": "p_xxx",
      "title": "ý định ngắn gọn của người dùng",
      "details": "optional durable context and constraints",
      "status": "todo | doing | done",
      "assignment": {
        "workspace_root": "/absolute/path",
        "workspace_label": "project-label",
        "agent_name": "optional unique name",
        "agent_type": "codex",
        "terminal_id": "term_...",
        "assigned_at": "ISO"
      },
      "execution": {
        "state": "working | blocked | awaiting_human | completed | unknown",
        "summary": "optional",
        "files_changed": "optional",
        "verification": "optional",
        "blocker": "optional",
        "next": "optional",
        "synced_at": "ISO"
      },
      "workflow": {
        "router": "feature-implement-gnhf",
        "workflow_path": "docs/ai/workflows/feature-implement-gnhf.json",
        "spec_path": "docs/ai/specs/feature-name.md",
        "feature_slug": "feature-name",
        "run_id": "optional orchestrator run id",
        "run_state_path": "optional absolute run state path",
        "status": "starting | running | paused | blocked | awaiting_human",
        "current_step_id": "optional",
        "implementation_workspace_path": "optional absolute path",
        "gnhf_budget_path": "optional absolute path",
        "last_outcome": "optional orchestrator outcome",
        "stop_reason": "optional exact stop reason",
        "epochs_completed": "optional number",
        "max_epochs": "optional number",
        "cumulative_tokens": "optional number",
        "max_total_tokens": "optional number",
        "tokens_estimated": "optional boolean",
        "updated_at": "ISO"
      },
      "created": "ISO",
      "updated": "ISO"
    }
  ]
}
```

The optional metadata belongs to orchestration.
Standalone `task-manager` actions must preserve it.
Do not persist a pane ID because pane IDs can change after moves or restores.
Absence of `workflow` means the task uses the normal direct-send router.

For project resolution, match the normalized absolute root first.
Use the project name only as a legacy fallback when it resolves to the same root.
Register a new project when two different roots share the same folder name.

Always read the complete store before mutation.
Write the complete store atomically through a temporary file and rename.
If JSON parsing fails, do not overwrite the store.
Report corruption and suggest `task reset`.

## Live Target Resolution

Read only the live state needed for the requested task:

```bash
herdr workspace list
herdr agent list
```

Use agent `cwd` or `foreground_cwd` to match the task project's absolute root.
Run `herdr pane list` only when no matching agent exists and you must distinguish an empty project workspace from a missing workspace.
Resolve an existing assignment in this order:

1. Unique `agent_name` in the project workspace.
2. Exact `terminal_id` while that terminal is still live.
3. Unique `agent_type` in the project workspace.

For a new dispatch, prefer a user-named target.
If the user did not name a target, auto-select only when exactly one eligible idle agent exists in the task project.
If multiple targets remain, show only those candidates and ask the user to choose.

Treat IDs as opaque and refresh live state immediately before every send.

## Route The Request

Choose the smallest workflow that completes the request:

- **Capture**: create one or more tasks without requiring a separate `task-manager` invocation.
- **Task board**: show task ownership and progress instead of agent status overview.
- **Dispatch task**: assign a stored task, or capture and assign a raw request in one operation.
- **Dispatch workflow task**: explicitly route an approved spec task through `feature-implement-gnhf`.
- **Resume workflow task**: continue a paused GNHF workflow with an additional bounded budget.
- **Sync tasks**: reconcile assigned tasks with their agent sessions.
- **Inspect task**: answer progress, result, or blocker questions by task ID or unique task title.
- **Follow-up**: send clarification to the session already assigned to a task.
- **Prompt preview**: prepare a task prompt without sending or mutating the store.

When one request combines capture and dispatch, perform both in the same workflow.

## Capture Workflow

1. Resolve the project from an explicit project, a matching Herdr workspace root, or the current working directory.
2. Create a concise Vietnamese title that preserves the user's intent.
3. Store durable requirements, context, constraints, and requested verification in `details` only when they exist.
4. Generate `t_` plus 6 random lowercase hexadecimal characters.
5. Create the task as `todo` with ISO timestamps.
6. Support multiple tasks in one request and write the store once.

Do not force the user to call `task-manager` before dispatch.
If the user already supplied a stored task ID, do not create a duplicate.

## Task Board Workflow

The task board replaces the old agent overview.
Default to all registered projects because orchestration is cross-project.
Filter to one project only when the user names it or explicitly asks for the current project.

1. Read tasks for the requested project or all projects.
2. Read Herdr state once only when at least one task is assigned and active.
3. Correlate live state only for those active assignments.
4. Do not read transcripts unless a task is `blocked` and the blocker is missing from stored execution data.
5. Calculate the complete summary before limiting any displayed task list.
6. Show at most 10 recently completed task cards unless the user requests more.

Classify every task into exactly one reporting bucket:

- **Chưa giao**: `status: todo`.
- **Đang chạy**: `status: doing` and the effective execution state is `working` or another active non-terminal state.
- **Cần xử lý**: `status: doing` and the effective execution state is `blocked` or `unknown`.
- **Chờ duyệt**: `status: doing` and `execution.state: awaiting_human`.
- **Đã xong**: `status: done`.

Use fresh live Herdr state as the effective execution state for a resolvable active assignment.
Fall back to stored `execution.state` when live state is unavailable.
For workflow-routed tasks, stored workflow `paused`, `blocked`, or `awaiting_human` state takes precedence over live agent `idle` or `done` status.
Do not double-count blocked or awaiting-human tasks as running.
When workflow budget data exists, show compact progress such as `Epoch 2/4 · 410000/1000000 tokens` on the task card.

Calculate progress for the whole board and for each project:

```text
completion_percent = round(done_tasks / total_tasks * 100)
```

Use `0%` when there are no tasks.
Render a 10-cell ASCII progress bar where each filled cell represents approximately 10%, for example `[######----] 60%`.
Label this metric as current backlog progress because it covers only tasks still present in the store.
Explain that deleting or cleaning completed tasks changes both the total and the percentage.

Render the board in this order:

1. Overall summary.
2. Progress by project.
3. Vertical Kanban lanes.

Use this output shape:

```text
TASK BOARD — Tất cả project
Cập nhật: 21-07-2026 14:30

TỔNG QUAN
Tổng: 12 · Đã xong: 5 · Chờ duyệt: 1 · Đang chạy: 2 · Cần xử lý: 1 · Chưa giao: 3
Tiến độ backlog hiện tại: [####------] 42%

THEO PROJECT
Project        Tổng  Chưa giao  Đang chạy  Cần xử lý  Chờ duyệt  Đã xong  Tiến độ
admin-web          3          1           1           0           0         1  [###-------] 33%
payment-api        4          1           0           0           1         2  [#####-----] 50%
salon-app          5          1           1           1           0         2  [####------] 40%

┌ CẦN XỬ LÝ · 1
│ t_ab12cd [salon-app] "Sửa lỗi đăng nhập"
│ salon-codex · BLOCKED · Cần quyết định API contract
└

┌ CHỜ DUYỆT · 1
│ t_cd34ef [payment-api] "Bổ sung idempotency"
│ payment-claude · GNHF workflow completed · Chưa merge
└

┌ ĐANG CHẠY · 2
│ t_ef56ab [admin-web] "Thêm bộ lọc bảng"
│ admin-codex · WORKING
└

┌ CHƯA GIAO · 3
│ t_98cd76 [admin-web] "Thêm bộ lọc bảng"
└

┌ ĐÃ XONG GẦN ĐÂY · 5
│ t_12ab34 [payment-api] "Cập nhật tài liệu API"
│ VERIFIED
└
```

Sort the project summary alphabetically for stable scanning.
If two projects share the same name, append a shortened root path that distinguishes them.
Use counts from all matching tasks even when only recent completed task cards are shown.
Omit empty Kanban lanes, but never omit the overall summary or project summary.

Do not list idle agents that have no assigned task.
Do not claim that `idle` or `done` proves task success.

## Router Selection

Normal direct dispatch remains the default.
Treat absence of task `workflow` metadata as the direct router and follow [Dispatch Task Workflow](#dispatch-task-workflow) without adding workflow behavior.

Select `feature-implement-gnhf` only when the user explicitly asks for GNHF, the GNHF loop, or that workflow by name.
Never select it automatically from task size or complexity.

For GNHF dispatch, resume, sync, or inspect, read [GNHF Router](references/gnhf-router.md) before acting.
That reference defines eligibility, orchestrator invocation, resumable budget handling, and task-state mapping.

## Dispatch Task Workflow

1. Confirm the task uses the direct router, then resolve it by exact ID or a unique title match.
2. If the user supplied a raw request instead, capture it first and continue with the new task ID.
3. Reject a `done` task unless the user explicitly asks to reopen it.
4. Reject dispatch when another task is already `doing` in the same project unless the user explicitly confirms parallel work.
5. Resolve the project workspace and target agent from fresh Herdr state.
6. Inspect at most 60 recent unwrapped lines only when needed to avoid conflicting with the target's current task.
7. Preserve the task intent and add only context supported by `details` or the current conversation.
8. If the target is `working`, do not inject input unless the user explicitly says to send now.
9. If the target is `blocked`, send only a user-authorized answer or clarification.

Build a direct prompt with this shape, omitting empty sections:

```text
TASK_ID: <task-id>

Mục tiêu
<task title>

Bối cảnh
<stored details or confirmed conversation context>

Yêu cầu
<confirmed requirements>

Ràng buộc
<confirmed constraints>

Xác minh
<requested checks>

Báo cáo kết quả
Khi dừng vì hoàn tất hoặc bị chặn, hãy kết thúc câu trả lời bằng đúng block sau và viết giá trị bằng tiếng Việt:

HERDR_TASK_RESULT
Task: <task-id>
Status: completed | blocked
Summary:
Files changed:
Verification:
Blocker:
Next:
```

Do not invent requirements, file paths, acceptance criteria, or permission decisions.
Keep a simple task prompt simple.

Refresh live state, then send the prompt directly:

```bash
herdr pane run <pane-id> "<task-prompt>"
```

Never route the prompt through a file or ask the target to read a path outside its workspace.

After sending, wait briefly for `working`.
If the wait times out, inspect the pane and confirm that the task ID was submitted or processed.
Only after submission is confirmed, update the task to `doing`, store the assignment, set `execution.state` to `working`, and write the store.
If submission cannot be confirmed, leave the task unchanged and report the failure.

Return the task ID, project, resolved agent, and the exact prompt sent.
Do not wait for completion unless requested.

## Sync Tasks Workflow

Sync one task, one project, or every task with `status: doing`.

1. Read the store and live Herdr state once.
2. Resolve each assignment without relying on a stored pane ID.
3. Handle the live state as follows:

| Live state | Action |
| --- | --- |
| `working` | Set `execution.state` to `working`; do not read the transcript. |
| `blocked` | Read at most 80 recent unwrapped lines, extract the exact blocker, and set `execution.state` to `blocked`. |
| `idle` or `done` | Read at most 120 recent unwrapped lines and find the latest `HERDR_TASK_RESULT` block for the task ID. |
| `unknown` or missing | Keep the task `doing`, set `execution.state` to `unknown`, and report that the assignment cannot be resolved safely. |

For a direct-router result block with `Status: completed`, copy the reported outcome into `execution`, set the task to `done`, and update timestamps.
For `Status: blocked`, keep the task `doing` and set `execution.state` to `blocked`.
If no trustworthy result block exists, use bounded transcript evidence but do not mark the task done unless completion is explicit.

Write the store once after processing all selected tasks.
Return only task changes, blockers, unresolved assignments, and the next useful action.
Do not return a general agent dashboard.

## Inspect Task Workflow

Resolve the task first, then use its stored assignment.
Never require the user to remember the workspace or agent session.

If the task is `todo`, report that it has not been assigned.
If the task is `done`, return the stored outcome without contacting Herdr unless the user asks to refresh evidence.
If the task is `doing` and has workflow metadata, run the workflow sync rules from [GNHF Router](references/gnhf-router.md).
If the task is `doing` without workflow metadata, run the direct sync logic for that task.

For an explicit inspect request only, when an assigned agent is `idle` or `done` and no result block exists, send one bounded task-specific report request directly to that agent.
The request must prohibit new implementation work and ask only for the `HERDR_TASK_RESULT` block for the task ID.
Do not send this checkpoint during bulk sync.

Return:

```text
Task: <id> "<title>"
Project: <project>
Agent: <resolved target or "chưa giao">
Trạng thái: <todo | doing | blocked | awaiting_human | done | unknown>
Kết quả: <stored or synchronized summary>
Xác minh: <reported checks>
Trở ngại: <exact blocker or "không có">
Tiếp theo: <one concise recommendation>
```

Distinguish agent self-report from independent verification.

## Follow-Up Workflow

1. Resolve the task and its assignment.
2. If task workflow metadata exists, route resume and paused-decision handling through [GNHF Router](references/gnhf-router.md).
3. Refresh the target from live Herdr state.
4. Preserve the user's clarification exactly and prefix it with `TASK_ID: <task-id> FOLLOW-UP`.
5. If the target is `working`, send only when the user explicitly requests immediate delivery.
6. Send directly with `herdr pane run` and never through a payload file.
7. Keep the existing assignment and update only task timestamps after confirmed submission.

If the assignment is stale or ambiguous, do not guess.
Report the missing target and ask the user to choose a live agent for reassignment.

## Manual Task Transitions

When the user explicitly accepts a direct result or workflow handoff as done, set `status` to `done` and `execution.state` to `completed` while preserving assignment and workflow history.
When the user explicitly requeues a task, set `status` to `todo` and remove `assignment`, `execution`, and `workflow`.
Never infer a requeue from an unavailable agent.

## Coordination Safety

- Refresh live state before every send because pane IDs can change.
- Never use the focused pane or sidebar order as an implicit target.
- Never broadcast a task to multiple agents unless the user explicitly requests duplicate execution.
- Refuse implicit parallel dispatch in one project because agents may edit the same files.
- Treat Herdr status as operational evidence, not proof of task correctness.
- Preserve existing task data and unknown fields during every write.
- Do not mark a task done from `idle` or `done` status alone.
- Do not expose raw store JSON or full transcripts unless the user asks.

## Setup Responses

If the project workspace is missing:

```text
Không tìm thấy workspace cho project của task `<task-id>` trong Herdr session hiện tại.
Hãy mở project đó trong cùng Herdr session rồi yêu cầu tôi dispatch lại task.
```

If no eligible agent is running:

```text
Project của task `<task-id>` chưa có agent phù hợp đang chạy.
Hãy mở agent trong workspace đó, nên đặt tên duy nhất, rồi yêu cầu tôi dispatch lại task.
```

Do not create the missing workspace or agent automatically.
