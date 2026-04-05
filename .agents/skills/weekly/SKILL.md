---
name: weekly
description: Read the current week's weekly-notes file and linked source plan files (coding, english, etc.) to create a structured weekly plan with tasks organized by project, day, and time. Use when the user wants to generate a weekly execution plan from their Obsidian-style planning workspace. May override base folder.
---

# Weekly Plan

Read `weekly-notes/{week-key}.md`, resolve `#Sources` links to monthly plan files, extract this week's tasks from each source, merge with any inline `#tasks`, and write `weekly-plans/{YYYY-WXX-MmmDD-MmmDD}.md` organized by project.

## Workspace Layout

```text
{BASE_DIR}/
  weekly-notes/
  weekly-plans/
  {any files/folders referenced in #Sources}
```

Default `BASE_DIR`:
- Linux/macOS: `~/Documents/obsidian-dev`
- Windows: `%USERPROFILE%\\Documents\\obsidian-dev`

Prompt override: `dir folder: <path>`

## Weekly-notes Format

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

Label in `#Sources` (e.g. `english:`, `coding:`) becomes the project name in the plan. `#tasks` is optional.

## Workflow

### 1. Resolve `BASE_DIR`

- Use `dir folder:` if provided, otherwise detect OS and map to default.
- Ensure `{BASE_DIR}/weekly-notes` and `{BASE_DIR}/weekly-plans` exist.

### 2. Determine Current Week

- Run `date +%Y-W%V` for ISO week key.
- Calculate Monday–Sunday of that ISO week.
- Derive `week-key` (lowercase `w`): e.g. `2026-w15`
- Derive filename: `{YYYY}-W{WW}-{MmmDD}-{MmmDD}.md` (e.g. `2026-W15-Apr06-Apr12.md`)

### 3. Read Weekly-notes File

- Read `{BASE_DIR}/weekly-notes/{week-key}.md`.
- If not found, print the missing-file message with the suggested format and exit.
- Parse `#Sources` lines: extract label + wiki-link path.
- Parse optional `#tasks` section using the same rules as the `/daily` command.

### 4. Resolve and Read Source Files

For each `#Sources` entry:
- Strip `[[` and `]]`, resolve to `{BASE_DIR}/{path}.md`.
- Read the file. Skip silently if not found; note in the final confirmation.

Wiki-link examples:
- `[[weekly-schedule]]` → `{BASE_DIR}/weekly-schedule.md`
- `[[english-plans/2026-04-april]]` → `{BASE_DIR}/english-plans/2026-04-april.md`
- `[[full-stack-plans/month-04-auth]]` → `{BASE_DIR}/full-stack-plans/month-04-auth.md`

### 5. Extract Tasks from Source Files

For each source file, read it fully and identify all content that applies to the current week (Mon–Sun). Use judgment — do not rely on any fixed format.

General approach:
- Scan for any section, table, or list that refers to the current week's dates or week number.
- Extract each actionable item as a task with: description, day, time slot (if present), and notes.
- If the file has a recurring weekly schedule combined with a per-week focus, synthesize tasks by applying this week's focus to the recurring time slots.
- Resolve day abbreviations or names to actual dates within Mon–Sun. Vietnamese: CN=Sun, T2=Mon, T3=Tue, T4=Wed, T5=Thu, T6=Fri, T7=Sat.

Skip a source file (note as "reference only" in confirmation) when:
- The user marked it `(ref)` in `#Sources` — e.g. `- schedule (ref): [[weekly-schedule]]`
- The file has no actionable items for this week (pure reference or overview doc)

### 6. Fill Missing Fields

Priority (if not present):
- `build/implement/endpoint/feature` → `High`
- `review/test/refactor/cleanup/fix` → `Medium`
- `read/research/study/grammar/vocabulary/shadowing` → `Medium`
- `record/speaking` → `Low`
- default → `Medium`

EST (if not present):
- Derive from time slot duration when available (e.g. `16:00–17:30` → `1.5h`).
- Otherwise apply the same keyword defaults as `/daily`.

Day (if not present): assign Monday of the week.

Time (if not present): `—`

### 7. Check for Existing Plan File

If the output file already exists, ask:
```
A weekly plan already exists for this week. What do you want to do?
1. Overwrite with new plan
2. Append new tasks only (keep existing, add missing)
3. Cancel
```

If Append: find the highest existing ID, only add tasks not already present (match by task text), continue the ID sequence.

### 8. Generate Task IDs

Format: `W{WW}-{N}` — sequential across the whole file.

Examples for week 15: `W15-1`, `W15-2`, `W15-3` …

IDs are stable — never regenerate on updates.

### 9. Write the Weekly Plan

Write `{BASE_DIR}/weekly-plans/{YYYY-WXX-MmmDD-MmmDD}.md` in this shape:

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
| W15-6 | Grammar: present/past · Vocab + nói | Mon Apr 6 | 20:30–22:00 | 1.5h | Medium | pending | — |

## Notes

```

Formatting rules:
- Sort tasks within each project by Day (Mon → Sun), then Priority (High → Medium → Low) within the same day.
- `Actual` starts as `—`.
- Use `—` in Time column when no time slot is available.
- Project name = label from `#Sources`; for `#tasks` entries = the `## heading` name.

### 10. Confirm

```text
Weekly plan created: {BASE_DIR}/weekly-plans/{filename}
Source: [[weekly-notes/{week-key}]]

{Mon} -> {Sun}
{project-a}: {N} tasks (~{X}h)  IDs: W15-1 … W15-5
{project-b}: {N} tasks (~{X}h)  IDs: W15-6 … W15-9
Total: {N} tasks, ~{X}h estimated

Sources resolved: {list}
Sources skipped:  {list, if any}

Run /weekly-report at end of week.
```
