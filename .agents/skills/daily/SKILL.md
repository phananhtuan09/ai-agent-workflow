---
name: daily
description: Read the tasks section from a daily note, fill missing estimate and schedule fields, and write a daily plan file in an Obsidian style planning workspace. Use when the user wants to generate or refresh a daily plan from task notes and may need overwrite or append handling.
---

# Daily

Read `daily-notes/{today}.md`, extract the `#tasks` section, auto-fill missing scheduling fields, and write `daily-plans/{today}.md`. Keep IDs stable, preserve existing work on append, and only operate inside the planning workspace.

## Workspace Layout

```text
{BASE_DIR}/
  daily-notes/
  daily-plans/
```

Default `BASE_DIR`:
- Linux/macOS: `~/Documents/obsidian-dev`
- Windows: `%USERPROFILE%\\Documents\\obsidian-dev`

Prompt override:
- `dir folder: <path>`

## Input Format

Read only the `#tasks` section from `daily-notes/{today}.md`.
- Start when the line equals `#tasks`.
- Stop at the next top-level section that starts with `# `, or end of file.
- Treat `## <project>` as a project heading inside `#tasks`.
- Treat each `- <task>` line as one task.
- Parse optional inline fields after `|` segments: `est:`, `start:`, `end:`.

Expected structure:

```markdown
#tasks
## project-a
- fix bug a
- implement feature b | est: 3h | start: 2026-04-04 | end: 2026-04-06
## project-b
- fix bug c
```

Ignore all other sections such as `#ideas` or `#notes`.

## Workflow

### 1. Resolve `BASE_DIR`

- If the prompt includes `dir folder:`, use it.
- Otherwise detect the OS and map to the default path above.
- Ensure both `daily-notes/` and `daily-plans/` exist.

Useful commands:
- `uname -s`
- `date +%Y-%m-%d`
- `mkdir -p "{BASE_DIR}/daily-notes" "{BASE_DIR}/daily-plans"`

### 2. Read Today's Daily Note

- Resolve `today` with `date +%Y-%m-%d`.
- Read `{BASE_DIR}/daily-notes/{today}.md`.
- If the file does not exist, stop and return:

```text
No daily-notes file for today ({today}).
Expected: {BASE_DIR}/daily-notes/{today}.md
Create the file first, then run $daily again.
```

### 3. Parse Tasks

- Extract project headings and tasks from `#tasks`.
- Carry through any user-supplied `est`, `start`, and `end` values.
- Fill only the missing fields in the next step.

### 4. Fill Missing Fields

Estimate rules:
- `fix`, `bug`, `debug` -> `1-2h`
- `review`, `pr` -> `0.5-1h`
- `implement`, `build`, `create` -> `2-4h`
- `write`, `test`, `unit` -> `1-2h`
- `research`, `investigate` -> `1h`
- `meeting`, `sync`, `call` -> `0.5-1h`
- default -> `1h`

Scheduling rules:
- Set the first task start date to today if missing.
- Keep scheduling later tasks on the same day until cumulative estimated work exceeds 8h.
- Spill remaining work to the next working day.
- Skip Saturdays and Sundays when moving forward.
- Set end date to the same day when the estimate fits inside the remaining hours for that day.
- Otherwise continue the task onto the next working day.

### 5. Handle Existing Daily Plan Files

If `{BASE_DIR}/daily-plans/{today}.md` already exists, ask the user directly:

```text
A daily plan for today already exists. Reply with one option:
- overwrite
- append
- cancel
```

Rules:
- `overwrite`: replace the file with a fresh plan from today's `#tasks`.
- `append`: keep existing tasks exactly as they are, preserve `Actual`, `Status`, and any `Progress` values, and add only tasks from `daily-notes` that are not already present.
- `cancel`: stop without making changes.

Append behavior:
- Read the existing file.
- Find the highest task number already used for today.
- Match duplicate tasks by task text.
- Insert only new tasks into the correct project section.
- Create the project section if it does not exist.
- Never regenerate IDs for existing rows.

### 6. Generate Task IDs

Assign IDs in the format `{MMDD}-{N}` where `N` increments sequentially within the day.

Examples for `2026-04-04`:
- `0404-1`
- `0404-2`
- `0404-3`

Keep IDs unique and stable for the day.

### 7. Write the Daily Plan

Write `{BASE_DIR}/daily-plans/{today}.md` in this shape:

```markdown
---
date: {today}
reviewed: false
---

Source: [[daily-notes/{today}]]

## {project-a}

| ID | Task | Start | End | EST | Actual | Status |
|----|------|-------|-----|-----|--------|--------|
| 0404-1 | Fix bug a | 2026-04-04 | 2026-04-04 | 1h | -- | pending |
| 0404-2 | Implement feature b | 2026-04-04 | 2026-04-06 | 3h | -- | pending |

## {project-b}

| ID | Task | Start | End | EST | Actual | Status |
|----|------|-------|-----|-----|--------|--------|
| 0404-3 | Fix bug c | 2026-04-05 | 2026-04-05 | 1h | -- | pending |

## Notes
```

Formatting rules:
- Use the `Source: [[daily-notes/{today}]]` line exactly below frontmatter.
- Set `Actual` to `--` for new tasks.
- Allowed status values: `pending`, `done`, `in-progress`, `blocked`.
- Do not add a `Progress` column for a new file.
- If you are appending into an existing project table that already contains a `Progress` column, preserve that table shape.

### 8. Confirm the Result

Return a concise summary in this shape:

```text
Daily plan created: {BASE_DIR}/daily-plans/{today}.md
Source: [[daily-notes/{today}]]

{project-a}: {N} tasks (~{X}h) IDs: {ids}
{project-b}: {N} tasks (~{X}h) IDs: {ids}
Total: {N} tasks, ~{X}h estimated

Dates are estimates. Adjust the plan file if needed.
Run $daily-review at the end of the day.
```
