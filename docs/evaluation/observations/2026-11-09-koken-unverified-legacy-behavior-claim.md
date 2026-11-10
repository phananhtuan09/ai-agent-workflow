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
category: assumption
outcome_state: completed-with-friction
human_intervention: yes
---

# Agent Execution Observation: Legacy behavior stated without runtime check, later contradicted

## Task Context
`/validate-change` on PR #382, where the PR description framed the 合計金額 change as a deliberate deviation from legacy.

## Expected Behavior
A claim about legacy behavior that decides migration-bug versus CR classification is checked against running legacy, or marked unverified.

## Observed Friction
At the intent gate the agent stated that legacy shows a bare `¥` (event 85).
The validate run reached PASSED without a legacy comparison (event 402).
When the human asked for legacy links, the agent opened the legacy PDF and found it prints `\0`, so the fix restores legacy behavior and the PR description, `debt-log.md` and Jira comment give the wrong cause (event 529).

## First Visible Divergence
Event 85.

## Impact
Classification of the change (CR vs migration bug) was wrong through a PASSED report; PR description, debt log and a Jira comment carried the wrong cause.

## Extra Work or Recovery
A later PR description update was needed; at event 1144 Jira comment 75282 still carried the wrong cause.

## Human Intervention
The human's request for legacy links (event 502) triggered the check.

## Workaround or Current State
PR verdict unchanged (still correct behavior); documentation corrections were partly pending at event 1144.

## Evidence References
- `docs/evaluation/session-traces/claude/a5aded26-2157-4cb1-868e-d121dda2fcc9/session-trace.json` events 85, 402, 502, 529, 1144

## Agent Attribution Hint (Unverified)
The claim appears to repeat the PR description and debt log rather than observed legacy output.
