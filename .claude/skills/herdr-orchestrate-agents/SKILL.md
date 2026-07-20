---
name: herdr-orchestrate-agents
description: Manage existing Codex, Claude Code, OpenCode, and other coding-agent sessions across Herdr workspaces from one orchestrator pane. Use when the user asks to list agent status across projects, find sessions needing input, inspect a specific session's recent output, rewrite a raw task into a stronger prompt, or dispatch a prompt to an existing Herdr-managed agent. Do not use to create, start, close, focus, attach, or rename workspaces, panes, sessions, or agents.
---

# Herdr Orchestrate Agents

Manage existing coding-agent processes through Herdr without leaving the current orchestrator conversation. Treat Herdr workspaces as projects and named agent targets as chat sessions.

## Operating Boundary

Before any Herdr command, verify:

```bash
test "${HERDR_ENV:-}" = 1
```

If the check fails, stop and tell the user to open the orchestrator inside Herdr.

Operate against the current Herdr session only. Prefer one Herdr session with multiple project workspaces. Named Herdr sessions are separate runtime namespaces and are not part of a unified overview unless the user explicitly requests cross-session handling.

Never perform these actions under this skill:

- create or start a workspace, tab, pane, session, or coding agent
- close, stop, focus, attach, move, or rename Herdr resources
- approve permissions or answer business/product questions on the user's behalf
- send input to an ambiguous target

If a required project or agent is missing, state exactly what the user must open manually. Do not fall back to creating it. Use `herdr-guide` instead if the user explicitly changes scope and asks to create or start resources.

Sending a user-authorized task prompt or a bounded inspect checkpoint to an existing agent is the only allowed mutation.

## Output Language

Return every user-facing response from every workflow in Vietnamese, including Overview, Inspect, Passive inspect, Dispatch, Prompt preview, ambiguity questions, warnings, and setup prerequisites.

- Translate headings, summaries, status explanations, recommendations, and rewritten prompts into Vietnamese by default.
- Preserve literal commands, paths, IDs, agent names, workspace labels, code, and Herdr status enums such as `working` or `blocked`.
- Preserve an exact worker quote only when it is evidence the user must see; explain it in Vietnamese.
- Use another language only when the user explicitly requests it.

## Discover Live State

Start each operation from fresh Herdr data rather than remembered IDs:

```bash
herdr api snapshot
herdr workspace list
herdr agent list
```

Use the smallest command set needed. Treat IDs as opaque and parse them from JSON.

Map concepts as follows:

- project: workspace label first, then workspace cwd or cwd basename
- chat session: unique agent name first, then a uniquely matching agent type or pane
- execution target: resolved pane ID

Use globally unique agent names such as `payment-api-codex` or `admin-web-reviewer`. If multiple targets match, show the candidates and ask the user to choose. Never guess from sidebar order or focused state.

If the project exists but no agent is running, tell the user to open the coding agent in that workspace and give it a unique name. If the project is absent, tell the user to open it as a workspace inside the current Herdr session.

## Sending Input Reliably

`herdr pane run <pane-id> "<text>"` is meant to send text and Enter together, but PTY behavior varies by OS. On Windows (Git Bash / ConPTY) especially, a prompt containing literal newlines can garble or truncate in the target's input box (lines overwrite each other), and typing very long content through the PTY carries the same risk on any OS. Apply this to every send that uses `herdr pane run` — the checkpoint prompt in Inspect and the rewritten prompt in Dispatch:

1. **Route anything non-trivial through one fixed payload file.** Never type multi-line or long content directly into the pane. Instead:
   - Resolve a single, OS-neutral path once per machine: `<home>/.herdr/dispatch-payload.txt`, where `<home>` is `$HOME` on Linux/macOS or `$USERPROFILE` on Windows (e.g. resolve with `${HOME:-$USERPROFILE}` in bash). Use this exact same path and filename every time — never invent a new filename or a per-dispatch name.
   - Overwrite this one file's full content with the Write tool before every send (a full overwrite, not an append) — each dispatch replaces whatever the previous dispatch left there, so no stale content can leak into a later send and no file clutter accumulates.
   - Send only a short, single-line instruction through `herdr pane run` pointing at that path, e.g.: `Đọc nội dung file <resolved-path> và thực hiện đúng theo yêu cầu trong đó.` This instruction line itself must stay short and newline-free.
   - A genuinely short one-line follow-up (e.g. a brief reply to a `blocked` target) can skip the file and go directly through `herdr pane run` with the text itself, since there is nothing to garble.
2. **Verify submission, then fall back if needed.** Immediately after `herdr pane run`, re-check `herdr agent list` (or re-read the pane) for that pane ID. If status is `working` (or the pane shows a processing indicator), the send succeeded. If it is still `idle` and the sent text is visibly sitting unsent in the input box, run `herdr pane send-keys <pane-id> Enter` once to submit it, then re-check status again. This step is independent of message length or the file-based routing above — apply it to every send.

