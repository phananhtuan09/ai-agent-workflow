# Workflow Observations

Human-requested notes about friction encountered while an AI agent is running a workflow or skill.

Create observations with `record-workflow-friction` and store one observation per file:

```text
docs/ai/workflow-observations/YYYY-MM-DD-{workflow}-{short-slug}.md
```

Every observation has evidence status `agent-reported-observation`. The `workflow-evaluation` skill may use it as an incident candidate, but must corroborate it before presenting it as an observed, repeated, or confirmed workflow failure.
