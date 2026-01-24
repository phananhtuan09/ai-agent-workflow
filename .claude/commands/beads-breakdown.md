---
name: beads-breakdown
description: Analyzes feature/requirement and breaks down into Beads epic with tasks and dependencies.
---

## Goal

Analyze a feature description (user prompt, requirement file, or planning file) and break it down into a Beads epic with tasks and dependencies. Confirm with user before executing any `bd` commands.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- ALWAYS confirm breakdown with user before executing `bd` commands.
- Show exact commands that will be executed for transparency.

---

## Step 1: Detect Input Source

**Parse user input to identify source type:**

1. **File reference detected** (starts with `@` or file path):
   - Requirement file: `@docs/ai/requirements/req-{name}.md`
   - Planning file: `@docs/ai/planning/feature-{name}.md`
   - Read file and extract content

2. **User prompt only**:
   - Use prompt directly for analysis

3. **Both file + prompt**:
   - File provides base requirements
   - Prompt provides additional context/focus

**Tool:** Read(file_path=...) if file reference detected

**Extract from file (if requirement doc):**
- Problem Statement → Epic description
- Functional Requirements (FR-xx) → Tasks
- Non-Functional Requirements → Constraints/notes
- Dependencies/Constraints → Task dependencies
- Acceptance Criteria → Task acceptance criteria

**Extract from file (if planning doc):**
- Goal → Epic description
- Implementation phases → Tasks
- Phase dependencies → Task dependencies

---

## Step 2: Analyze and Generate Breakdown

**Generate epic structure:**

1. **Epic title**: Concise name for the feature (e.g., "User Authentication System")

2. **Tasks**: Break down into 3-10 tasks
   - Each task should be independently plannable (1-3 phases when detailed)
   - Task title: Action-oriented (e.g., "Setup JWT infrastructure")
   - Priority: P0 (critical) to P4 (backlog)

3. **Dependencies**: Identify blocking relationships
   - Which tasks must complete before others can start?
   - Which tasks can run in parallel?

**Analysis guidelines:**
- **Too granular**: If task takes < 1 hour → merge with related task
- **Too large**: If task needs > 5 implementation phases → split further
- **Parallel-friendly**: Maximize tasks that can run simultaneously

---

## Step 3: Present Breakdown for Confirmation

**Display proposed breakdown:**

```
## Proposed Epic Breakdown

**Epic**: {Epic Title}
**Source**: {file path or "user prompt"}
**Description**: {1-2 sentence summary}

### Tasks

| # | Title | Priority | Blocked By | Notes |
|---|-------|----------|------------|-------|
| 1 | {Task title} | P{0-4} | - | {brief note} |
| 2 | {Task title} | P{0-4} | Task 1 | {brief note} |
| 3 | {Task title} | P{0-4} | - | {can parallel with 1} |
| 4 | {Task title} | P{0-4} | Task 2 | {brief note} |

### Dependency Graph

```
Task 1 ──────────────────────┐
                             ▼
Task 3 ───▶ Task 2 ───▶ Task 4
```

### Ready to Start (can run in parallel)
- Task 1: {title}
- Task 3: {title}

---

### Commands to Execute

```bash
# Create Epic
bd create "{Epic Title}" -p 0 --type epic

# Create Tasks (after epic created, will use actual epic ID)
bd create "{Task 1 title}" -p {priority} --parent {epic-id}
bd create "{Task 2 title}" -p {priority} --parent {epic-id}
bd create "{Task 3 title}" -p {priority} --parent {epic-id}
bd create "{Task 4 title}" -p {priority} --parent {epic-id}

# Set Dependencies
bd dep add {task-2-id} {task-1-id}  # Task 2 blocked by Task 1
bd dep add {task-4-id} {task-2-id}  # Task 4 blocked by Task 2

# Sync to git
bd sync
```
```

**Ask for confirmation:**

