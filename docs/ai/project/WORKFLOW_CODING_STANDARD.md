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
- spec sync rules
- when to use the standard spec-driven flow versus short execution paths

## Routing

| Task type | Standard workflow |
|---|---|
| New feature | `/spec` → `/execute-spec` → `/sync-spec` → `/verify-feature` |
| Fix bug (user-visible or business-impacting) | `/spec` → `/execute-spec` → `/sync-spec` → `/verify-feature` |
| Refactor | `/execute-task "Refactor: ..."` |
| Small update (1-2 files) | `/execute-task "..."` |

## Standard Spec-Driven Flow

```text
User request
  ↓
Routing decision
  ↓
/spec
  ↓
/execute-spec
  ↓
human feedback / iterative fixes as needed
  ↓
/sync-spec
  ↓
/verify-feature
```

## Phase Rules

### 1. `/spec`
Purpose:
- capture the feature intent before implementation
- keep one durable source of truth for both behavior and technical direction
- make later execution and verification consistent with the same artifact

Rules:
- focus on user value, scope, behavior, and implementation direction
- include both behavioral constraints and technical approach
- keep technical detail at the architecture and pattern level, not file-by-file task breakdown
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
- `## Technical Approach`
- `## Architecture / Pattern Notes` when relevant
- `## Acceptance Criteria`
- `## Out of Scope`
- `## Open Questions`
- `## Key Behavioral Rules` when relevant
- `## Edge Cases / Failure States` when relevant
- `## Decision Log` when relevant

### 2. `/execute-spec`
Purpose:
- implement directly from the spec
- allow iterative code changes without promoting temporary planning artifacts into durable workflow state

Rules:
- read the source spec before making changes
- treat the spec as the source of truth, not chat history or temporary execution notes
- make code changes in focused iterations
- do not introduce new product behavior, validation rules, persistence rules, fallback behavior, or visible UX behavior that is not already in the spec or explicitly approved
- if a required decision is missing, stop and ask instead of guessing
- user feedback may trigger additional edit turns before spec sync
- execution may use temporary internal task breakdown, but it should not create durable plan artifacts by default

Execution expectations:
- make minimal, scoped changes
- follow project code conventions and structure rules
- validate changed behavior where practical
- record important implementation decisions so they can be synced back into the spec later

### 3. `/sync-spec`
Purpose:
- reconcile the durable spec with the implemented codebase state
- keep the spec useful for future updates after iterative implementation turns

Rules:
- read the current spec and inspect the relevant implemented code paths
- update technical sections of the spec to match the current implementation
- record important architecture, pattern, and constraint decisions discovered during implementation
- do not silently rewrite business intent just because the code drifted
- if business rules, acceptance criteria, scope, or visible behavior need to change, propose a spec delta and require human confirmation before applying it
- write the updated spec back to the same path in `docs/ai/specs/`

Auto-sync allowed for:
- `## Technical Approach`
- `## Architecture / Pattern Notes`
- `## Decision Log`
- implementation constraints and technical clarifications

Human confirmation required for:
- `## Problem`
- `## Scope`
- `## Acceptance Criteria`
- `## Key Behavioral Rules`
- `## Out of Scope`

### 4. `/verify-feature`
Purpose:
- verify the implemented feature against the latest synced spec

Rules:
- verify against the latest synced acceptance criteria and behavioral rules
- separate automated verification from manual checks
- flag unresolved questions or partial coverage
- write to `docs/ai/verifications/{feature}.md`

## Shorter Flows

### Refactor or very small update
Use:
- `/execute-task "..."` or `/execute-task "Refactor: ..."`

Guidance:
- use only for local, low-risk work
- skip spec creation when no durable feature knowledge is needed
- keep exploration minimal and local to the change

### Spec-driven bug fix
Use:
- `/spec` → `/execute-spec` → `/sync-spec` → `/verify-feature`

Guidance:
- use this path when the bug changes user-visible behavior, business rules, or long-term product knowledge
- keep the spec durable and sync it after code settles

## Workflow Artifacts

| Artifact path | Produced by |
|---|---|
| `docs/ai/specs/{feature}.md` | `/spec` and later updated by `/sync-spec` |
| `docs/ai/summaries/{feature}.md` | `/execute-spec` |
| `docs/ai/verifications/{feature}.md` | `/verify-feature` |

## Usage Notes
- Choose the lightest workflow that still gives enough control.
- Use the full flow for new or ambiguous work.
- Use short flows only when the task is already well understood.
- If the task changes shape during execution, re-scope the workflow instead of forcing the original path.
- Keep durable workflow knowledge in the spec; keep temporary execution reasoning out of persistent workflow artifacts unless it remains useful after implementation.
