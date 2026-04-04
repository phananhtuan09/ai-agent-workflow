---
name: daily-review
description: End-of-day review — update task status, actual time, and notes in daily plan.
---

## Folder Structure

```
{BASE_DIR}/
  daily-plans/   ← Claude reads and updates here
```

**Default BASE_DIR (cross-platform):**
- Linux/macOS: `~/Documents/obsidian-dev`
- Windows: `%USERPROFILE%\Documents\obsidian-dev`

**Override in prompt:**
```
/daily-review dir folder: ~/source_code
```

---

## Goal

Read today's daily plan, let user update tasks by ID (status + actual time), add notes, then save and show performance analysis.

---

## Step 1: Resolve BASE_DIR

Check if user specified `dir folder:` in prompt → use that path.

If not → detect OS:
```bash
uname -s  # Linux/macOS → ~/Documents/obsidian-dev
          # Windows    → %USERPROFILE%\Documents\obsidian-dev
```

---

## Step 2: Read Today's Plan

```bash
date +%Y-%m-%d
```

Read `{BASE_DIR}/daily-plans/{today}.md`.

**If file not found:**
```
✗ No daily plan for today ({date}).
  Run /daily first to create one from daily-notes.
```
Then exit.

---

## Step 3: Show Current Tasks

Display tasks grouped by project, showing ID prominently:

```
Daily Review — {date}
Source: [[daily-notes/{date}]]

ai-agent-workflow:
  0404-1  pending   fix bug parse command args      2026-04-04 → 2026-04-04  EST: 1h    Actual: —
  0404-2  pending   implement brainstorm command    2026-04-04 → 2026-04-04  EST: 3h    Actual: —
  0404-3  pending   review PR #51                   2026-04-04 → 2026-04-04  EST: 0.5h  Actual: —

personal-blog:
  0404-4  pending   viết bài về obsidian workflow   2026-04-05 → 2026-04-07  EST: 4h    Actual: —
```

---

## Step 4: Collect Updates by Task ID

**Tool:** AskUserQuestion

```
Question: Update tasks by ID. Format per line:
  {id}: {status} {actual?}

Status shortcuts:
  d / done         → done
  p / pending      → pending
  b / blocked      → blocked
  60%              → in-progress at 60%

Actual time (optional, append after status):
  0404-1: d 0.5h     → done, took 0.5h
  0404-2: 60% 2h     → in-progress 60%, spent 2h so far
  0404-3: b          → blocked, no actual
  0404-4: p          → keep pending, skip actual

Add ad-hoc task (new task not in the plan):
  + {project}: {task description} | est: {Xh} | status: {status} {actual?}
  + ai-agent-workflow: hotfix deploy script | est: 1h | status: d 0.5h
  + personal: call dentist | est: 0.5h | status: d

Enter tasks to update (leave blank to skip a task):
```

**Parse input line by line.** For each line:
- If starts with `+` → treat as new ad-hoc task:
  - Extract project name (before `:`)
  - Extract task description, est, status, actual
  - Generate next sequential ID for today (continue from last used N)
  - Append to correct project section in file; create section if project doesn't exist
- Otherwise → extract ID, find matching task, update status and actual
- Tasks not mentioned → keep current status and actual unchanged

---

## Step 5: Add Notes

**Tool:** AskUserQuestion

```
Question: Any notes for today? (blockers, decisions, carry-forwards)
Press Enter to skip.
```

---

## Step 6: Update Plan File

Rewrite file with:
- Updated Status column per task
- Updated Actual column per task (fill `—` if not provided, keep existing if skipped)
- Progress column added for in-progress tasks
- `reviewed: true` in frontmatter
- Notes appended under `## Notes` section

---

## Step 7: Performance Analysis

Compare EST vs Actual for completed tasks:

```
Performance — {date}

  0404-1  fix bug parse command args      EST: 1h    Actual: 0.5h  ✓ under
  0404-2  implement brainstorm command    EST: 3h    Actual: 2h    ✓ under
  0404-3  review PR #51                  EST: 0.5h  Actual: 1h    ↑ over

  Estimation accuracy: 2/3 on-target or under
  Avg variance: -17%  (estimated more than actual)

  Tip: "review PR #51" took 2× estimate — consider adding buffer for review tasks.
```

**Show only for tasks with Actual filled.** Skip pending/blocked tasks.

---

## Step 8: Show Summary

```
✓ Daily review saved: {BASE_DIR}/daily-plans/{date}.md

  ai-agent-workflow:  2/3 done  (implement brainstorm command — in-progress 60%)
  personal-blog:      0/1 done  (viết bài — pending)

  Overall: {X}/{total} done
  In-progress: {Y} tasks
  Blocked:     {Z} tasks
```
