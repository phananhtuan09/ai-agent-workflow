---
phase: agent-execution-observation
schema_version: ai-agent/observation-v2
status: audit-detected-observation
recorded_at: 2026-11-09T09:37:53Z
subject: koken
observation_scope: model-execution
workflow_name: validate-change
workflow_version: unknown
workflow_phase: intent
runtime: claude
model: claude-sonnet-5-5
session_reference: paseo/ecd0fde6-1b58-430c-8e0d-755255f3ab88 (claude/a5aded26-2157-4cb1-868e-d121dda2fcc9)
task_class: pr-validation
category: human-correction
outcome_state: completed-with-friction
human_intervention: yes
---

# Agent Execution Observation: Customer requirement classified as agent-intent until the human pointed to the ticket file

## Task Context
`/validate-change` on PR #382 (KOK-96, show 0 in 合計金額 on the combined purchase-order PDF).

## Expected Behavior
Intent sources available in the project, including the customer ticket file, are checked before an expectation is classified as unconfirmed agent intent.

## Observed Friction
The agent classified K1 as `agent-intent` because Jira KOK-96 mentioned only 単価 (events 85, 319) and ended at NEEDS_REVIEW asking where the customer confirmation was recorded.
The human pointed to `docs/listbug-customer/prj-003-17786.md` (event 346).
The agent stated it had judged wrongly and had not opened `docs/listbug-customer` before asking; the original ticket note #3 requested the PDF change (event 365).

## First Visible Divergence
Event 85, when K1 was labeled `agent-intent` from Jira alone.

## Impact
The run reported NEEDS_REVIEW instead of PASSED and asked the human an unnecessary question; a follow-up question about NULL handling was also later withdrawn (event 365).

## Extra Work or Recovery
K1 was reclassified, and the runtime suite and independent audit were rerun before a PASSED report (events 369-402).

## Human Intervention
The human supplied the ticket file path (event 346) and approved the rerun (event 369).

## Workaround or Current State
Completed: PASSED at event 402.

## Evidence References
- `docs/evaluation/session-traces/claude/a5aded26-2157-4cb1-868e-d121dda2fcc9/session-trace.json` events 85, 319, 342, 346, 365, 369, 402

## Agent Attribution Hint (Unverified)
The installed intent-sourcing guidance may not name the project's customer ticket folder; the agent may also have stopped searching after Jira.
