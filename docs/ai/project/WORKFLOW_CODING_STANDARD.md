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
- when to use short paths versus the full spec-driven flow

## Routing

| Task type | Standard workflow |
|---|---|
| New feature | `/create-spec` → `/create-plan` → `/enrich-plan` → `/execute-plan` → `/verify-feature` |
| Fix bug (clear) | `/create-plan "Fix: ..."` → `/execute-plan` |
| Refactor | `/create-plan "Refactor: ..."` → `/execute-plan` |
| Fix bug (ambiguous/large) | `/create-spec` → `/create-plan` → `/enrich-plan` → `/execute-plan` |
| Small update (1-2 files) | `/execute-plan "inline task"` |

## Standard Feature Flow

```text
User request
  ↓
Routing decision
  ↓
/create-spec
  ↓
review spec quality
  ↓
/create-plan
  ↓
review plan quality
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
- capture the business requirement before implementation
- keep the requirement reviewable by humans

Rules:
- focus on user value and behavior
- avoid implementation and framework details
- keep it concise
- write to `docs/ai/specs/{feature}.md`

Expected output:
- scope
- acceptance criteria
- out-of-scope section
- open questions when ambiguity remains

### 2. Spec review
Purpose:
- reject weak specs before planning starts

Review expectations:
- acceptance criteria must be testable
- open questions must be explicit
- scope must not leak implementation details
- the document must stay small enough for a human to review quickly

### 3. `/create-plan`
Purpose:
- translate the approved spec into implementation phases

Rules:
- reference the source spec
- break work into clear tasks
- keep tasks intent-based, not file-path-based
- write to `docs/ai/plans/{feature}.md`

Expected output:
- phases
- checklist tasks
- spec reference
- traceable coverage of acceptance criteria

### 4. Plan review
Purpose:
- validate execution readiness before coding begins

Review expectations:
- every acceptance criterion is covered
- no vague discovery-only tasks remain
- each task is small enough to complete in one focused change set
- the plan is readable and actionable

### 5. `/enrich-plan`
Purpose:
- map each phase to the actual files, symbols, and technical touchpoints

Rules:
- use read-only exploration
- create per-phase detail files
- append a concise enrich summary to the main plan

Expected artifacts:
- `docs/ai/plans/{feature}-phase-N-details.md`
- updated main plan with enriched context

### 6. `/execute-plan`
Purpose:
- implement the plan in controlled steps

Rules:
- read the relevant plan details before each phase
- avoid broad re-exploration during execution
- keep progress visible in the plan
- produce an implementation summary in `docs/ai/summaries/{feature}.md`

Execution expectations:
- make minimal, scoped changes
- follow project code conventions and structure rules
- validate changed behavior where practical

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
| `review-spec` | after `/create-spec` | check whether the spec is reviewable and implementation-neutral |
| `review-plan` | after `/create-plan` | check whether the plan is executable and complete |
| `Explore` | during `/enrich-plan` | identify files, symbols, and risks per phase |

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
