---
name: manage-epic
description: Sync epic status from feature plans and report progress.
---

## Goal

Read all feature plans linked to an epic, sync their status into the epic table, and report overall progress.

This command does not create or restructure epics. Epic creation is handled by `/development-orchestrator`.

---

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- Create todos only for medium/large epics (many plans). Keep one `in_progress` item.

---

## Step 1: Load Epic

Ask for epic name if not provided.

```
Read(file_path="docs/ai/planning/epic-{name}.md")
```

If not found → stop and report path tried.

---

## Step 2: Read All Linked Feature Plans

For each plan row in the epic's Feature Plans table:

```
Read(file_path="docs/ai/planning/feature-{plan-name}.md")
```

Extract from each plan:
- `status` field from frontmatter
- Total task count and completed task count (checkbox `[x]` vs `[ ]`)
- Any explicit blocker note

If a plan file is not found → mark that row as `missing` in the report; continue with others.

---

## Step 3: Sync Epic Table

Update each row's status in the epic's Feature Plans table using this mapping:

| Feature plan status | Epic row status |
|---------------------|-----------------|
| `draft` | `open` |
| `reviewed` | `open` |
| `executed` | `completed` |
| Any status + explicit blocker noted in plan | `blocked` |

Apply the update by editing the epic file directly.

---

## Step 4: Report Progress

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
  Run: /execute-plan {b}
```

If all plans are `completed` → report epic as fully done.

If any plan is `missing` → list them separately and warn user.

---

## Notes

- This command is read-and-sync only. It does not generate new plans or modify plan content.
- Run after each `/execute-plan` to keep the epic table current.
- Status values in epic table: `open`, `in_progress`, `blocked`, `completed`.
- `in_progress` is set only when `execute-plan` is actively mid-run (partially executed plan). For a clean before/after snapshot, `open` and `completed` are sufficient.
