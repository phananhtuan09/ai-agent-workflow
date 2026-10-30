# Agent Observations

Human-requested notes about observable friction encountered while an AI agent is executing a task.

Observations may concern workflow behavior, model execution, runtime or tools, environment, task ambiguity, or human-agent coordination. They do not assume the workflow caused the issue.

Create observations with `record-workflow-friction` and store one observation per file:

```text
docs/evaluation/observations/YYYY-MM-DD-{subject}-{short-slug}.md
```

Every observation has evidence status `agent-reported-observation`. `workflow-evaluation` must corroborate and attribute it before presenting it as a repeated pattern, confirmed behavior, or workflow failure.

## Escaped bugs

When a bug escapes a `validate-change` run that reported `PASSED`, record it with category `escaped-bug`. That category adds:

- `validate_run` — path to the run's `report.md` / run dir, or `unavailable`
- `validate_status` — status that run reported, or `unknown`
- `found_by` — `human` | `production` | `later-run`
- `escape_class` — hypothesis from the escape-class table in `record-workflow-friction`
- `update_target` — installed project file the lesson would update, or `none`
- `upstream_candidate` — `yes` | `no`

The body includes `## Escape Analysis (Unverified)` with reproduction, which validate step should have caught it, and the proposed concrete addition. The skill never edits `update_target`.
