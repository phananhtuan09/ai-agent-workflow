---
name: beads-next
description: Shows ready tasks, allows claiming a task, and sets context for /create-plan.
---

## Goal

Show available Beads tasks (in_progress and ready), let user claim a task, and set context so `/create-plan` knows which Beads task to link.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- Always show in_progress tasks first (user may have work in progress from previous session).
- Set context file for seamless integration with `/create-plan`.

---

## Step 1: Check Current State

### 1a: Load Epic Context (if exists)

**Read:** `.beads/current-epic.json`

If exists:
- Use epic_id to filter tasks
- Show only tasks from current epic

If not exists:
- Show all tasks across all epics

### 1b: Get In-Progress Tasks

**Run:** `bd list --status=in_progress --json`

Parse output to get tasks currently being worked on.

### 1c: Get Ready Tasks

**Run:** `bd ready --json`

Parse output to get tasks with no blockers.

---

## Step 2: Display Task Overview

**Format output:**

```
## Beads Task Overview

{If epic context exists:}
**Current Epic**: {epic-id} "{Epic Title}"
**Epic Plan**: {epic-plan path or "Not created yet"}

---

### 🔄 In Progress ({count})

{If in_progress tasks exist:}
| Task ID | Title | Epic | Plan Doc |
|---------|-------|------|----------|
| {task-id} | {title} | {epic-id} | {plan path or "-"} |

{If no in_progress:}
No tasks in progress.

---

### ✅ Ready to Start ({count})

{If ready tasks exist:}
| # | Task ID | Title | Priority | Epic |
|---|---------|-------|----------|------|
| 1 | {task-id} | {title} | P{n} | {epic-id} |
| 2 | {task-id} | {title} | P{n} | {epic-id} |
| 3 | {task-id} | {title} | P{n} | {epic-id} |

{If no ready tasks:}
No tasks ready. Check blocked tasks with `bd blocked`.

---

### 🚫 Blocked ({count})

{task-id}: blocked by {blocker-id} "{blocker-title}"
```

---

## Step 3: Ask User Action

**If in_progress tasks exist:**

```
AskUserQuestion(questions=[{
  question: "You have tasks in progress. What would you like to do?",
  header: "Action",
  options: [
    { label: "Continue {task-id}", description: "Resume working on '{task-title}'" },
    { label: "Claim new task", description: "Pick a different task from ready list" },
    { label: "View task details", description: "Show full details of a specific task" }
  ],
  multiSelect: false
}])
```

**If no in_progress, but ready tasks exist:**

```
AskUserQuestion(questions=[{
  question: "Which task would you like to claim?",
  header: "Claim Task",
  options: [
    { label: "{task-1-id}: {title}", description: "Priority: P{n}" },
    { label: "{task-2-id}: {title}", description: "Priority: P{n}" },
    { label: "{task-3-id}: {title}", description: "Priority: P{n}" },
    { label: "View details first", description: "Show full details before claiming" }
  ],
  multiSelect: false
}])
```

**If no tasks available:**

```
No tasks available to work on.

Options:
  - Run `bd blocked` to see what's blocking tasks
  - Run `/beads-breakdown` to create new tasks
  - Run `bd list` to see all tasks
```

---

## Step 4: Handle User Selection

### If "Continue {task-id}" (resume in_progress):

1. Load task details: `bd show {task-id} --json`
2. Check if plan doc exists (from notes or epic plan table)
3. Set context file (Step 5)
4. Output next steps

### If user selects a ready task to claim:

1. **Claim task:**
   ```bash
   bd update {task-id} --status in_progress
   ```

2. **Load task details:** `bd show {task-id} --json`

3. **Set context file** (Step 5)

4. **Output confirmation:**
   ```
   ✓ Claimed: {task-id} "{Task Title}"

   Task Details:
     Priority: P{n}
     Epic: {epic-id}
     Blocked by: {none or list}
     Blocks: {list of dependent tasks}

   Next steps:
     1. Run `/create-plan` to create detailed implementation plan
     2. After planning, run `/execute-plan` to implement
   ```

### If "View details first":

```
AskUserQuestion(questions=[{
  question: "Which task details would you like to see?",
  header: "View Task",
  options: [
    { label: "{task-1-id}", description: "{title}" },
    { label: "{task-2-id}", description: "{title}" },
    { label: "{task-3-id}", description: "{title}" }
  ],
  multiSelect: false
}])
```

Then run: `bd show {selected-task-id}`

Display full details and return to Step 3 for claiming.

---

## Step 5: Set Context for /create-plan

**Create/Update:** `.beads/current-task.json`

```json
{
  "task_id": "{task-id}",
  "task_title": "{Task Title}",
  "epic_id": "{epic-id}",
  "epic_title": "{Epic Title}",
  "epic_plan": "{docs/ai/planning/epic-xxx.md or null}",
  "priority": {priority number},
  "blocked_by": [],
  "blocks": ["{dependent-task-ids}"],
  "claimed_at": "{ISO timestamp}"
}
```

This file is read by `/create-plan` to:
- Auto-populate beads metadata in frontmatter
- Reference epic plan for architecture context
- Link task to plan doc when created

---

## Step 6: Final Output

```
✓ Context set for: {task-id} "{Task Title}"

Ready for:
  /create-plan              → Create detailed implementation plan
  /create-plan "{title}"    → Create plan with custom title

To view task details anytime:
  bd show {task-id}

To unclaim this task:
  bd update {task-id} --status open
```

---

## Notes

- **Session persistence**: Context file (`.beads/current-task.json`) persists across sessions
- **One task at a time**: Only one task should be in_progress per developer
- **Epic filtering**: If working on an epic, only shows tasks from that epic
- **Parallel work**: Multiple developers can claim different tasks (Beads handles this)

### Task Status Flow

```
open → in_progress → closed
         ↓
       (unclaim)
         ↓
        open
```

### Context File Lifecycle

```
/beads-next (claim)     → Creates .beads/current-task.json
/create-plan            → Reads context, links plan doc
/execute-plan           → Uses plan doc (context optional)
/beads-done             → Deletes .beads/current-task.json
```
