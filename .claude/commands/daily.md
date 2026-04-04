---
name: daily
description: Read daily-notes and create a structured daily plan with estimated dates and hours.
---

## Folder Structure

```
{BASE_DIR}/
  daily-notes/   ← user writes, Claude reads only
  daily-plans/   ← Claude creates here
```

**Default BASE_DIR (cross-platform):**
- Linux/macOS: `~/Documents/obsidian-dev`
- Windows: `%USERPROFILE%\Documents\obsidian-dev`

**Override in prompt:**
```
/daily dir folder: ~/source_code
```

---

## Goal

Read `#tasks` section from `daily-notes/{today}.md`, auto-fill missing priority and EST/start/end dates, and create `daily-plans/{today}.md` with tasks ordered from high priority to low priority.

---

## Step 1: Resolve BASE_DIR

Check if user specified `dir folder:` in prompt → use that path.

If not → detect OS:
```bash
uname -s  # Linux/macOS → ~/Documents/obsidian-dev
          # Windows    → %USERPROFILE%\Documents\obsidian-dev
```

Create dirs if not exist:
```bash
mkdir -p {BASE_DIR}/daily-notes
mkdir -p {BASE_DIR}/daily-plans
```

---

## Step 2: Read Daily Notes File

```bash
date +%Y-%m-%d
```

Read `{BASE_DIR}/daily-notes/{today}.md`.

**If file not found:**
```
✗ No daily-notes file for today ({date}).
  Expected: {BASE_DIR}/daily-notes/{date}.md
  Create the file first, then re-run /daily.
```
Then exit.

---

## Step 3: Parse #tasks Section

Extract only the `#tasks` section (stop at next `#` section or end of file).

**Expected user format (flexible):**
```markdown
#tasks
## project-a
- fix bug a
- implement feature b | priority: high | est: 3h | start: 2026-04-04 | end: 2026-04-06
## project-b
- fix bug c
```

**Parsing rules:**
- `## heading` → project name
- `- item` → one task
- User may provide any combination of `priority:`, `est:`, `start:`, `end:` inline — extract if present
- If any field is missing → Claude fills it in (see Step 4)
- Ignore all sections other than `#tasks` (`#ideas`, `#notes`, etc.)

---

## Step 4: Fill Missing Fields

For each task without complete priority/EST/start/end, auto-fill:

**Priority:**
- Respect user-provided `priority:` if present
- Normalize to `High`, `Medium`, or `Low`
- "fix/bug/hotfix/urgent/blocker/prod" → `High`
- "implement/build/create/review/test" → `Medium`
- "research/investigate/docs/cleanup/refactor" → `Low`
- default → `Medium`

**EST** (estimate duration):
- "fix/bug/debug" → 1–2h
- "review/PR" → 0.5–1h
- "implement/build/create" → 2–4h
- "write/test/unit" → 1–2h
- "research/investigate" → 1h
- "meeting/sync/call" → 0.5–1h
- default → 1h

**Start date:**
- First task of the day → today
- Subsequent tasks → same day unless cumulative EST exceeds 8h, then next working day

**End date:**
- Same day as start if EST ≤ remaining hours in that day
- Otherwise spill to next working day (skip weekends)

---

## Step 5: Check for Existing Plan File

If `{BASE_DIR}/daily-plans/{today}.md` already exists:

**Tool:** AskUserQuestion
```
Question: A daily plan for today already exists. What do you want to do?
Options:
  1. Overwrite with new plan
  2. Append new tasks (keep existing tasks, add only new ones from daily-notes)
  3. Cancel
```

**If Append:**
- Read existing plan to get current task IDs (find highest N used today)
- Only add tasks from daily-notes that don't already exist in the plan (match by task text)
- Continue ID sequence from last used N
- Insert new tasks into the correct project section; create section if project doesn't exist yet
- Do not touch existing tasks, Actual values, or Status
- Re-sort each affected project section by priority order `High`, `Medium`, `Low`

---

## Step 6: Generate Task IDs

For each task, generate a short ID in format `{MMDD}-{N}` where N is sequential per file.

Examples for 2026-04-04: `0404-1`, `0404-2`, `0404-3`, ...

IDs are unique within the day and stable — never regenerate them on updates.

---

## Step 7: Write Daily Plan File

```markdown
---
date: {YYYY-MM-DD}
reviewed: false
---

Source: [[daily-notes/{YYYY-MM-DD}]]

## {project-a}

| ID | Task | Priority | Start | End | EST | Actual | Status |
|----|------|----------|-------|-----|-----|--------|--------|
| 0404-1 | Fix bug a | High | 2026-04-04 | 2026-04-04 | 1h | — | pending |
| 0404-2 | Implement feature b | Medium | 2026-04-04 | 2026-04-06 | 3h | — | pending |

## {project-b}

| ID | Task | Priority | Start | End | EST | Actual | Status |
|----|------|----------|-------|-----|-----|--------|--------|
| 0404-3 | Fix bug c | High | 2026-04-05 | 2026-04-05 | 1h | — | pending |

## Notes

```

**Notes:**
- `Source: [[daily-notes/{YYYY-MM-DD}]]` — Obsidian wiki-link, clickable in the app
- Add a `Priority` column with values `High` | `Medium` | `Low`
- `Actual` column starts as `—`, filled during `/daily-review`
- **Progress column:** only add for tasks with progress > 0% (carried forward). Omit for new tasks.
- **Status values:** `pending` | `done` | `in-progress` | `blocked`
- Sort tasks inside each project from `High` to `Medium` to `Low`

---

## Step 8: Confirm

```
✓ Daily plan created: {BASE_DIR}/daily-plans/{date}.md
  Source: [[daily-notes/{date}]]

  {project-a}: {N} tasks (~{X}h)  IDs: 0404-1, 0404-2
  {project-b}: {N} tasks (~{X}h)  IDs: 0404-3
  Total: {N} tasks, ~{X}h estimated

  Dates are estimates — adjust in the plan file if needed.
  Run /daily-review at end of day.
```
