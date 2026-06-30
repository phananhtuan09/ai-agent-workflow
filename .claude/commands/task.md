Manage the local task backlog stored at ~/.ai-workflow/tasks.json. Tasks represent raw human intent before the spec workflow.

USAGE: /task <action> [args]

ACTIONS:
  add "<title>"     Create a todo task for the current project
  list              Show all tasks for the current project, grouped by status
  list --all        Show tasks across all registered projects
  start <id>        Mark a task as doing (max 1 doing per project)
  done <id>         Mark a task as done
  delete <id>       Permanently remove a task
  clean             Remove all done tasks for the current project (asks confirmation)
  current           Show the currently active (doing) task
  reset             Reset the entire task store (emergency recovery)

PROJECT MATCHING:
The current project is identified by the working directory folder name. First access in a new project auto-registers it.

STORE:
~/.ai-workflow/tasks.json — centralized, local-only, zero-dependency JSON.

For full operational details, read .agents/skills/task-manager/SKILL.md.
