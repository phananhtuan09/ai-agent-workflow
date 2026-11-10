---
phase: agent-execution-observation
schema_version: ai-agent/observation-v2
status: audit-detected-observation
recorded_at: 2026-11-09T09:37:53Z
subject: koken
observation_scope: model-execution
workflow_name: runtime-e2e-test
workflow_version: unknown
workflow_phase: setup
runtime: claude
model: claude-opus-5-5
session_reference: paseo/12250a1d-b27f-4eb7-a076-b6fabb175828 (claude/0203a588-f19d-4e62-9dbf-85a47b6473d3)
task_class: skill-update-and-runtime-setup
category: human-correction
outcome_state: completed-with-friction
human_intervention: yes
---

# Agent Execution Observation: Runtime setup reported working before a real suite run

## Task Context
After updating three installed workflow skills in the Koken project, the agent ran `/runtime-e2e-test setup` to prove a parallel base/head instance recipe.

## Expected Behavior
A report that the setup works end to end is backed by the path that consumes the recipe (`evidence.py run` on real base and head refs), or states that only `setup.py prove` was run.

## Observed Friction
The agent reported setup as READY twice (event 527, then 694 after design questions) on the strength of `setup prove` runs.
The human asked whether the setup had actually been tried with a test (event 698).
The agent confirmed it had only run `setup prove` and not `evidence.py run` (event 702).
The first real `evidence.py run` then failed at the head setup step (events 848-849).

## First Visible Divergence
Event 527, the first setup report that did not state that the suite-run path was still unexercised.

## Impact
A recipe that would fail in `evidence.py run` was presented as ready; the defect surfaced only because the human asked for a trial.

## Extra Work or Recovery
A light trial suite was written, the recipe was rewritten, main/base/head were re-proved, the reference was re-filled, and the suite was run twice (events 702-940).

## Human Intervention
The human prompted the end-to-end trial (event 698).

## Workaround or Current State
The rerun succeeded and the final report disclosed the tool defect (event 940).

## Evidence References
- `docs/evaluation/session-traces/claude/0203a588-f19d-4e62-9dbf-85a47b6473d3/session-trace.json` events 527, 694, 698, 702, 848, 849, 940

## Agent Attribution Hint (Unverified)
The setup mode may treat `setup prove` READY as sufficient proof without requiring one `evidence.py run`; this may also be a model-execution choice.