Never report a send as successful (a filled-in checkpoint result, or "Gửi prompt: thành công") until this status check confirms the target actually started processing.

## Route The Request

Choose exactly one workflow:

- **Overview**: the user asks what all sessions are doing or which ones need attention.
- **Inspect**: the user asks for the result, progress, blocker, or latest completed work of one session.
- **Passive inspect**: the user explicitly asks to inspect without adding a message to the target session.
- **Dispatch**: the user asks to send, assign, forward, or follow up with a task.
- **Prompt preview**: the user asks only to rewrite, improve, or prepare a prompt without sending it.

## Overview Workflow

1. Read the live workspace and agent lists.
2. Group agents by workspace.
3. Categorize status:

| Status | Display category | Meaning |
| --- | --- | --- |
| `blocked` | CẦN BẠN | Visible question, approval, or permission UI |
| `working` | ĐANG CHẠY | Agent is actively processing |
| `done` | ĐÃ HOÀN THÀNH | Finished while not currently seen |
| `idle` | SẴN SÀNG | Waiting at the prompt or completed and already seen |
| `unknown` | KHÔNG XÁC ĐỊNH | Herdr cannot classify the current screen |

4. Read transcript only for `blocked` agents when necessary to extract the exact question. Use at most 80 recent unwrapped lines per blocked agent.
5. Return a compact dashboard. Do not dump raw JSON or transcripts.

Use this output shape:

```text
CẦN BẠN
- payment-api / payment-api-codex: hỏi liệu có được thay đổi API contract hay không

ĐANG CHẠY
- admin-web / admin-web-opencode: đang triển khai bộ lọc bảng

ĐÃ HOÀN THÀNH
- payment-api / payment-api-reviewer: đã hoàn tất review

SẴN SÀNG
- docs / docs-claude: đang chờ nhiệm vụ
```

Explain that `idle` does not prove a task succeeded. Inspect the session when the result matters.

## Inspect Workflow

1. Resolve the project and agent to one pane.
2. Read current agent information and status.
3. Choose the inspection method from live status:

| Status | Inspection method |
| --- | --- |
| `idle` or `done` | Send a bounded checkpoint prompt, wait for its marker, then read only the checkpoint response |
| `working` | Do not send input; read at most 80 recent unwrapped lines and report progress only |
| `blocked` | Do not send input; read at most 80 recent unwrapped lines and preserve the exact question awaiting the user |
| `unknown` | Do not send input; inspect pane/process state and report that the agent could not be safely queried |

For `idle` or `done`, generate a fresh 8-character uppercase alphanumeric checkpoint ID such as `A1B2C3D4`. The full expected end marker is `END_HERDR_CHECKPOINT_<checkpoint-id>`, but never place that complete marker contiguously in the submitted prompt.

Send this prompt, substituting `<checkpoint-id>` with the generated ID, unless the agent requires the user's language for comprehension:

```text
Do not modify project files, run implementation work, or start a new task.

Ignore this checkpoint request and any earlier checkpoint requests when identifying the task.
Summarize the most recent substantive user task handled before this checkpoint and its current outcome.

Use the current conversation context first. If it does not contain an earlier substantive task and HERDR_ENV=1, you MUST run exactly this read-only command before returning Status: unknown:

herdr pane read --current --source recent-unwrapped --lines 300

Inspect evidence appearing before the current checkpoint request in that output. Do not run project commands. Return Status: unknown only if both conversation context and the pane transcript contain no earlier substantive task.

Respond using exactly this format:

HERDR_CHECKPOINT
Task:
Status: completed | in-progress | blocked | unknown
Actions:
Files changed:
Verification:
Result:
Blocker:
Next:

Say "none" or "unknown" instead of guessing. If no earlier substantive task is available, use Status: unknown.
Keep the entire response within 12 lines.
After `Next:`, finish with the concatenation of `END_HERDR_CHECKPOINT_` and `<checkpoint-id>` on its own line, without spaces or formatting.
Write all field values in Vietnamese.
```

