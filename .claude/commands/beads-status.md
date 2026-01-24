---
name: beads-status
description: Shows epic progress overview with task status, dependencies, and metrics.
---

## Goal

Display a comprehensive overview of the current epic's progress, including task status, dependency graph, and completion metrics.

## Workflow Alignment

- Provide clear, visual progress reporting.
- Show actionable information (what's ready, what's blocked).
- Quick command for status checks without claiming tasks.

---

## Step 1: Determine Which Epic to Show

### Option A: Current Epic Context Exists

**Read:** `.beads/current-epic.json`

If exists:
- Use epic_id from context
- Proceed to Step 2

### Option B: No Current Context

**Run:** `bd list --type epic --json`

If single epic exists:
- Use that epic automatically

If multiple epics exist:

```
AskUserQuestion(questions=[{
  question: "Which epic would you like to see status for?",
  header: "Select Epic",
  options: [
    { label: "{epic-1-id}: {title}", description: "{X}/{Y} tasks complete" },
    { label: "{epic-2-id}: {title}", description: "{X}/{Y} tasks complete" },
    { label: "Show all epics", description: "Overview of all epics" }
  ],
  multiSelect: false
}])
```

If no epics exist:

```
No epics found.

To create an epic:
  /beads-breakdown "feature description"
  /beads-breakdown @docs/ai/requirements/req-xxx.md
```

---

## Step 2: Load Epic Data

### 2a: Get Epic Details

**Run:** `bd show {epic-id} --json`

Extract:
- Epic title, description
- Creation date
- Total tasks count

### 2b: Get All Tasks

**Run:** `bd list --parent {epic-id} --json`

For each task, extract:
- Task ID, title, priority
- Status (open, in_progress, closed)
- Blocked by (dependencies)
- Assignee (if any)

### 2c: Load Epic Plan (if exists)

**Read:** `docs/ai/planning/epic-{name}.md`

If exists:
- Extract task-to-plan-doc mapping from Task Breakdown table
- Note any architectural updates

---

## Step 3: Calculate Metrics

```javascript
// Metrics calculation
const total = tasks.length;
const closed = tasks.filter(t => t.status === 'closed').length;
const inProgress = tasks.filter(t => t.status === 'in_progress').length;
const open = tasks.filter(t => t.status === 'open').length;
const ready = tasks.filter(t => t.status === 'open' && t.blockedBy.length === 0).length;
const blocked = tasks.filter(t => t.status === 'open' && t.blockedBy.length > 0).length;

const completionPercent = Math.round((closed / total) * 100);
```

---

## Step 4: Display Status Report

```
═══════════════════════════════════════════════════════════════════
                    EPIC STATUS: {epic-id}
═══════════════════════════════════════════════════════════════════

📋 {Epic Title}

{If epic plan exists:}
📄 Epic Plan: docs/ai/planning/epic-{name}.md
{If requirement exists:}
📝 Requirement: docs/ai/requirements/req-{name}.md

───────────────────────────────────────────────────────────────────
                         PROGRESS
───────────────────────────────────────────────────────────────────

[████████████░░░░░░░░] {completionPercent}% Complete

  ✅ Completed:    {closed}/{total} tasks
  🔄 In Progress:  {inProgress} tasks
  📋 Open:         {open} tasks
    ├─ Ready:      {ready} tasks
    └─ Blocked:    {blocked} tasks

───────────────────────────────────────────────────────────────────
                         TASK LIST
───────────────────────────────────────────────────────────────────

{Group by status:}

✅ COMPLETED ({closed})
{For each closed task:}
  ✓ {task-id} "{title}"
    └─ Plan: {plan-doc or "N/A"}

🔄 IN PROGRESS ({inProgress})
{For each in_progress task:}
  → {task-id} "{title}" (P{n})
    ├─ Plan: {plan-doc or "Not created"}
    └─ Blocks: {list of dependent tasks or "None"}

📋 READY ({ready})
{For each ready task:}
  ○ {task-id} "{title}" (P{n})

🚫 BLOCKED ({blocked})
{For each blocked task:}
  ✗ {task-id} "{title}" (P{n})
    └─ Waiting for: {blocker-id} "{blocker-title}"

───────────────────────────────────────────────────────────────────
                      DEPENDENCY GRAPH
───────────────────────────────────────────────────────────────────

{ASCII dependency graph}

✅ = completed, → = in_progress, ○ = ready, ✗ = blocked

Example:
✅ bd-auth.1 ──────────────────────┐
                                   ▼
○ bd-auth.3 ───▶ → bd-auth.2 ───▶ ✗ bd-auth.4
                        │
                        └──────▶ ✗ bd-auth.5

───────────────────────────────────────────────────────────────────
                       NEXT ACTIONS
───────────────────────────────────────────────────────────────────

{Based on current state:}

{If in_progress exists:}
Continue current work:
  /execute-plan     → Resume {in-progress-task-id}
  /beads-done       → Complete {in-progress-task-id}

{If ready tasks exist:}
Start new task:
  /beads-next       → Claim from {ready} ready tasks

{If all blocked:}
Unblock tasks:
  Review blocked tasks and their dependencies
  Complete blocking tasks first

{If all complete:}
🎉 Epic complete! Close with:
  bd close {epic-id} --reason "All tasks complete"

═══════════════════════════════════════════════════════════════════
```

---

## Step 5: Optional Details

If user wants more details:

```
AskUserQuestion(questions=[{
  question: "Would you like more details?",
  header: "Details",
  options: [
    { label: "View specific task", description: "Show full details of a task" },
    { label: "View epic plan", description: "Open the epic plan document" },
    { label: "Refresh status", description: "Reload latest status from Beads" },
    { label: "Done", description: "Exit status view" }
  ],
  multiSelect: false
}])
```

---

## Notes

- **Quick overview**: Designed for fast status checks
- **Visual progress**: Progress bar makes completion visible at a glance
- **Actionable**: Always shows what can be done next
- **Dependency awareness**: Shows blocking relationships clearly

### Progress Bar Legend

```
[████████████░░░░░░░░] 60%
 └── Filled = Completed
            └── Empty = Remaining
```

### Status Icons

| Icon | Meaning |
|------|---------|
| ✅ / ✓ | Completed |
| 🔄 / → | In Progress |
| 📋 / ○ | Ready (open, not blocked) |
| 🚫 / ✗ | Blocked |
