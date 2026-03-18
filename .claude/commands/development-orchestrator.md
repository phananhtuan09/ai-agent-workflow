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
- For medium/large work, create orchestration todos for macro phases: Mode, Route, Gate, Plan, Review, Execute, Verify, Sync.
- Keep exactly one orchestration todo `in_progress`.
- Use planning doc checkboxes for implementation task state; use command todos only for orchestration phase state.

---

## Step 0: Select Run Mode

Use `AskUserQuestion` for this step unless the user already selected the mode explicitly in the same request.

Supported modes:
- `docs-only`: generate or refresh all planning docs needed for review, then stop before implementation
- `all`: run the full workflow end to end with no more user questions after this mode selection

Required prompt:

```
AskUserQuestion(questions=[{
  question: "Which development-orchestrator mode should I run?",
  header: "Run Mode",
  options: [
    { label: "docs-only", description: "Generate or refresh all planning docs for review, then stop before coding" },
    { label: "all", description: "Run planning, review, execution, verification, and sync in one pass with no more questions" }
  ],
  multiSelect: false
}])
```

Mode rules:
- In `all`, do not ask follow-up confirmation questions. `warn` auto-continues, `fail` stops.
- In `all`, if artifact detection or scope is still materially ambiguous after reading the docs on disk, stop and report the blocker instead of asking again.
- In `docs-only`, you may still use `AskUserQuestion` for genuinely blocking clarification, but prefer generating reviewable docs over opening extra Q&A.

---

## Step 1: Route the Input Artifact

### 1a: Detect artifact type

Read the user input and identify one of:
- requirement doc path: `docs/ai/requirements/req-{name}.md`
- epic doc path: `docs/ai/planning/epic-{name}.md`
- feature plan path: `docs/ai/planning/feature-{name}.md`
- plain-text description with no artifact path (see quick task rule below)

**Quick task rule:** If no artifact path is found and the request describes a self-contained change — single concern, clear expected outcome, no cross-cutting dependencies — treat it as a quick task:
- skip spec file creation
- create a minimal inline plan (goal + expected outcome + files affected, ≤ 5 steps)
- proceed directly to execution
- skip Step 3 (Planning Route) and go straight to Step 5 (Execute)

If the artifact type or intent is ambiguous after applying the quick task rule:
- in `docs-only`, ask the user with `AskUserQuestion`
- in `all`, stop and report the exact missing artifact or ambiguity

`docs-only` prompt:

