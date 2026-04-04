---
name: weekly-report
description: Aggregate the current week daily plan files into a weekly report with overall statistics, project and day breakdowns, carry forward sections, and notes. Use when the user wants a weekly summary from the Obsidian style planning workspace and may override the base folder.
---

# Weekly Report

Read the current week's `daily-plans/*.md` files, compute summary statistics, and write a weekly report to `weekly-report/YYYY-WXX.md`. Use only days from Monday through today and ignore future plan files.

## Workspace Layout

```text
{BASE_DIR}/
  daily-plans/
  weekly-report/
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
- Ensure `{BASE_DIR}/weekly-report` exists.

Useful commands:
- `uname -s`
- `mkdir -p "{BASE_DIR}/weekly-report"`

### 2. Determine the Current Week

- Resolve the ISO week key with `date +%Y-W%V`.
- Calculate Monday through Sunday for that ISO week.
- Only read daily plan files from Monday through today.
- Skip future dates even if files already exist.

### 3. Read Daily Plan Files

For each date from Monday through today:
- Read `{BASE_DIR}/daily-plans/{date}.md` if it exists.
- Extract `reviewed` from frontmatter.
- Extract the `Source: [[daily-notes/{date}]]` line if present.
- Extract projects and task rows from each project table.
- Extract per-task `Start`, `End`, `EST`, `Status`, and optional `Progress`.
- Extract the `## Notes` section content, if any.

If a file does not exist for a day, skip it without error.

### 4. Compute Statistics

Overall:
- total task count
- done count and done rate
- in-progress count and average progress
- blocked count
- pending count
- total estimated hours
- days with plan files versus working days elapsed this week

Per project:
- task count
- done count and done rate
- in-progress count with current progress where available
- blocked count
- total estimated hours

Per day:
- task count
- done count
- total estimated hours
- reviewed flag

Interpretation rules:
- Treat Monday through Friday as working days.
- Compute `days tracked` against elapsed working days in the current week, capped at 5.
- When there are no in-progress tasks, show average progress as `--`.
- Parse hour strings numerically so `0.5h`, `1h`, and `3.5h` can be summed.

### 5. Write the Weekly Report

Write `{BASE_DIR}/weekly-report/{YYYY-WXX}.md` in this shape:

```markdown
---
week: {YYYY-WXX}
period: {Mon} -> {Sun}
generated: {today}
---

## Weekly Report - {YYYY-WXX}

**Period:** {Mon date} -> {Sun date}

## Statistics

### Overall
| Metric | Value |
|--------|-------|
| Total tasks | {N} |
| Done | {X} ({XX}%) |
| In-progress | {Y} (avg {P}%) |
| Blocked | {Z} |
| Pending | {W} |
| Est. hours | {H}h |
| Days tracked | {D}/5 |

### By Project
| Project | Tasks | Done | In-progress | Blocked | EST |
|---------|-------|------|-------------|---------|-----|
| ai-agent-workflow | 5 | 3 (60%) | 1 (40%) | 1 | 8h |

### By Day
| Date | Day | Tasks | Done | EST | Reviewed |
|------|-----|-------|------|-----|----------|
| 2026-04-02 | Thu | 3 | 2 | 4h | yes |
| 2026-04-03 | Fri | 3 | 3 | 3.5h | yes |

## Daily Breakdown

### {YYYY-MM-DD} ({Day}) - [[daily-notes/{YYYY-MM-DD}]]

**{project-name}**

| Task | Start | End | EST | Status | Progress |
|------|-------|-----|-----|--------|----------|
| Fix login bug | 2026-04-02 | 2026-04-02 | 1.5h | done | -- |
| Build dashboard | 2026-04-02 | 2026-04-04 | 2h | in-progress | 40% |

**Notes:** {notes if any}

## Carry Forward

### In-progress
| Task | Project | Progress | Start | End |
|------|---------|----------|-------|-----|
| Build dashboard | website | 40% | 2026-04-02 | 2026-04-04 |

### Pending
| Task | Project | Planned Start |
|------|---------|---------------|
| Write unit test | ai-agent-workflow | 2026-04-04 |

### Blocked
| Task | Project | Since |
|------|---------|-------|
| Write integration test | ai-agent-workflow | 2026-04-02 |

## Notes This Week

- {2026-04-02} Integration test blocked because mock data is missing.
- {2026-04-03} Decided to use ~/Documents/obsidian-dev.
```

Formatting rules:
- Use `->` instead of a Unicode arrow.
- Use `yes` or `no` in the `Reviewed` column.
- Include only existing days in `Daily Breakdown`.
- If a daily plan has no notes, either omit the `Notes:` line for that day or use `**Notes:** --`.
- Build `Notes This Week` from non-empty daily notes, prefixed with their date.
- If no tasks fall into a carry-forward section, keep the section and use a single placeholder row with `--`.

### 6. Confirm the Result

Return a concise summary in this shape:

```text
Weekly plan: {BASE_DIR}/weekly-report/{YYYY-WXX}.md

{Mon} -> {today}
Tasks: {done}/{total} done ({XX}%)
EST:   {H}h across {D} days

Carry forward:
- In-progress: {Y} tasks
- Pending: {W} tasks
- Blocked: {Z} tasks
```
