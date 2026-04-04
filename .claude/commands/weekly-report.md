---
name: weekly-report
description: Weekly summary — aggregate daily plans into stats and carry-forward report.
---

## Folder Structure

```
{BASE_DIR}/
  daily-plans/    ← Claude reads from here
  weekly-report/  ← Claude creates here
```

**Default BASE_DIR (cross-platform):**
- Linux/macOS: `~/Documents/obsidian-dev`
- Windows: `%USERPROFILE%\Documents\obsidian-dev`

**Override in prompt:**
```
/weekly-report dir folder: ~/source_code
```

---

## Goal

Read all `daily-plans/` files for the current week, generate stats + breakdown, save to `weekly-report/YYYY-WXX.md`.

---

## Step 1: Resolve BASE_DIR

Check if user specified `dir folder:` in prompt → use that path.

If not → detect OS:
```bash
uname -s  # Linux/macOS → ~/Documents/obsidian-dev
          # Windows    → %USERPROFILE%\Documents\obsidian-dev
```

Create dir if not exists:
```bash
mkdir -p {BASE_DIR}/weekly-report
```

---

## Step 2: Determine Week Range

```bash
date +%Y-W%V
```

Calculate Monday–Sunday of current week.
Only read files up to today (skip future dates).

---

## Step 3: Read Daily Plan Files

For each day Mon → today, read `{BASE_DIR}/daily-plans/{date}.md` if it exists.

From each file extract:
- `source` frontmatter (link to originating daily-notes file)
- `reviewed` frontmatter flag
- Projects and tasks
- Per task: Start, End, EST, Status, Progress
- Notes section

---

## Step 4: Compute Statistics

**Overall:**
- Total tasks, done count + rate %, in-progress count (avg progress %), blocked count, pending count
- Total EST hours
- Days with plan files vs working days elapsed this week

**Per project:**
- Task count, done count + rate %, total EST
- In-progress tasks with current progress %

**Per day:**
- Task count, done count, total EST, reviewed flag

---

## Step 5: Write Weekly Plan

```markdown
---
week: {YYYY-WXX}
period: {Mon} → {Sun}
generated: {today}
---

## Weekly Report — {YYYY-WXX}

**Period:** {Mon date} → {Sun date}

---

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
| 2026-04-02 | Thu | 3 | 2 | 4h | ✓ |
| 2026-04-03 | Fri | 3 | 3 | 3.5h | ✓ |

---

## Daily Breakdown

### {YYYY-MM-DD} ({Day}) — [[daily-notes/{YYYY-MM-DD}]]

**{project-name}**

| Task | Start | End | EST | Status | Progress |
|------|-------|-----|-----|--------|----------|
| Fix login bug | 2026-04-02 | 2026-04-02 | 1.5h | done | — |
| Build dashboard | 2026-04-02 | 2026-04-04 | 2h | in-progress | 40% |

**Notes:** {notes if any}

---

## Carry Forward

### In-progress
| Task | Project | Progress | Start | End |
|------|---------|----------|-------|-----|
| Build dashboard | website | 40% | 2026-04-02 | 2026-04-04 |

### Pending
| Task | Project | Planned Start |
|------|---------|---------------|
| Viết unit test | ai-agent-workflow | 2026-04-04 |

### Blocked
| Task | Project | Since |
|------|---------|-------|
| Viết integration test | ai-agent-workflow | 2026-04-02 |

---

## Notes This Week

- {2026-04-02} Integration test blocked vì thiếu mock data.
- {2026-04-03} Quyết định dùng ~/Documents/obsidian-dev.
```

---

## Step 6: Confirm

```
✓ Weekly plan: {BASE_DIR}/weekly-report/{YYYY-WXX}.md

  {Mon} → {today}
  Tasks:   {done}/{total} done ({XX}%)
  EST:     {H}h across {D} days

  Carry forward:
    In-progress: {Y} tasks
    Pending:     {W} tasks
    Blocked:     {Z} tasks
```