```
AskUserQuestion(questions=[{
  question: "Review the breakdown above. How would you like to proceed?",
  header: "Confirm",
  options: [
    { label: "Execute breakdown", description: "Create epic and tasks in Beads with the structure shown above" },
    { label: "Modify tasks", description: "I want to add, remove, or change tasks before creating" },
    { label: "Cancel", description: "Don't create anything, I'll provide more context" }
  ],
  multiSelect: false
}])
```

---

## Step 4: Handle User Response

### If "Execute breakdown":

Execute `bd` commands sequentially:

```bash
# 1. Create Epic
bd create "{Epic Title}" -p 0 --type epic
# Capture epic ID from output (e.g., bd-auth)

# 2. Create Tasks (use actual epic ID)
bd create "{Task 1}" -p {priority} --parent {epic-id}
# Capture task ID (e.g., bd-auth.1)

bd create "{Task 2}" -p {priority} --parent {epic-id}
# Capture task ID (e.g., bd-auth.2)

# ... repeat for all tasks

# 3. Set Dependencies (use actual task IDs)
bd dep add {task-2-id} {task-1-id}
# ... repeat for all dependencies

# 4. Sync
bd sync
```

**Output summary:**

```
✓ Created Epic: {epic-id} "{Epic Title}"

Tasks created:
  ├── {task-1-id} "{Task 1}" [ready]
  ├── {task-2-id} "{Task 2}" [blocked by {task-1-id}]
  ├── {task-3-id} "{Task 3}" [ready]
  └── {task-4-id} "{Task 4}" [blocked by {task-2-id}]

Ready to start (parallel): {task-1-id}, {task-3-id}

Next steps:
  1. Run `/beads-create-epic-plan` to create high-level epic plan
  2. Run `/beads-next` to claim a task and start working
```

### If "Modify tasks":

Ask follow-up:

```
AskUserQuestion(questions=[{
  question: "What would you like to modify?",
  header: "Modify",
  options: [
    { label: "Add tasks", description: "Add more tasks to the breakdown" },
    { label: "Remove tasks", description: "Remove some tasks" },
    { label: "Change dependencies", description: "Modify blocking relationships" },
    { label: "Change priorities", description: "Adjust task priorities" }
  ],
  multiSelect: true
}])
```

Collect modifications and return to Step 3 with updated breakdown.

### If "Cancel":

```
Breakdown cancelled.

To try again with more context:
  /beads-breakdown "more detailed description"
  /beads-breakdown @docs/ai/requirements/req-{name}.md
```

---

## Step 5: Store Context for Next Commands

After successful creation, store context for `/beads-create-epic-plan`:

**File:** `.beads/current-epic.json`

```json
{
  "epic_id": "{epic-id}",
  "epic_title": "{Epic Title}",
  "source_file": "{file path or null}",
  "tasks": [
    {
      "id": "{task-1-id}",
      "title": "{Task 1}",
      "priority": 1,
      "blocked_by": [],
      "status": "open"
    },
    {
      "id": "{task-2-id}",
      "title": "{Task 2}",
      "priority": 1,
      "blocked_by": ["{task-1-id}"],
      "status": "open"
    }
  ],
  "created_at": "{ISO timestamp}"
}
```

---

## Notes

- **Confirmation required**: Never execute `bd` commands without user confirmation
- **Idempotent**: Safe to re-run; will show current state if epic exists
- **Source tracking**: Links back to requirement/planning doc if provided
- **Parallel-friendly**: Breakdown should maximize parallel execution opportunities

### Task Sizing Guidelines

| Size | Description | When to use |
|------|-------------|-------------|
| Too small | < 1 hour, single function | Merge with related task |
| Good | 2-8 hours, 1-3 phases | Ideal task size |
| Too large | > 2 days, > 5 phases | Split into subtasks |

### Priority Guidelines

| Priority | Meaning | Use for |
|----------|---------|---------|
| P0 | Critical | Blockers, urgent fixes |
| P1 | High | Core functionality |
| P2 | Medium | Important but not blocking |
| P3 | Low | Nice to have |
| P4 | Backlog | Future consideration |
