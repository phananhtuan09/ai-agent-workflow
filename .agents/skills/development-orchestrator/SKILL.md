---
name: development-orchestrator
description: Use when the user wants one orchestration workflow to route requirement, epic, and feature-plan artifacts across planning and implementation with readiness gates, verification, and status sync.
---

# Development Orchestrator

Use this skill as the control plane for planning and implementation.

The orchestrator does not replace `manage-epic`, `create-plan`, or `execute-plan`. It sits above them and does four things:

- route the current artifact to the right workflow
- package minimal context for each worker
- enforce readiness and verification gates
- sync status across requirement, epic, and feature-plan docs

## Inputs

Accept one of:

- requirement doc path: `docs/ai/requirements/req-{name}.md`
- epic doc path: `docs/ai/planning/epic-{name}.md`
- feature plan path: `docs/ai/planning/feature-{name}.md`
- a feature name that can be resolved to one of the above

Optional:

- direct user scope notes
- blocker notes
- explicit instruction to plan only, execute only, or sync only

## Required Context

Read these files first:

- `docs/ai/project/CODE_CONVENTIONS.md`
- `docs/ai/project/PROJECT_STRUCTURE.md`
- `docs/ai/planning/README.md`

Read these workflow skills as needed:

- `.agents/skills/manage-epic/SKILL.md`
- `.agents/skills/create-plan/SKILL.md`
- `.agents/skills/execute-plan/SKILL.md`
- `.agents/skills/quality-code-check/SKILL.md` when validation becomes the main task

If `manage-epic` is unavailable, fall back to `.claude/commands/manage-epic.md`.

## Role Definitions

Optional worker prompts live in:

- `.agents/roles/dev-plan-reviewer.md`
- `.agents/roles/dev-verifier.md`

Use them when the work is large enough to benefit from explicit worker boundaries. Otherwise simulate the same boundary yourself.

## Codex Multi-Agent Contract

This repository registers named Codex agents in `.codex/config.toml`.

Use these exact agent names when `spawn_agent` is available:

- `dev_plan_reviewer`
- `dev_verifier`

Execution policy:

- Keep one primary writer for requirement, epic, feature-plan, and implementation edits.
- Use sub-agents for review and verification, where parallel read-heavy work is safe.
- Do not run more than one write-heavy implementation worker at a time.
- If a spawned review or verification agent fails, retry once with a tighter packet, then continue solo if needed.

## Compatibility Contract

This skill must work with and without optional orchestrator-specific template changes.

- Do not assume `req-template` already contains `Related Plans`.
- Do not assume `epic-template` already contains `FR Scope` or `Depends On`.
- Do not assume `execute-plan` auto-syncs epic status.
- If any of those integrations exist, use them.
- If they do not exist, keep the workflow moving by updating docs explicitly and only when safe.

Standalone `create-plan` and `execute-plan` flows must remain valid.

## Context Packet

Before handing work to another skill or worker, create a bounded packet with:

- `Mode`: `route`, `plan`, `plan-review`, `execute`, `verify`, or `sync`
- `Input Artifact`: `requirement`, `epic`, or `feature-plan`
- `Goal`: one concrete outcome
- `Source of Truth`: exact doc paths
- `Acceptance Criteria Slice`: only the scenarios relevant to this step
- `Allowed Files`: files the worker may edit
- `Non-Goals`: explicit out-of-scope items
- `Validation`: exact commands or validation expectations
- `Stop If`: ambiguity that would materially change behavior

Do not forward full conversation history when the packet is sufficient.

When delegating to Codex agents, also include:

- `Role`: exact agent name from the Codex Multi-Agent Contract
- `Allowed Writes`: exact file paths the worker may edit, or `none` for read-only verification
- `Linked Docs`: exact requirement, epic, and feature-plan paths relevant to this step

## Readiness Gate

Before planning or executing, classify findings as `fail`, `warn`, or `pass`.

Fail when:

- the core behavior or feature boundary is missing
- no acceptance criteria exist for non-trivial work
- unresolved open questions would materially change implementation
- the target artifact cannot be found

Warn when:

- out-of-scope is missing but the implementation boundary is still clear
- dependency order is implied but not explicit
- risks exist without concrete mitigation yet

Pass when:

- the next workflow can proceed without guessing behavior

## Routing Rules

### Requirement input

Choose `manage-epic` when one or more of these are true:

- more than one independently shippable deliverable exists
- the work spans multiple major layers or domains
- the likely implementation will exceed three phases
- the requirement clearly decomposes into dependent slices

Otherwise choose `create-plan` directly.

### Epic input

Choose the next plan in this order:

1. first `in_progress` plan without a blocking issue
2. first `open` plan whose dependencies are complete
3. if no plan is ready, stop and report why

If the selected feature plan does not exist yet, run `create-plan` for that slice before execution.

### Feature plan input

Run `plan-review` before implementation unless the user explicitly asks to skip it.

If the review passes, run `execute-plan`.

After execution, always run `verify` and then `sync` when an epic link exists.

## Workflow

### 1. Route

Identify the artifact type and linked documents:

- requirement linked to epic
- epic linked to requirement and feature plans
- feature plan linked to requirement or epic via frontmatter

Re-read the files from disk instead of relying on chat memory.

### 2. Plan

For requirement-driven work:

- run the readiness gate
- choose `manage-epic` or `create-plan`
- pass only the requirement and direct constraints

For epic-driven work:

- select the next slice
- create or refresh the corresponding feature plan when needed

### 3. Plan review

Validate that the selected feature plan has:

- a clear goal
- testable acceptance criteria
- dependency-ordered phases
- concrete file targets
- validation expectations

If the plan fails review, fix the plan before execution.

When `spawn_agent` is available, delegate this step to `dev_plan_reviewer` with a read-only packet unless the worker is explicitly allowed to patch the plan.

### 4. Execute

Pass only the selected feature plan, linked requirement and epic paths, and the relevant acceptance criteria slice.

Do not execute more than one feature plan at a time.

Keep execution in the primary orchestrator thread unless you later add a dedicated execution agent with a strict single-writer contract.

### 5. Verify

Check:

- touched code matches the current plan tasks
- acceptance criteria are still covered
- validation ran at the smallest useful scope first
- blockers are recorded explicitly when work could not finish

Use `quality-code-check` when lint, type, build, or test work becomes the main task.

When `spawn_agent` is available, delegate the verification summary to `dev_verifier` after execution and validation complete.

### 6. Sync

When `epic_plan` exists:

- update the feature plan status in the epic
- keep the dependency graph accurate when execution order changed
- update the requirement's `Related Plans` section when safe and useful

Status mapping:

- untouched plan -> `open`
- partial completion -> `in_progress`
- explicit blocker -> `blocked`
- all tasks complete -> `completed`

### 7. Failure handling

If execution or verification fails mid-phase:

- keep the feature plan as the source of truth
- mark the next task as blocked with a concise reason
- sync the epic status to `blocked` only when the plan is actually blocked, not merely incomplete
- stop and report the concrete resume point

Do not silently skip to another feature plan.

## Final response

Report:

- input artifact and route chosen
- gates passed, warned, or failed
- files created or updated
- next resume point
- blockers or assumptions

## Quality Bar

- routing decisions are explainable from repository artifacts
- worker context stays bounded
- no implementation begins from an unready plan
- epic and feature-plan status stay aligned when an epic is in play
- standalone planning or execution still works without this orchestrator
