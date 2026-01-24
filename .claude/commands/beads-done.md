---
name: beads-done
description: Closes current task, syncs to git, clears context, and shows next ready tasks.
---

## Goal

Mark the current Beads task as complete, sync changes to git, clear the task context, and show what tasks are now ready (including any that were unblocked).

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- Confirm before closing if there are uncommitted changes.
- Always sync to git after closing.

---

## Step 1: Load Current Task Context

**Read:** `.beads/current-task.json`

If exists:
- Extract task_id, task_title, epic_id
- Proceed to Step 2

If not exists:
- Ask user which task to close

```
AskUserQuestion(questions=[{
  question: "No active task context found. Which task would you like to close?",
  header: "Close Task",
  options: [
    { label: "Enter task ID", description: "e.g., bd-auth.1" },
    { label: "Show in-progress tasks", description: "List tasks I'm working on" },
    { label: "Cancel", description: "Don't close anything" }
  ],
  multiSelect: false
}])
```

If "Show in-progress tasks":
- Run: `bd list --status=in_progress`
- Display list and ask user to select

---

## Step 2: Pre-Close Checks

### 2a: Check Git Status

**Run:** `git status --porcelain`

If uncommitted changes exist:

```
⚠️ Uncommitted changes detected:

{list of modified/added files}

These changes should be committed before closing the task.
```

```
AskUserQuestion(questions=[{
  question: "You have uncommitted changes. How would you like to proceed?",
  header: "Git Status",
  options: [
    { label: "Commit changes first", description: "I'll commit, then run /beads-done again" },
    { label: "Close anyway", description: "Close task without committing (changes will remain staged)" },
    { label: "Cancel", description: "Don't close the task yet" }
  ],
  multiSelect: false
}])
```

If "Commit changes first": Exit and let user commit.
If "Cancel": Exit without closing.
If "Close anyway": Proceed to Step 3.

### 2b: Check Planning Doc Status

**Read task details:** `bd show {task-id} --json`

Check if plan doc exists (from notes or known path).

If plan doc exists:
- Read planning doc
- Check if all phases are complete (all `[x]` checkboxes)
- If incomplete phases exist, warn user:

```
⚠️ Planning doc has incomplete tasks:

Phase 2: API Implementation
  - [ ] Task 3: Incomplete
  - [ ] Task 4: Incomplete

Are you sure you want to close this task?
```

```
AskUserQuestion(questions=[{
  question: "Planning doc has incomplete tasks. Close anyway?",
  header: "Incomplete",
  options: [
    { label: "Close anyway", description: "Mark task as complete despite incomplete plan items" },
    { label: "Cancel", description: "Keep task open and finish the work" }
  ],
  multiSelect: false
}])
```

---

## Step 3: Close Task

### 3a: Ask for Close Reason (optional)

```
AskUserQuestion(questions=[{
  question: "Add a closing note? (optional)",
  header: "Close Note",
  options: [
    { label: "Completed successfully", description: "Task finished as planned" },
    { label: "Completed with modifications", description: "Finished but deviated from original plan" },
    { label: "Custom note", description: "Enter a custom closing note" },
    { label: "No note", description: "Close without a note" }
  ],
  multiSelect: false
}])
```

### 3b: Execute Close

**Run:** `bd close {task-id} --reason "{close reason}"`

Capture output for confirmation.

---

## Step 4: Update Epic Plan (if exists)

**Read:** `.beads/current-epic.json`

If epic_plan exists:
- Read epic plan file
- Update Task Breakdown table:
  - Change status from `in_progress` to `closed`
  - Add plan doc path if created

**Edit:** `docs/ai/planning/epic-{name}.md`

Update the task row:
```markdown
| {task-id} | {title} | P{n} | closed | - | feature-{name}.md |
```

---

## Step 5: Sync to Git

**Run:** `bd sync`

This will:
- Export Beads changes to JSONL
- Commit Beads changes
- Push to remote

Display sync result.

---

## Step 6: Clear Context

**Delete:** `.beads/current-task.json`

Context is cleared so `/create-plan` won't auto-link to this closed task.

---

## Step 7: Show Next Ready Tasks

**Run:** `bd ready --json`

Check if any tasks were unblocked by closing this task.

**Output:**

```
✓ Closed: {task-id} "{Task Title}"
✓ Synced to git

{If tasks were unblocked:}
🔓 Unblocked by this completion:
  - {unblocked-task-id} "{title}" [now ready]
  - {unblocked-task-id} "{title}" [now ready]

{Show ready tasks:}
📋 Ready to work ({count}):
  1. {task-id} "{title}" (P{n})
  2. {task-id} "{title}" (P{n})

{Show epic progress:}
📊 Epic Progress: {epic-id}
  Completed: {closed}/{total} tasks ({percentage}%)
  Remaining: {open + in_progress} tasks

Next steps:
  - Run `/beads-next` to claim next task
  - Run `/beads-status` to see full epic progress
```

**If all tasks in epic are complete:**

```
🎉 Epic Complete: {epic-id} "{Epic Title}"

All {total} tasks have been completed!

Next steps:
  - Review epic plan for any follow-ups
  - Close epic: `bd close {epic-id} --reason "All tasks complete"`
  - Start new work: `/beads-breakdown`
```

---

## Notes

- **Git sync required**: Always syncs to git after closing to persist state
- **Context cleanup**: Clears current-task.json to prevent stale context
- **Epic progress**: Shows progress after each task completion
- **Unblocked tasks**: Highlights tasks that became ready after this completion

### Close vs Cancel

| Action | When to use |
|--------|-------------|
| Close (this command) | Task is complete, work is done |
| Cancel (`bd update --status open`) | Task is abandoned, need to unclaim |

### Error Recovery

If close fails:
- Check `bd doctor` for sync issues
- Manually run `bd sync` to retry
- Check git status for conflicts
