---
name: daily-review
description: Review and update the current daily plan by changing task status, actual time, progress, ad hoc tasks, and notes, then save a performance analysis back into the same file. Use when the user wants an end of day review in the Obsidian style planning workspace and may override the base folder.
---

# Daily Review

Read today's daily plan, show the current task list, collect status updates by ID, update the plan file, and report estimation accuracy. Preserve unchanged rows and keep task IDs stable.

## Workspace Layout

```text
{BASE_DIR}/
  daily-plans/
```

Default `BASE_DIR`:
- Linux/macOS: `~/Documents/obsidian-dev`
- Windows: `%USERPROFILE%\\Documents\\obsidian-dev`

Prompt override:
- `dir folder: <path>`

## Workflow

### 1. Resolve `BASE_DIR`

- If the prompt includes `dir folder:`, use it.
- Otherwise detect the OS and map to the default path above.
- Resolve `today` with `date +%Y-%m-%d`.

Useful commands:
- `uname -s`
- `date +%Y-%m-%d`

### 2. Read Today's Plan

- Read `{BASE_DIR}/daily-plans/{today}.md`.
- If the file does not exist, stop and return:

```text
No daily plan for today ({today}).
Run $daily first to create one from daily-notes.
```

### 3. Show Current Tasks

Display tasks grouped by project with ID, status, task text, date range, estimate, and actual time. Keep IDs visually prominent so the user can update them.

Display shape:

```text
Daily Review - {today}
Source: [[daily-notes/{today}]]

ai-agent-workflow:
  0404-1  pending      fix bug parse command args    2026-04-04 -> 2026-04-04  EST: 1h    Actual: --
  0404-2  in-progress  implement brainstorm command  2026-04-04 -> 2026-04-04  EST: 3h    Actual: 2h
  0404-3  pending      review PR #51                 2026-04-04 -> 2026-04-04  EST: 0.5h  Actual: --
```

### 4. Collect Updates by Task ID

Ask the user for update lines in this exact format:

```text
Update tasks by ID. One item per line:
  {id}: {status} {actual?}

Status shortcuts:
  d / done
  p / pending
  b / blocked
  60%        -> in-progress at 60%

Actual time is optional and comes after status:
  0404-1: d 0.5h
  0404-2: 60% 2h
  0404-3: b
  0404-4: p

Add ad-hoc tasks with:
  + {project}: {task description} | est: {Xh} | status: {status} {actual?}
```

Parsing rules:
- If a line starts with `+`, treat it as a new ad-hoc task.
- Otherwise find the matching ID and update only that row.
- Keep rows unchanged when they are not mentioned.

Ad-hoc task rules:
- Generate the next sequential ID for today.
- Append the task to the matching project section, or create the section if needed.
- Set `Start` and `End` to today unless the user explicitly says otherwise.
- Parse `status` the same way as regular updates.
- If status is a percentage, store the row as `in-progress` with that progress value.

### 5. Collect Notes

Ask the user directly:

```text
Any notes for today? Include blockers, decisions, or carry-forwards. Leave blank to skip.
```

### 6. Update the Plan File

Rewrite `{BASE_DIR}/daily-plans/{today}.md` with:
- `reviewed: true` in frontmatter
- updated `Status` values
- updated `Actual` values
- existing values preserved for untouched rows
- `## Notes` content appended or replaced with the new notes block

Table rules:
- Keep the existing project order when possible.
- If any task in a project is `in-progress`, ensure that project table has a `Progress` column.
- Write the numeric percentage only for in-progress rows.
- Use `--` for rows in a table that includes `Progress` but has no percentage for that row.
- Use `--` for missing `Actual` values.
- Allowed statuses remain `pending`, `done`, `in-progress`, and `blocked`.

### 7. Show Performance Analysis

Compare `EST` versus `Actual` for every task that has an `Actual` value and is not `pending` or `blocked`.

Display shape:

```text
Performance - {today}

  0404-1  fix bug parse command args    EST: 1h    Actual: 0.5h  under
  0404-2  implement brainstorm command  EST: 3h    Actual: 2h    under
  0404-3  review PR #51                 EST: 0.5h  Actual: 1h    over

Estimation accuracy: 2/3 on-target or under
Avg variance: -17%
Tip: review tasks may need more buffer.
```

Rules:
- Exclude rows with no `Actual`.
- Exclude `pending` and `blocked` rows.
- Include `done` and `in-progress` rows that have actual time recorded.
- Compute variance from numeric hours.
- Keep the tip short and grounded in the observed data.

### 8. Confirm the Result

Return a concise summary in this shape:

```text
Daily review saved: {BASE_DIR}/daily-plans/{today}.md

{project-a}: {done}/{total} done
{project-b}: {done}/{total} done

Overall: {X}/{total} done
In-progress: {Y} tasks
Blocked: {Z} tasks
```
