---
name: task-manager
description: |
  Manage a local task backlog (human intents) that sits before the spec workflow. Centralized store, per-project and cross-project views.
  Use when: the user wants to add/list/start/delete tasks, see a task board, check what's doing, or clean up done tasks.
  Keywords: task, todo, backlog, intent, task list, task board, what to do, what's next, doing, done, task manager
  Do NOT use for: spec creation, code implementation, bug reporting — this is for human-intent task tracking only.
---

# Task Manager

Manage the local task backlog stored at `~/.ai-workflow/tasks.json`. Tasks represent raw human intent before the spec workflow.

## Usage

`/task <action> [args]`

## Actions

| Action | Args | Description |
|---|---|---|
| `add` | `"<title>"` | Create a todo task for the current project |
| `list` | | Show all tasks for the current project, grouped by status |
| `list` | `--all` | Show tasks across all registered projects |
| `start` | `<id>` | Mark a task as doing (max 1 doing per project) |
| `done` | `<id>` | Mark a task as done |
| `delete` | `<id>` | Permanently remove a task |
| `clean` | | Remove all done tasks for the current project (asks confirmation) |
| `current` | | Show the currently active (doing) task |
| `reset` | | Reset the entire task store (emergency recovery) |

## Project Matching

The current project is identified by the working directory folder name. First access in a new project auto-registers it.

## Store

`~/.ai-workflow/tasks.json` — centralized, local-only, zero-dependency JSON.
