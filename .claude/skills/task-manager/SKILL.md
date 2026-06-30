---
name: task-manager
description: |
  Manage a local task backlog (human intents) that sits before the spec workflow. Centralized store, per-project and cross-project views.
  Use when: the user wants to add/list/start/delete tasks, see a task board, check what's doing, or clean up done tasks.
  Keywords: task, todo, backlog, intent, task list, task board, what to do, what's next, doing, done, task manager
  Do NOT use for: spec creation, code implementation, bug reporting — this is for human-intent task tracking only.
---

# Task Manager

Read/write a centralized JSON task store. Tasks live before the spec workflow and represent raw human intent. They are allowed to be vague.

## Store Location
- `~/.ai-workflow/tasks.json` — single shared file, zero-dependency JSON, local only

## Schema
```jsonc
{
  "version": 1,
  "projects": [
    { "id": "p_<random6>", "name": "folder-name", "root": "/absolute/path" }
  ],
  "tasks": [
    {
      "id": "t_<random6>",
      "project_id": "p_xxx",
      "title": "raw human intent, can be vague",
      "status": "todo",
      "created": "2026-06-29T10:00:00Z",
      "updated": "2026-06-29T10:00:00Z"
    }
  ]
}
```

## Project Resolution
1. Get the current working directory folder name: `path.basename(process.cwd())`
2. Search `projects[]` for matching `name`
3. If found — use that `project_id`
4. If not found — auto-register: generate `p_` + 6 random hex chars, set `name` = folder name, `root` = `process.cwd()`

## ID Generation
- Project ids: `p_` + 6 random lowercase hex chars
- Task ids: `t_` + 6 random lowercase hex chars

## Operations

### `task add "<title>"`
1. Resolve project (auto-register if new)
2. Create task with `id` = `t_<random6>`, `status` = `todo`, timestamps = now ISO
3. Append to `tasks[]`
4. Write file
5. Output: `Created task t_xxxxx: "<title>" in project <project-name>`

### `task list`
1. Resolve project
2. Filter tasks by `project_id`
3. Group and print by status: `doing` → `todo` → `done`
4. Format per group:
```
[{project-name}]
  DOING (1)
    t_xxxxx  "title"  (2026-06-29)
  TODO (3)
    t_xxxxx  "title"  (2026-06-29)
  DONE (2)
    t_xxxxx  "title"  (2026-06-29)
```
5. If no tasks: "No tasks in <project-name>. Use `/task add` to create one."

### `task list --all`
1. Read all projects and tasks
2. Print grouped by project name, sorted alphabetically
3. Only show projects that have at least 1 task
4. Inside each project, group tasks by `doing` → `todo` → `done`
5. Format same as above, but with project header, and omit projects with 0 tasks

### `task start <id>`
1. Find task by `id` across all projects (full scan)
2. If not found → error with "Task <id> not found"
3. If task is already `done` → error "Task <id> is already done. Move it back to todo first if needed."
4. Check: any other task in the **same project** has `status: "doing"`?
   - Yes → warn: "Project <name> already has a doing task: t_xxxxx "<title>". Complete that one first, or mark it todo before starting this one." Do NOT change status.
   - No → set `status: "doing"`, `updated` = now, write file
5. Output: "Started t_xxxxx: "<title>" → doing"

### `task done <id>`
1. Find task by `id` (full scan)
2. If not found → error
3. If already `done` → error "Task <id> is already done."
4. Set `status: "done"`, `updated` = now, write file
5. Output: "Done: t_xxxxx "<title>""

### `task delete <id>`
1. Find task by `id` (full scan)
2. If not found → error
3. Remove task from `tasks[]`
4. Write file
5. Output: "Deleted t_xxxxx: "<title>""

### `task clean`
1. Resolve project
2. Find all tasks with `status: "done"` for this project
3. If none → "No done tasks to clean."
4. If any → confirm: "Remove N done tasks from <project-name>? (y/N)"
   - If user confirms → remove them, write file, output "Cleaned N done tasks from <project-name>."
   - If not → "Cancelled."

### `task current`
1. Resolve project
2. Find task with `status: "doing"` for this project
3. If found → print:
```
CURRENT: t_xxxxx "<title>" (started: <updated>)
```
4. If not → "No active task in <project-name>. Use `/task list` to see available tasks."

### `task reset`
Recovery command. If store is corrupted:
1. Delete `~/.ai-workflow/tasks.json`
2. Create fresh: `{ "version": 1, "projects": [], "tasks": [] }`
3. Output: "Store reset. All tasks and projects cleared."

## File I/O Rules
- **Always** read the full file before writing — never assume current state
- Read → modify in-memory → write full file atomically (write to temp + rename, or just write)
- Use absolute path: resolve `~` to `os.homedir()`
- If file does not exist → create with fresh structure
- If JSON parse fails → warn user about corruption, suggest `/task reset`

## Display Rules
- Task titles in double quotes
- Dates in `YYYY-MM-DD` format (truncate ISO to date only)
- Group headers in UPPERCASE
- Respect the max-1-doing constraint
- Project name in brackets at top of `task list`

## Constraints
- At most **1 task with status `doing`** per project — enforced on `task start`
- **Task titles must be in Vietnamese** — always write titles in Vietnamese, including system output messages that quote the title
- Task titles are plain text, no markdown interpretation needed
- Store is local only, no network calls

## Edge Cases
- Empty store / file missing → create fresh on first write
- Project name collision (two folders with same name but different roots) → the first registered project wins; root field is for reference only
- Corrupted JSON → warn + suggest `task reset`
- User in a directory with no matching project → auto-register silently on first add/list