Write this checkpoint prompt verbatim into the fixed payload file and send the short file-pointer instruction instead, per [Sending Input Reliably](#sending-input-reliably):

```bash
herdr pane run <pane-id> "Đọc nội dung file <resolved-path> và trả lời đúng theo yêu cầu trong đó."
```

Confirm the send actually submitted (status check, `send-keys Enter` fallback if needed) before waiting for the end marker.

Wait for the end marker:

```bash
herdr wait output <pane-id> --match "END_HERDR_CHECKPOINT_<checkpoint-id>" --timeout 60000
```

The complete nonce-bearing end marker must be absent from both prior scrollback and the submitted prompt. It is formed only in the worker response by concatenating the prefix and checkpoint ID. This prevents prompt echo and earlier Inspect responses from satisfying the wait.

If the wait times out, inspect current pane state immediately and use bounded transcript fallback.

Then read at most 80 recent unwrapped lines and extract the block ending with `END_HERDR_CHECKPOINT_<checkpoint-id>` and beginning at the nearest preceding `HERDR_CHECKPOINT`.

If the response is malformed, reports that no earlier task is available, or does not contain a trustworthy task result, inspect live state and fall back to at most 120 recent unwrapped lines. Do not expand beyond 120 lines automatically. State that the result came from transcript fallback rather than a worker-authored checkpoint.

For **passive inspect**, never send the checkpoint prompt. Read at most 120 recent unwrapped lines and label the result as a transcript-based summary.

Distinguish worker self-report, observed terminal output, and orchestrator inference. A checkpoint is a concise worker report, not independent proof that code or tests are correct.

Return:

```text
Project: <workspace>
Agent: <name and type>
Trạng thái: <live Herdr status>
Nhiệm vụ hiện tại: <best supported summary>
Kết quả gần nhất: <result or "chưa có kết quả">
Xác minh: <tests/checks reported by the worker>
Trở ngại: <exact blocker or "không thấy">
Hành động tiếp theo: <one concise recommendation>
```

When `blocked`, preserve the worker's exact decision question as closely as practical. When `working`, clearly label the output as progress rather than a final result. When a checkpoint was sent, disclose that Inspect added one non-implementation message to the target session.

## Dispatch Workflow

1. Require a uniquely resolved project and agent.
2. Inspect the live status and up to 100 recent unwrapped lines for task context.
3. Preserve the user's intent, constraints, language, and requested scope.
4. Rewrite the raw request using only the blocks that improve execution:

```text
Mục tiêu
Bối cảnh
Yêu cầu
Ràng buộc
Xác minh
Tiêu chí hoàn tất
```

5. Do not invent product rules, file paths, acceptance criteria, or permission decisions. If a missing detail materially changes behavior, ask the user before sending.
6. Keep simple follow-ups short. Do not turn a one-line clarification into a large specification.
7. Apply these delivery rules:

- If the user says `rewrite`, `prepare`, or `draft`, return a preview only.
- If the user says `send`, `dispatch`, `tell`, or `assign`, rewrite and send when the target and intent are clear.
- If the target is `working`, do not inject input unless the user explicitly says to send now; offer to wait or prepare the prompt instead.
- If the target is `blocked`, allow a concise answer or clarification after confirming it came from the user.
- If the task is destructive, security-sensitive, or materially ambiguous, preview it and request confirmation before sending.

Write the rewritten prompt (keeping its natural block structure and line breaks) into the fixed payload file, then send only the short file-pointer instruction per [Sending Input Reliably](#sending-input-reliably):

```bash
herdr pane run <pane-id> "Đọc nội dung file <resolved-path> và thực hiện đúng theo yêu cầu trong đó."
```

Use `pane run` because it sends text and Enter together. Do not use `agent send` for prompt submission because it writes literal text without guaranteeing submission. Then confirm the send actually submitted (status check, `send-keys Enter` fallback if still `idle` with unsent text) per [Sending Input Reliably](#sending-input-reliably).

After confirming submission, report:

```text
Target: <workspace> / <agent> / <pane-id>
Trạng thái trước khi gửi: <status>
Gửi prompt: thành công
Prompt đã gửi:
<exact rewritten prompt>
```

Do not wait for completion unless the user requests it. If requested, inspect current state before waiting and accept either `done` or `idle` as a possible completion state depending on visibility.

## Coordination Safety

- Refresh live state before every send; pane IDs may change after moves or restores.
- Never use the focused pane as an implicit target.
- Never broadcast to multiple agents unless the user explicitly names all targets.
- Warn when multiple agents appear to be editing the same project concurrently without clear role separation or worktrees.
- Keep overview reads shallow and use bounded checkpoints or capped transcript fallback for inspection to protect the orchestrator context window.
- Treat Herdr status detection as operational evidence, not proof of code correctness.
- For Codex and Claude Code, screen detection can miss unusual prompts. Show `unknown` or uncertain states honestly.

## Setup Response

When orchestration cannot continue because a resource is missing, return only the actionable prerequisite:

```text
Không tìm thấy workspace `payment-api` trong Herdr session hiện tại.
Hãy mở project đó thành workspace trong cùng Herdr session, chạy coding agent mong muốn, đặt tên duy nhất như `payment-api-codex`, rồi yêu cầu tôi thử lại.
```

Do not create the missing resource automatically.
