---
name: weekly
description: Read weekly-notes and source plan files to create a structured weekly plan with tasks by project, day, and time.
---

## Folder Structure

```
{BASE_DIR}/
  weekly-notes/   ← user writes, Claude reads only
  weekly-plans/   ← Claude creates here
  {any files/folders referenced in #Sources}
```

**Default BASE_DIR (cross-platform):**
- Linux: `~/Documents/obsidian-dev`
- macOS: `~/Desktop/obsidian-dev`
- Windows: `%USERPROFILE%\Documents\obsidian-dev`

**Override in prompt:**
```
/weekly dir folder: ~/source_code
```

---

## Weekly-notes Expected Format

```markdown
---
week: {YYYY-WXX}
---

#Sources
- weekly-schedule: [[weekly-schedule]]
- english: [[english-plans/2026-04-april]]
- coding: [[full-stack-plans/month-04-auth]]

#tasks
## extra-project
- some ad-hoc task | est: 2h | priority: high
```

**Note:** `#tasks` section is optional. `#Sources` labels (e.g. `english:`, `coding:`) become the project names in the weekly plan.

---

## Goal

Read `weekly-notes/{week-key}.md`, resolve each `#Sources` link, extract this week's tasks from each source file, merge with any `#tasks` entries, and write `weekly-plans/{YYYY-WXX-MmmDD-MmmDD}.md`.

---

## Step 1: Resolve BASE_DIR

Check if user specified `dir folder:` in prompt → use that path.

If not → detect OS:
```bash
uname -s  # Darwin  → ~/Desktop/obsidian-dev
          # Linux   → ~/Documents/obsidian-dev
          # Windows → %USERPROFILE%\Documents\obsidian-dev
```

Create dirs if not exist:
```bash
mkdir -p {BASE_DIR}/weekly-notes
mkdir -p {BASE_DIR}/weekly-plans
```

---

## Step 2: Determine Current Week

```bash
date +%Y-W%V   # ISO week key, e.g. 2026-W15
date +%Y-%m-%d # today
```

Calculate Monday–Sunday of the ISO week. Derive:
- `week-key` (lowercase): `2026-w15`
- Mon/Sun dates for filename and frontmatter
- Filename: `{YYYY}-W{WW}-{MmmDD}-{MmmDD}.md` (e.g. `2026-W15-Apr06-Apr12.md`)

---

## Step 3: Read Weekly-notes File

Read `{BASE_DIR}/weekly-notes/{week-key}.md` (e.g. `weekly-notes/2026-w15.md`).

**If file not found:**
```
✗ No weekly-notes file for this week ({week-key}).
  Expected: {BASE_DIR}/weekly-notes/{week-key}.md

  Suggested format:
  ---
  week: {YYYY-WXX}
  ---

  #Sources
  - weekly-schedule: [[weekly-schedule]]
  - english: [[english-plans/{month-file}]]
  - coding: [[full-stack-plans/{month-file}]]

  #tasks
  ## project-name
  - task | est: 1h
```
Then exit.

Parse:
- `#Sources` lines: extract label + wiki-link path
- `#tasks` section (optional): same format as daily-notes

---

## Step 4: Resolve and Read Source Files

For each `#Sources` entry:
- Strip `[[` and `]]` from wiki-link to get relative path
- Resolve to `{BASE_DIR}/{path}.md`
- Read the file

**Wiki-link resolution examples:**
- `[[weekly-schedule]]` → `{BASE_DIR}/weekly-schedule.md`
- `[[english-plans/2026-04-april]]` → `{BASE_DIR}/english-plans/2026-04-april.md`
- `[[full-stack-plans/month-04-auth]]` → `{BASE_DIR}/full-stack-plans/month-04-auth.md`

If a file does not exist, skip it and note in the confirmation output.

---

## Step 5: Extract This Week's Tasks from Each Source File

For each source file, read it fully and identify all content that applies to the current week (Mon–Sun). Use judgment — do not rely on any fixed format.

**General approach:**
1. Scan the file for any section, table, or list that refers to the current week's dates or week number
2. Extract each actionable item as a task, capturing: task description, day, time slot (if present), and any notes
3. If the file has a recurring schedule (same activity every week) combined with a per-week focus section, synthesize tasks by applying this week's focus to the recurring slots
4. Resolve day abbreviations or day names to actual dates within Mon–Sun of the current week

