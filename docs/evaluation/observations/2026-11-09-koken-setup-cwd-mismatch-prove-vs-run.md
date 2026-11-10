---
phase: agent-execution-observation
schema_version: ai-agent/observation-v2
status: audit-detected-observation
recorded_at: 2026-11-09T09:37:53Z
subject: koken
observation_scope: runtime-tool
workflow_name: runtime-e2e-test
workflow_version: unknown
workflow_phase: setup
runtime: claude
model: claude-opus-5-5
session_reference: paseo/12250a1d-b27f-4eb7-a076-b6fabb175828 (claude/0203a588-f19d-4e62-9dbf-85a47b6473d3)
task_class: skill-update-and-runtime-setup
category: tool-failure
outcome_state: completed-with-friction
human_intervention: none observed
---

# Agent Execution Observation: Recipe setup steps run in different directories under prove and run

## Task Context
The agent ran a light runtime suite against base and head worktrees with a recipe that had already passed `setup.py prove`.

## Expected Behavior
A recipe proven READY by `setup.py prove` runs its `setup` steps the same way under `evidence.py run`.

## Observed Friction
`evidence.py run` failed at head setup: a relative `ln -s` target did not exist (events 848-849, log at 857).
The agent found that `setup.py prove` runs setup steps in the recipe `cwd`, while `evidence.py` `run_setup` runs them with `cwd=tree`, the worktree root (event 857).

## First Visible Divergence
Event 849, the first `evidence.py run` on the proven recipe.

## Impact
A recipe that passed setup proof failed in the scored run.

## Extra Work or Recovery
The recipe was rewritten to `cd` to the worktree root first, main/base/head were re-proved, the reference was re-filled, and the suite reran successfully (events 870-891).

## Human Intervention
none observed

## Workaround or Current State
Recovered with a recipe workaround; the tool was not changed, and the agent recommended aligning both scripts upstream (event 940).

## Evidence References
- `docs/evaluation/session-traces/claude/0203a588-f19d-4e62-9dbf-85a47b6473d3/session-trace.json` events 848, 849, 857, 864, 870, 874, 891, 940

## Agent Attribution Hint (Unverified)
The installed `runtime-e2e-test` scripts `setup.py` and `evidence.py` appear to use different working directories for recipe `setup` steps; upstream copies were not inspected by this sweep.
