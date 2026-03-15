---
name: execute-plan
description: Use when the user asks to implement work from an existing feature planning doc in `docs/ai/planning/feature-{name}.md`, resume an incomplete phase, or keep the plan checkboxes in sync with code changes.
---

# Execute Plan

Use this skill to implement a feature from its planning doc with small, reviewable changes.

## Inputs

- Feature name in kebab-case, or a direct path to the planning doc
- Existing planning doc: `docs/ai/planning/feature-{name}.md`

## Codex Tool Mapping

- Claude `Read/Edit/Write` -> inspect files with shell tools and edit with `apply_patch`
- Claude `AskUserQuestion` -> ask the user directly only when the plan is ambiguous enough to risk wrong behavior
- Claude phase/task automation -> use `update_plan` for active todos and keep the planning doc checkboxes in sync manually
- Claude background reads -> parallelize only independent file reads with `multi_tool_use.parallel`

## Workflow

### 1. Load execution context

Read:

- the planning doc
- `docs/ai/planning/feature-template.md`
- `docs/ai/project/CODE_CONVENTIONS.md`
- `docs/ai/project/PROJECT_STRUCTURE.md`

If the planning doc contains design or theme sections, use those sections as the design source of truth.

If the planning doc contains codebase context, use it to find the right files and patterns quickly.

Do not re-run Figma extraction during execution unless the user explicitly asks.

### 2. Detect the current phase

Parse the planning doc and identify:

- total phases
- the last fully completed phase
- the first phase with unchecked items

If the doc has no explicit phases, treat the entire `Implementation Plan` section as one phase.

Skip completed phases. Work from the first incomplete phase only unless the user asks otherwise.

### 3. Build the task queue

Convert incomplete tasks from the current phase into active todos.

Rules:

- keep exactly one todo `in_progress`
- preserve task order unless dependencies require a different order
- note blockers before editing
- ignore `Follow-ups` unless the user explicitly asks for them

If the plan and codebase are out of sync, update the plan first when the correction is obvious. If not obvious, ask.

### 4. Implement task by task

For each task:

1. Read the target files and nearby related code
2. Plan the smallest change that satisfies the task
3. Edit code with `apply_patch`
4. Update the matching checkbox in the planning doc immediately after completion
5. Keep status updates short and concrete

Implementation rules:

- follow `CODE_CONVENTIONS.md` and `PROJECT_STRUCTURE.md`
- follow design/theme constraints from the planning doc when present
- reuse existing patterns before creating new abstractions
- keep changes incremental and within plan scope
- do not silently expand scope across future phases

### 5. Validate incrementally

Run the smallest useful validation first.

Prefer project-native checks such as:

- focused tests for touched code
- lint on changed files or the smallest supported scope
- type checks when types were affected
- build only when the phase or feature is complete, or when needed to prove correctness

Use `quality-code-check` when lint, typecheck, build, or validation debugging becomes the main task.

Fix issues caused by your changes before moving on.

### 6. Handle completion state

After the current phase:

- if more phases remain, report the next resume point
- if all phases are complete, run final quality checks and summarize results
- if the planning doc frontmatter contains a non-null `epic_plan`, sync the linked epic after this run
  - use `in_progress` when some work is complete and more tasks remain
  - use `blocked` only when the plan is explicitly blocked
  - use `completed` when all implementation tasks are complete
  - skip this entirely for standalone feature plans with no epic link

Keep the planning doc as the canonical progress tracker.

## When To Ask The User

Ask only when:

- the plan is missing or cannot be found
- a task description is too ambiguous to implement safely
- the required behavior conflicts with the current codebase
- a missing dependency or external service choice would materially change the solution

## Quality Bar

- Do not rework already-complete phases unless the user asks
- Do not leave completed code without matching checkbox updates
- Prefer a few verified edits over a broad speculative refactor
- Surface blockers explicitly with file references and reasons