```
AskUserQuestion(questions=[{
  question: "Which artifact should I orchestrate?",
  header: "Artifact",
  options: [
    { label: "Requirement", description: "Start from a req doc and plan the work" },
    { label: "Epic", description: "Pick the next feature plan from an epic" },
    { label: "Feature Plan", description: "Work from one feature plan doc" }
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
- If the input is an epic and mode is `docs-only`, iterate all tracked slices in dependency order and ensure each reviewable feature plan doc exists.
- If the input is an epic and mode is `all`, choose the next ready feature plan:
  1. first `in_progress` plan without an explicit blocker
  2. else first `open` plan whose dependencies are complete
  3. else stop and report why no plan is ready
- If the input is a feature plan, route directly to plan review.

---

## Step 2: Readiness Gate

Classify the current state as `fail`, `warn`, or `pass`.

### Proportionality

Match required spec depth to task size before applying the gate:
- **Quick task** (single concern, clear outcome, ≤ 5 steps, no cross-cutting dependencies): minimal inline plan is sufficient — do not require a spec file, AC list, or epic
- **Standard task** (3–10 behaviors, no epic needed): a feature plan doc is sufficient
- **Large task** (multi-deliverable, cross-layer, or dependent slices): full spec + epic required

Apply `fail` / `warn` / `pass` relative to the expected depth for that task size, not against the full spec bar.

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

If the gate warns:
- in `all`, continue automatically and include the warning in the final report
- in `docs-only`, ask the user only when the warning would change what docs should be generated

`docs-only` confirmation prompt:

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

If epic breakdown approval is needed:
1. In `docs-only`, enter plan mode, run `Skill(manage-epic)` to propose and confirm the breakdown, then exit plan mode after approval and write the epic to disk
2. In `all`, stop and report the unresolved breakdown instead of asking another question

Mode-specific behavior:
- In `docs-only`, if the work routes to `manage-epic`, create or refresh the epic and then generate or refresh every feature plan listed in that epic before stopping.
- In `docs-only`, if the work routes directly to `create-plan`, generate or refresh the single feature plan and stop after plan review.
- In `all`, continue past planning into review, execution, verification, and sync.

### 3b: Epic input

If mode is `docs-only`:
- create or refresh every missing or stale feature plan tracked by the epic
- stop after plan review summarizes the generated docs

If mode is `all`:
- if the selected feature plan file does not exist yet, use `Skill(create-plan)` with the epic path so the new plan links back to the epic and requirement
- if the selected feature plan already exists, proceed to plan review

### 3c: Feature plan input

Skip directly to plan review.

Mode-specific behavior:
- `docs-only` → stop after plan review and any safe plan-doc fixes
- `all` → continue to execution when review is pass or warn

---

## Step 4: Plan Review

Use an isolated sub-agent:

```
Agent(
  subagent_type="dev-plan-reviewer",
  description="Review feature plan readiness",
  prompt="Feature plan: {feature plan path}
Requirement: {req path or none}
Epic: {epic path or none}
Orchestrator note: {specific concern if any}

Return the concise review summary only."
)
```

Interpret results:
- `fail` → stop until the plan doc is fixed
- `warn` in `docs-only` → keep the docs for human review and report the warnings
- `warn` in `all` → continue automatically
- `pass` in `docs-only` → stop after the review summary
- `pass` in `all` → continue to execution

`docs-only` confirmation prompt only when a warning blocks doc generation:

```
AskUserQuestion(questions=[{
  question: "Plan review found warnings that block a clean docs handoff. Keep the generated docs for manual review?",
  header: "Review",
  options: [
    { label: "Keep docs", description: "Stop here and let the team review the current docs" },
    { label: "Stop", description: "Pause and revise the plan docs first" }
  ],
  multiSelect: false
}])
```

---

## Step 5: Execute

Skip this step entirely in `docs-only`.

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

Skip this step entirely in `docs-only`.

Use an isolated sub-agent:

```
Agent(
  subagent_type="dev-verifier",
  description="Verify execution results",
  prompt="Feature plan: {feature plan path}
Requirement: {req path or none}
Epic: {epic path or none}
Changed files: {list from execute phase}
Validation summary: {quality-check output or summary}

Return the concise verification summary only."
)
```

Interpret results:
- `fail` → stop and report the resume point
- `warn` in `all` → continue automatically to sync
- `pass` → continue to sync

---

## Step 7: Sync

In `docs-only`, do not run post-implementation sync. Only keep cross-links accurate while generating planning docs.

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
- run mode used
- input artifact and route chosen
- gate result
- files created or updated
- skipped steps
- current feature plan status or review status
- epic sync result when applicable
- next resume point or next command

Recommended next actions:
- `docs-only` result → review the generated docs, then run `/development-orchestrator` again in `all` mode
- `all` result → `/development-orchestrator` again to continue the next ready slice
- `/execute-plan` directly only when the user intentionally wants to bypass orchestration

---

## Notes

- Keep user interaction in the command layer. For Claude Code, mode selection must use `AskUserQuestion`. Do not ask the user questions inside worker agents.
- Worker agents must read `.claude/agents/*`, which in turn read shared `.agents/roles/*` files.
- Do not silently skip from one feature plan to another after a failure.
- The planning doc remains the source of truth for implementation task state.
- **Clarification limit:** Do not ask the user more than two clarification rounds. If the input is still ambiguous after two rounds, stop and report the exact missing information as a blocker — do not loop further.
