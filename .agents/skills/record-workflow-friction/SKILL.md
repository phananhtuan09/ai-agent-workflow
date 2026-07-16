---
name: record-workflow-friction
description: Record a problem, blocker, ambiguity, workaround, or other friction encountered while an AI agent is running another workflow or skill. Use only when the human explicitly asks to note, capture, or log the current workflow difficulty for later workflow evaluation. Do not invoke automatically and do not fix or replace the underlying task.
---

# Record Workflow Friction

Capture one concise, durable observation without interrupting or evaluating the active workflow.

## Boundaries

- Run only after an explicit human request.
- Record observable facts separately from the agent's unverified hypothesis.
- Do not expose chain-of-thought, secrets, credentials, or unnecessary transcript content.
- Do not diagnose, fix, or redesign the workflow.
- After recording, return to the active workflow unless the human asks to stop.

## Procedure

1. Identify the active workflow or skill, current phase, runtime, and task context. Write `unknown` for unavailable values.
2. Describe the expected behavior, observed friction, practical impact, and any workaround or current blocker.
3. Add direct evidence references when available, such as a file path, command result, artifact, or session reference. Do not invent evidence.
4. Write one Markdown artifact to:

```text
docs/ai/workflow-observations/YYYY-MM-DD-{workflow}-{short-slug}.md
```

If the path already exists, add a numeric suffix. Keep one observation per file.

## Artifact Format

```md
---
phase: workflow-observation
schema_version: ai-workflow/observation-v1
status: agent-reported-observation
recorded_at: YYYY-MM-DDTHH:MM:SSZ
workflow_name: workflow-or-skill-name
workflow_version: unknown
workflow_phase: unknown
runtime: codex
session_reference: unknown
category: blocker
---

# Workflow Observation: Short title

## Task Context
What the agent was trying to accomplish when the friction occurred.

## Expected Behavior
The observable behavior expected from the workflow.

## Observed Friction
What actually happened. Keep this factual and concise.

## Impact
How the friction affected progress, quality, cost, safety, or human intervention.

## Workaround or Current State
The workaround used, or why the task remains blocked.

## Evidence References
- `path-or-session-reference`, or `unavailable`

## Agent Hypothesis (Unverified)
Optional suspected cause. Clearly keep this separate from observed facts.
```

Use a short category such as `problem`, `blocker`, `ambiguity`, `instruction-conflict`, `retry`, `human-correction`, `unused-artifact`, `runtime-gap`, or `other`.

## Evidence Rule

The artifact is discovery evidence with status `agent-reported-observation`. It becomes stronger workflow evidence only when `workflow-evaluation` corroborates it with a session trace, artifact, human correction, repeated observation, or controlled exercise. Observation counts alone do not establish a failure rate.

## Done When

- one observation artifact exists in `docs/ai/workflow-observations/`
- facts and hypotheses are separated
- missing evidence is marked unavailable
- the active task was not modified by this skill
