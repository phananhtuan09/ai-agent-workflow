---
name: beads-create-epic-plan
description: Creates a high-level epic plan document for architecture, flow, and task overview.
---

## Goal

Create a high-level epic plan document (`docs/ai/planning/epic-{name}.md`) that focuses on architecture, data flow, and task overview. This plan is NOT executable - it serves as a reference for task-level plans.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- Generate plan automatically after gathering context.
- Link to Beads epic and requirement doc if available.

---

## Step 1: Load Context

### 1a: Check for Current Epic Context

**Read:** `.beads/current-epic.json` (created by `/beads-breakdown`)

If exists:
- Extract epic_id, epic_title, source_file, tasks
- Use as primary context

If not exists:
- Ask user for epic ID or title

```
AskUserQuestion(questions=[{
  question: "Which epic would you like to create a plan for?",
  header: "Epic",
  options: [
    { label: "Enter epic ID", description: "e.g., bd-auth or project-abc" },
    { label: "Enter epic title", description: "I'll search for it in Beads" }
  ],
  multiSelect: false
}])
```

Then run: `bd list --type epic` to find matching epic

### 1b: Load Epic Details from Beads

**Run:** `bd show {epic-id} --json`

Extract:
- Epic title, description
- Child tasks (IDs, titles, priorities, dependencies)
- Current status

### 1c: Load Requirement Doc (if linked)

If `source_file` exists in context:
- Read requirement doc
- Extract architecture hints, constraints, acceptance criteria

### 1d: Explore Codebase (optional)

**Tool:** Task(
  subagent_type='Explore',
  thoroughness='quick',
  prompt="Identify existing architecture patterns relevant to {epic title}. Find similar features, common patterns, and key integration points. Return summarized findings."
)

---

## Step 2: Generate Epic Plan

**Load template:** Read `docs/ai/planning/epic-template.md`

**Auto-derive epic name:**
- From epic title: "User Authentication System" → `epic-auth-system`
- Kebab-case, concise

**Generate content sections:**

### Section 1: Overview
- Problem statement from requirement doc or infer from epic title
- Goals from epic description
- Success metrics (derive from acceptance criteria if available)

### Section 2: Architecture
- Propose high-level architecture based on:
  - Codebase exploration findings
  - Similar features in codebase
  - Standard patterns for this type of feature
- Keep diagram simple (ASCII art)
- List key components and their responsibilities

### Section 3: Task Breakdown
- Pull from Beads (via `bd show {epic-id}`)
- Include: task ID, title, priority, status, blocked by
- Show dependency graph
- Leave "Plan Doc" column empty (filled when `/create-plan` runs)

### Section 4: Data Flow
- Describe primary user/data flow
- Include error handling flow
- Keep high-level (details go in task plans)

### Section 5: API Contracts (if applicable)
- Only if epic involves API changes
- High-level endpoints overview
- Key data models (schema outline)

### Section 6: Key Decisions
- Document major architectural decisions
- Include alternatives considered and trade-offs

### Section 7: Risks & Mitigations
- Technical risks
- Dependency risks
- Timeline risks

### Section 8: Dependencies
- External services/APIs
- Internal teams/services
- Blockers that must be resolved

---

## Step 3: Create Epic Plan File

**File path:** `docs/ai/planning/epic-{name}.md`

**Frontmatter:**
```yaml
---
beads_epic: {epic-id}
requirement: {source_file or null}
---
```

**If file already exists:**
1. Backup to: `docs/ai/planning/archive/epic-{name}_{timestamp}.md`
2. Notify user: "Previous version backed up to archive/"
3. Overwrite main file

**Write file:** Write(file_path=..., content=...)

---

## Step 4: Update Context File

**Update:** `.beads/current-epic.json`

Add:
```json
{
  "epic_plan": "docs/ai/planning/epic-{name}.md",
  "updated_at": "{ISO timestamp}"
}
```

---

## Step 5: Output Summary

```
✓ Created epic plan: docs/ai/planning/epic-{name}.md

Epic: {epic-id} "{Epic Title}"
Tasks: {count} ({ready} ready, {blocked} blocked)

Sections created:
  ✓ Overview
  ✓ Architecture
  ✓ Task Breakdown ({task count} tasks)
  ✓ Data Flow
  {✓ API Contracts (if included)}
  ✓ Key Decisions
  ✓ Risks & Mitigations
  ✓ Dependencies

Next steps:
  1. Review and refine the epic plan
  2. Run `/beads-next` to claim a task
  3. Run `/create-plan` to create detailed plan for the claimed task
```

---

## Notes

- **High-level only**: Epic plan focuses on architecture and overview, NOT implementation details
- **Not executable**: Use `/execute-plan` only on task-level plans (feature-*.md)
- **Reference document**: Task plans reference this for architectural context
- **Sync with Beads**: Task breakdown table should match Beads state
- **Update manually**: Architecture decisions and risks should be updated as epic progresses

### What Goes Where

| Content | Epic Plan | Task Plan |
|---------|-----------|-----------|
| Architecture overview | ✓ | Reference only |
| Data flow diagrams | ✓ | Detailed flow if needed |
| Task list & dependencies | ✓ | Single task focus |
| API contracts (overview) | ✓ | Detailed specs |
| Implementation phases | ✗ | ✓ |
| Pseudo-code | ✗ | ✓ |
| File-level changes | ✗ | ✓ |
| Acceptance criteria | High-level | Detailed per task |
