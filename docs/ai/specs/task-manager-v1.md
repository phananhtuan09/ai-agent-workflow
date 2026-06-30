---
phase: spec
title: Task Manager V1
description: Centralized task backlog layer (human intent) sitting before the spec workflow, with per-project and cross-project query
---

## Tier
Lite

## Problem
Users currently manage feature work by memory or ad-hoc notes. There is no durable task backlog before the spec workflow. When working across multiple projects, it is hard to see what is pending, active, or done in each project and across all projects.

## Scope
Phase 1 delivers core task CRUD with a centralized local JSON store, per-project filtering by folder name, and a cross-project board. Tasks represent raw "human intent" and are intentionally allowed to be vague. Status flow: `todo` → `doing` → `done` (user marks done manually). At most 1 task `doing` per project to preserve focus.

## Assumption Check
- **Confirmed**: store at `~/.ai-workflow/tasks.json`, zero-dependency JSON, local-only
- **Confirmed**: project identified by folder name (not git root — some repos may not be git)
- **Confirmed**: skill for Codex (`.agents/skills/`) and command for Claude (`.claude/commands/`)
- **Confirmed**: delete mechanism required — `task delete <id>` and `task clean` (remove all done)
- **Chosen to keep scope small**: no bridge to spec workflow, no priority/tags/due dates, no task description beyond title

## Technical Approach
- Zero-dependency JSON store at `~/.ai-workflow/tasks.json`
- Skill at `.agents/skills/task-manager/SKILL.md` containing full operational logic
- Command `/task` at `.claude/commands/task.md` as Claude entry point
- Mirror skill at `.claude/skills/task-manager/SKILL.md` for Claude skill registry
- Agent reads/writes JSON directly via file tools; no runtime code, no CLI changes
- Project auto-registers on first access (detected from cwd folder name)

## Architecture / Pattern Notes
Follows the existing `skill → command` pattern:
- `.agents/skills/task-manager/SKILL.md` — portable logic, agent-agnostic
- `.claude/commands/task.md` — Claude command binding (thin wrapper)
- `.claude/skills/task-manager/SKILL.md` — Claude skill mirror

Store schema:
```jsonc
{
  "version": 1,
  "projects": [
    { "id": "p_<random6>", "name": "folder-name", "root": "/absolute/path" }
  ],
  "tasks": [
    { "id": "t_<random6>", "project_id": "p_xxx", "title": "...", "status": "todo", "created": "ISO", "updated": "ISO" }
  ]
}
```

Project matching: resolve cwd folder name, match against `projects[].name`. If no match and `root` differs, treat as new project and auto-register.

## Acceptance Criteria
- [ ] AC1: `task add "<title>"` creates a `todo` task for the current project and prints the new task id
- [ ] AC2: `task list` shows all tasks of the current project, grouped by status (`doing` → `todo` → `done`)
- [ ] AC3: `task list --all` shows tasks across all registered projects, grouped by project
- [ ] AC4: `task start <id>` moves a task to `doing`; if another task is already `doing`, warn and refuse
- [ ] AC5: `task done <id>` marks a task as `done`
- [ ] AC6: `task delete <id>` permanently removes a task
- [ ] AC7: `task clean` removes all `done` tasks for the current project (with confirmation)
- [ ] AC8: `task current` shows the `doing` task of the current project, or reports none

## Out of Scope
- Bridge to spec workflow (linking `task_id` ↔ spec path) — Phase 2
- Task priority, tags, description, due dates, assignee
- Multi-user or concurrent process access
- Cloud sync, export/import

## Edge Cases / Failure States
- **No projects registered**: first `task add` auto-creates project entry from cwd folder name
- **Store file missing**: create fresh with empty `{ version: 1, projects: [], tasks: [] }`
- **Corrupted JSON**: warn user and offer to reset (`task reset`)
- **Unknown task id**: error with list of valid ids
- **Task already done**: warn on `task start` / `task done` of a done task
- **Max 1 doing constraint**: `task start` checks if any other task is `doing` for same project; warn and refuse if so

## Open Questions
- None — all decisions confirmed by user in pre-spec brainstorm.
