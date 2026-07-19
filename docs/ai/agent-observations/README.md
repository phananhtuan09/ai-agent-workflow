# Agent Observations

Human-requested notes about observable friction encountered while an AI agent is executing a task.

Observations may concern workflow behavior, model execution, runtime or tools, environment, task ambiguity, or human-agent coordination. They do not assume the workflow caused the issue.

Create observations with `record-workflow-friction` and store one observation per file:

```text
docs/ai/agent-observations/YYYY-MM-DD-{subject}-{short-slug}.md
```

Every observation has evidence status `agent-reported-observation`. `workflow-evaluation` must corroborate and attribute it before presenting it as a repeated pattern, confirmed behavior, or workflow failure.
