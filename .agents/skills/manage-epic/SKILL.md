---
name: manage-epic
description: Use when the user wants to sync epic status from feature plans and report overall progress.
---

# Manage Epic

Use this skill to read all feature plans linked to an epic, sync their status into the epic table, and report progress.

This skill does not create or restructure epics. Epic creation is handled by the `development-orchestrator` skill.

## Inputs

- Epic doc path: `docs/ai/planning/epic-{name}.md`

## Workflow

### 1. Load epic

Read:

- `docs/ai/planning/epic-{name}.md`

If not found → stop and report path tried.

### 2. Read all linked feature plans

For each plan row in the epic's Feature Plans table:

- read `docs/ai/planning/feature-{plan-name}.md`
- extract `status` field from frontmatter
- extract total task count and completed task count (checkbox `[x]` vs `[ ]`)
- note any explicit blocker recorded in the plan

If a plan file is not found → mark that row as `missing` in the report; continue with others.

### 3. Sync epic table

Update each row's status in the epic's Feature Plans table:

| Feature plan status | Epic row status |
|---------------------|-----------------|
| `draft` | `open` |
| `reviewed` | `open` |
| `executed` | `completed` |
| Any status + explicit blocker noted in plan | `blocked` |

Apply the update by editing the epic file directly.

### 4. Report progress

After syncing, output a concise progress summary:

```
Epic: epic-{name}.md

Feature Plans
─────────────────────────────────────────
  feature-{a}    completed   ████████ 8/8
  feature-{b}    open        ░░░░░░░░ 0/6
  feature-{c}    open        ░░░░░░░░ 0/4
─────────────────────────────────────────
  Progress: 1/3 plans complete

Next to implement: feature-{b}
  Run: execute-plan {b}
```

If all plans are `completed` → report epic as fully done.

If any plan is `missing` → list them separately and warn user.

## Quality Bar

- this skill is read-and-sync only; it does not generate new plans or modify plan content
- status values used in epic table: `open`, `blocked`, `completed`
- cross-links are not modified; only the status column in the Feature Plans table is updated
- the workflow still works when feature plans are created or executed outside this skill
