---
name: development-orchestrator
description: Route requirement, epic, and feature-plan artifacts across planning and implementation with readiness gates, plan review, verification, and epic sync.
---

## Goal

Provide one Claude Code entry point for planning and implementation orchestration.

This command does not replace `/manage-epic`, `/create-plan`, or `/execute-plan`. It coordinates them.

Core responsibilities:
- route the current artifact to the right workflow
- enforce a readiness gate before planning or execution
- run plan review and verification with isolated sub-agents
- sync requirement, epic, and feature-plan state after each run

---

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before and after important actions.
- For medium/large work, create orchestration todos for macro phases: Route, Gate, Plan, Review, Execute, Verify, Sync.
- Keep exactly one orchestration todo `in_progress`.
- Use planning doc checkboxes for implementation task state; use command todos only for orchestration phase state.

---

## Step 1: Route the Input Artifact

### 1a: Detect artifact type

Read the user input and identify one of:
- requirement doc path: `docs/ai/requirements/req-{name}.md`
- epic doc path: `docs/ai/planning/epic-{name}.md`
- feature plan path: `docs/ai/planning/feature-{name}.md`

If the artifact type or intent is ambiguous, ask the user:

```
AskUserQuestion(questions=[{
  question: "Which artifact should I orchestrate?",
  header: "Artifact",
  options: [
    { label: "Requirement", description: "Start from a req doc and plan the work" },
    { label: "Epic", description: "Pick the next feature plan from an epic" },
    { label: "Feature Plan", description: "Review and execute one feature plan" }
  ],
  multiSelect: false
}])
```

### 1b: Load core context

Read:
- `docs/ai/project/CODE_CONVENTIONS.md`
- `docs/ai/project/PROJECT_STRUCTURE.md`
- `docs/ai/planning/README.md`
- the selected artifact

Then read linked docs as needed:
- requirement linked from epic or feature plan
- epic linked from requirement or feature plan
- selected feature plan when routing from an epic

### 1c: Normalize routing

Rules:
- If the input is a requirement and it already links to an existing epic, route to the epic flow instead of creating a duplicate epic.
- If the input is an epic, choose the next ready feature plan:
  1. first `in_progress` plan without an explicit blocker
  2. else first `open` plan whose dependencies are complete
  3. else stop and report why no plan is ready
- If the input is a feature plan, route directly to plan review.

---

## Step 2: Readiness Gate

Classify the current state as `fail`, `warn`, or `pass`.

### Fail when
- the target artifact cannot be found
- the core behavior or feature boundary is missing
- no acceptance criteria exist for non-trivial work
- unresolved open questions would materially change implementation

### Warn when
- out-of-scope is missing but the implementation boundary is still clear
- dependency order is implied but not explicit
- risks exist without concrete mitigation yet

### Pass when
- the next workflow can proceed without guessing behavior

If the gate fails:
- stop
- report the exact missing input or ambiguity

If the gate warns, ask the user:

```
AskUserQuestion(questions=[{
  question: "The readiness gate found non-blocking warnings. Continue anyway?",
  header: "Gate",
  options: [
    { label: "Continue", description: "Proceed with the current warnings" },
    { label: "Stop", description: "Pause and fix the warnings first" }
  ],
  multiSelect: false
}])
```

---

## Step 3: Planning Route

### 3a: Requirement input

If the requirement already links to an epic on disk:
- switch to epic flow

Otherwise decide size:
- **Large / multi-slice / dependency-heavy** → Use `Skill(manage-epic)`
- **Small / self-contained** → Use `Skill(create-plan)`

Use this heuristic for `manage-epic`:
- more than one independently shippable deliverable
- work spans multiple major layers or domains
- likely implementation exceeds three phases
- requirement clearly decomposes into dependent slices

If using epic breakdown approval:
1. Enter plan mode
2. Run `Skill(manage-epic)` to propose and confirm the breakdown
3. Exit plan mode after approval and write the epic to disk

### 3b: Epic input

If the selected feature plan file does not exist yet:
- use `Skill(create-plan)` with the epic path so the new plan links back to the epic and requirement

If the selected feature plan already exists:
- proceed to plan review

### 3c: Feature plan input

Skip directly to plan review.

---

## Step 4: Plan Review

Use an isolated sub-agent:

```
Agent(
  subagent_type="general-purpose",
  description="Review feature plan readiness",
  prompt="Read agent definition: .claude/agents/dev-plan-reviewer.md

Feature plan: {feature plan path}
Requirement: {req path or none}
Epic: {epic path or none}
Orchestrator note: {specific concern if any}

Return the concise review summary only."
)
```

Interpret results:
- `fail` → stop execution until the plan is fixed
- `warn` → ask the user whether to continue
- `pass` → continue to execution

Warn confirmation:

```
AskUserQuestion(questions=[{
  question: "Plan review found warnings. Continue to execution?",
  header: "Review",
  options: [
    { label: "Continue", description: "Execute with the current plan warnings" },
    { label: "Stop", description: "Pause and revise the plan first" }
  ],
  multiSelect: false
}])
```

---

## Step 5: Execute

Run:

```
Skill(execute-plan)
```

Pass only bounded execution context:
- selected feature plan path
- linked requirement path when relevant
- linked epic path when relevant
- relevant acceptance criteria slice

Rules:
- do not execute more than one feature plan at a time
- keep execution scoped to the selected feature plan

---

## Step 6: Verify

Use an isolated sub-agent:

```
Agent(
  subagent_type="general-purpose",
  description="Verify execution results",
  prompt="Read agent definition: .claude/agents/dev-verifier.md

Feature plan: {feature plan path}
Requirement: {req path or none}
Epic: {epic path or none}
Changed files: {list from execute phase}
Validation summary: {quality-check output or summary}

Return the concise verification summary only."
)
```

Interpret results:
- `fail` → stop and report the resume point
- `warn` → ask the user whether to continue to sync
- `pass` → continue to sync

Warn confirmation:

```
AskUserQuestion(questions=[{
  question: "Verification found warnings. Continue to sync status?",
  header: "Verify",
  options: [
    { label: "Continue", description: "Sync docs and statuses with the current warnings" },
    { label: "Stop", description: "Pause and address the warnings first" }
  ],
  multiSelect: false
}])
```

---

## Step 7: Sync

When the feature plan frontmatter contains a non-null `epic_plan`:

```
Skill(manage-epic)
```

Use sync mode and update:
- epic row status
- dependency graph when execution order changed
- requirement `Related Plans` section when useful

Status mapping:
- untouched plan → `open`
- partial completion → `in_progress`
- explicit blocker → `blocked`
- all tasks complete → `completed`

Skip this step entirely for standalone feature plans with no epic link.

---

## Step 8: Final Response

Report:
- input artifact and route chosen
- gate result
- files created or updated
- current feature plan status
- epic sync result when applicable
- next resume point or next command

Recommended next actions:
- `/development-orchestrator` again to continue the next ready slice
- `/execute-plan` directly only when the user intentionally wants to bypass orchestration

---

## Notes

- Keep user interaction in the command layer. Do not ask the user questions inside worker agents.
- Worker agents must read `.claude/agents/*`, which in turn read shared `.agents/roles/*` files.
- Do not silently skip from one feature plan to another after a failure.
- The planning doc remains the source of truth for implementation task state.
