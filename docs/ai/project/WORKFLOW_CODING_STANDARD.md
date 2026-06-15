---
phase: project
title: Workflow Coding Standard
description: Standard coding workflow for planning, executing, and verifying work in this repository
---

# Workflow Coding Standard

## Purpose
This document defines the standard coding workflow that AI agents should follow when handling work in this repository.

It covers:
- task routing
- required workflow phases
- expected artifacts
- spec and plan quality gates
- when to use short paths versus the full spec-driven flow

## Routing

| Task type | Standard workflow |
|---|---|
| New feature | `/create-spec` → `review-spec` → `/create-plan` → `review-plan` → `/enrich-plan` → `/execute-plan` → `/verify-feature` |
| Fix bug (clear) | `/create-plan "Fix: ..."` → `review-plan` → `/execute-plan` |
| Refactor | `/create-plan "Refactor: ..."` → `review-plan` → `/execute-plan` |
| Fix bug (ambiguous/large) | `/create-spec` → `review-spec` → `/create-plan` → `review-plan` → `/enrich-plan` → `/execute-plan` |
| Small update (1-2 files) | `/execute-plan "inline task"` |

## Standard Feature Flow

```text
User request
  ↓
Routing decision
  ↓
/create-spec
  ↓
review-spec
  ↓
/create-plan
  ↓
review-plan
  ↓
/enrich-plan
  ↓
/execute-plan
  ↓
/verify-feature
```

## Phase Rules

### 1. `/create-spec`
Purpose:
- capture the requirement boundary before implementation
- keep the requirement reviewable by humans
- provide enough behavioral detail that planning does not need to invent product behavior

Rules:
- focus on user value, scope, and behavior
- avoid implementation and framework details
- include behavioral constraints when they affect acceptance, such as validation, persistence, fallback, reset/default behavior, compatibility expectations, and visible empty/error states
- classify the feature as `Lite`, `Standard`, or `Extended`
- write the final tier explicitly in the spec
- keep the spec concise and scan-friendly within tier limits
- write to `docs/ai/specs/{feature}.md`

Tier guidance:
- `Lite`: 25-39 lines, usually up to 7 ACs
- `Standard`: 40-90 lines, usually up to 12 ACs
- `Extended`: 91-140 lines, usually up to 18 ACs
- if an `Extended` spec would exceed 18 ACs or 140 lines, split it into sub-features or add a short addendum instead of bloating the main spec

Expected output:
- `## Tier`
- `## Problem`
- `## Scope`
- `## Acceptance Criteria`
- `## Out of Scope`
- `## Open Questions`
- `## Key Behavioral Rules` when relevant
- `## Edge Cases / Failure States` when relevant

### 2. `review-spec`
Purpose:
- reject weak specs before planning starts

Review expectations:
- `## Tier` must be present and valid
- acceptance criteria must be testable
- scope must be bounded and reviewable
- open questions must be explicit
- key behavioral constraints must be present when relevant
- implementation details must not leak into the spec
- spec size and AC count should fit the declared tier, or the reviewer should require split/addendum
- the spec must be strong enough that a planner can create a plan without inventing new behavior

### 3. `/create-plan`
Purpose:
- translate the approved spec into implementation phases

Rules:
- reference the source spec
- keep the plan as one main file
- use `## Execution Strategy`, not deep technical design
- include `## Spec Coverage` with task-level mapping from ACs to phases/tasks
- break work into clear, intent-based tasks
- keep tasks intent-based, not file-path-based
- do not introduce new product behavior, validation rules, persistence rules, fallback behavior, or visible UX behavior that is not already in the spec or explicitly approved
- defer file-level mapping and design-heavy detail to `/enrich-plan`
- hard cap: 80 lines for file mode, 24 lines for inline mode
- write to `docs/ai/plans/{feature}.md`

Expected output:
- `## Spec`
- `## Execution Strategy`
- `## Spec Coverage`
- phases
- checklist tasks
- `## Test Checklist`

### 4. `review-plan`
Purpose:
- validate execution readiness before coding begins

Review expectations:
- every acceptance criterion is covered by a real task mapping, not just a phase label
- `## Spec Coverage` must point to tasks that meaningfully support the mapped ACs
- no vague discovery-only tasks remain
- each task is small enough to complete in one focused change set
- the plan must not contain file mapping or design-heavy implementation detail that belongs in `/enrich-plan`
- no new product behavior may be introduced at the plan stage
- line caps must be respected
- inline plans may omit `## Test Checklist` when regression risk is low, but must not include placeholder-only checklist content

### 5. `/enrich-plan`
Purpose:
- map each phase to the actual files, symbols, and technical touchpoints

Rules:
- use read-only exploration
- stay within the scope already defined by the spec and plan
- do not add new product behavior during enrichment
- create per-phase detail files
- keep detail files focused on executable technical touchpoints
- target 20-60 lines per detail file; hard cap 80 lines
- append a concise enrich summary to the main plan

Expected artifacts:
- `docs/ai/plans/{feature}-phase-N-details.md`
- updated main plan with `## Enrich Summary`

### 6. `/execute-plan`
Purpose:
- implement the plan in controlled steps

Rules:
- read the relevant plan details before each phase
- avoid broad re-exploration during execution
- do not invent new product behavior during execution
- if the plan/spec is missing a required decision, stop and ask instead of guessing
- keep progress visible in the plan
- produce an implementation summary in `docs/ai/summaries/{feature}.md`

Execution expectations:
- make minimal, scoped changes
- follow project code conventions and structure rules
- validate changed behavior where practical
- mark ACs as verified only with evidence from tests or explicit human confirmation

### 7. `/verify-feature`
Purpose:
- convert the spec into a concrete verification checklist

Rules:
- verify against the original acceptance criteria
- separate automated verification from manual checks
- flag unresolved questions or partial coverage
- write to `docs/ai/verifications/{feature}.md`

## Shorter Flows

### Clear bug fix or refactor
Use:
- `/create-plan "Fix: ..."` or `/create-plan "Refactor: ..."`
- `review-plan`
- then `/execute-plan`

Guidance:
- use a single short plan
- skip spec creation when the scope is already obvious
- keep the change tightly bounded

### Small update
Use:
- `/execute-plan "inline task description"`

Guidance:
- use only for small, low-risk work
- do not create unnecessary artifacts
- keep exploration minimal and local to the change

## Sub-Agent Roles

| Role | Trigger | Responsibility |
|---|---|---|
| `review-spec` | after `/create-spec` | check whether the spec is bounded, reviewable, tier-appropriate, and planning-ready |
| `review-plan` | after `/create-plan` | check whether the plan is executable, complete, within cap, and correctly mapped to ACs |
| `Explore` | during `/enrich-plan` | identify files, symbols, dependencies, and risks per phase |

## Workflow Artifacts

| Artifact path | Produced by |
|---|---|
| `docs/ai/specs/{feature}.md` | `/create-spec` |
| `docs/ai/plans/{feature}.md` | `/create-plan` |
| `docs/ai/plans/{feature}-phase-N-details.md` | `/enrich-plan` |
| `docs/ai/summaries/{feature}.md` | `/execute-plan` |
| `docs/ai/verifications/{feature}.md` | `/verify-feature` |

## Usage Notes
- Choose the lightest workflow that still gives enough control.
- Use the full flow for new or ambiguous work.
- Use short flows only when the task is already well understood.
- If the task changes shape during execution, re-scope the workflow instead of forcing the original path.
- Keep requirement, planning, enrichment, and execution responsibilities separate: spec defines behavior, plan sequences work, enrich maps technical touchpoints, execute implements.