**When to skip a source file:**
- The user marked it as `(ref)` in `#Sources` — e.g. `- schedule (ref): [[weekly-schedule]]`
- The file contains no actionable items for this week (e.g. it's a pure reference or overview doc)
- In either case, note it in the confirmation output as "reference only"

**Vietnamese day abbreviations:** CN=Sun, T2=Mon, T3=Tue, T4=Wed, T5=Thu, T6=Fri, T7=Sat

---

## Step 6: Parse `#tasks` from Weekly-notes (if present)

Same rules as `/daily` command:
- `## heading` → project name
- `- item` → one task
- Extract any inline `priority:`, `est:`, `start:`, `end:` fields
- Fill missing fields per Step 7 rules below

---

## Step 7: Fill Missing Fields

For tasks extracted from source files, fields come from the source. Fill only what is still missing:

**Priority** (if not present):
- "build/implement/endpoint/feature" → `High`
- "review/test/refactor/cleanup/fix" → `Medium`
- "read/research/study/vocabulary/grammar/shadowing" → `Medium`
- "record/speaking/nhẹ" → `Low`
- default → `Medium`

**EST** (if not present):
- Use time slot duration when available (e.g. `16:00–17:30` → `1.5h`)
- Otherwise apply defaults from `/daily` rules

**Day** (if not present): assign to Monday of the week

**Time** (if not present): use `—`

---

## Step 8: Check for Existing Plan File

If `{BASE_DIR}/weekly-plans/{filename}` already exists:

**Tool:** AskUserQuestion
```
Question: A weekly plan already exists for this week. What do you want to do?
Options:
  1. Overwrite with new plan
  2. Append new tasks only (keep existing, add missing ones)
  3. Cancel
```

If Append: find highest task ID used, only add tasks not already present (match by task text), continue ID sequence.

---

## Step 9: Generate Task IDs

Format: `W{WW}-{N}` where N is sequential across the whole file.

Examples for week 15: `W15-1`, `W15-2`, `W15-3`, ...

IDs are stable — never regenerate on updates.

---

## Step 10: Write Weekly Plan File

```markdown
---
week: {YYYY-WXX}
period: {Mon} -> {Sun}
generated: {today}
reviewed: false
---

Source: [[weekly-notes/{week-key}]]

## {project-a}

| ID | Task | Day | Time | EST | Priority | Status | Actual |
|----|------|-----|------|-----|----------|--------|--------|
| W15-1 | Đọc lý thuyết JWT | Sun Apr 6 | 16:00–17:30 | 1.5h | Medium | pending | — |
| W15-2 | Cài dependencies + setup project | Tue Apr 7 | 20:30–22:00 | 1.5h | Medium | pending | — |

## {project-b}

| ID | Task | Day | Time | EST | Priority | Status | Actual |
|----|------|-----|------|-----|----------|--------|--------|
| W15-6 | Grammar: present/past tense · Vocab + nói | Mon Apr 6 | 20:30–22:00 | 1.5h | Medium | pending | — |

## Notes

```

**Notes:**
- `Source: [[weekly-notes/{week-key}]]` — Obsidian wiki-link
- Sort tasks within each project by Day (Mon → Sun), then by Priority (High → Medium → Low) within the same day
- `Actual` starts as `—`, filled during review
- If a task has no specific time slot, use `—` in Time column
- Project name comes from the label in `#Sources` (e.g. `english:` → project `english`)

---

## Step 11: Confirm

```
✓ Weekly plan created: {BASE_DIR}/weekly-plans/{filename}
  Source: [[weekly-notes/{week-key}]]

  {Mon} -> {Sun}

  {project-a}: {N} tasks (~{X}h)  IDs: W15-1 … W15-5
  {project-b}: {N} tasks (~{X}h)  IDs: W15-6 … W15-9
  Total: {N} tasks, ~{X}h estimated

  Sources resolved: {list of files read}
  Sources skipped:  {list of files not found, if any}

  Run /weekly-report at end of week.
```
