---
phase: project
title: Workflow Coding Standard
description: Standard coding workflow for shaping, spec creation, execution, sync, and verification in this repository
---

# Workflow Coding Standard

## Purpose
This document defines the standard coding workflow that AI agents should follow when handling work in this repository.

It covers:
- task routing
- the pre-spec gate
- required delivery phases
- human-controlled step execution
- expected artifacts
- spec sync rules
- when to use the standard flow versus shorter execution paths

The workflow is designed to prevent four common failures:
- the agent makes unconfirmed assumptions
- the spec does not match the real codebase
- large features enter implementation without being sliced first
- the agent claims feature completion without implementation and runtime evidence

## Core Rule
Before writing a spec, the agent must run a lightweight pre-spec gate:
1. `Shape`
2. `Recon`
3. `Decide`

These steps are usually ephemeral notes in chat, not durable files.

## Routing

| Task type | Standard workflow |
|---|---|
| New feature | `Shape` → `Recon` → `Decide` → `/spec` → `/execute-spec` → `/sync-spec` → `/verify-feature` → `/verify-runtime` |
| Fix bug (user-visible or business-impacting) | `Shape` → `Recon` → `Decide` → `/spec` → `/execute-spec` → `/sync-spec` → `/verify-feature` → `/verify-runtime` |
| Refactor | `/execute-task "Refactor: ..."` |
| Small update (1-2 files) | `/execute-task "..."` |

Rule:
- the human decides which step to run
- the agent does not choose a mode
- if the human starts at `/spec`, the agent must still do a lightweight `Shape` + `Recon` + `Decide` pass before writing the spec

## Standard Flow

```text
Human intent
  ↓
Shape
  ↓
Recon
  ↓
Decide
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
  ↓
/verify-runtime
```

## Pre-Spec Gate

### 1. `Shape`
Purpose:
- clarify expected behavior before the agent commits it into a spec

Rules:
- answer these questions:
  - What does the human expect to happen?
  - What is the happy path?
  - What must not happen?
  - Does this look `Small`, `Medium`, `Large`, or `Epic`?
- keep this lightweight
- ask only focused questions when the request is materially ambiguous
- ask only what is needed to avoid guessing

Expected output:
- short shaping notes, usually not persisted

### 2. `Recon`
Purpose:
- reality-check the request against the current codebase

Rules:
- check these questions:
  - What does the codebase currently do?
  - Where is the closest existing pattern?
  - What constraints or dependencies matter?
  - Would the requested behavior conflict with the current architecture or product rules?
- this is not a full implementation plan
- keep exploration local to the relevant code paths
- surface conflicts early instead of forcing the request into the existing system

Expected output:
- short codebase notes, usually not persisted

### 3. `Decide`
Purpose:
- choose the right next move before creating a durable spec

Rules:
- make one explicit decision:
  - write the spec now
  - ask focused human questions
  - split the work into slices
  - run a spike first
  - escalate a codebase or business-rule conflict
- do not write a spec until this decision is explicit
- do not spec an unsliced epic
- if the request conflicts with the codebase or standards, surface that before spec creation

Expected output:
- one explicit decision statement

## Delivery Phases

### 4. `/spec`
Purpose:
- create the durable source of truth for the approved slice

Rules:
- write the spec only after `Shape` + `Recon` + `Decide`
- do not include assumptions that were not confirmed
- do not write one spec for a whole epic; spec only the next executable slice
- keep the spec aligned with the codebase context discovered during recon
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

### 5. `/execute-spec`
Purpose:
- implement directly from the spec
- allow iterative code changes without promoting temporary planning artifacts into durable workflow state

Rules:
- read the source spec before making changes
- treat the spec as the source of truth, not chat history or temporary execution notes
- make code changes in focused iterations
- do not introduce new product behavior, validation rules, persistence rules, fallback behavior, or visible UX behavior that is not already in the spec or explicitly approved
- if a required decision is missing, stop and ask instead of guessing
- if execution reveals that the spec is too broad or not feasible as written, go back to `Decide` before expanding scope
- user feedback may trigger additional edit turns before spec sync
- execution may use temporary internal task breakdown, but it should not create durable plan artifacts by default

Execution expectations:
- make minimal, scoped changes
- follow project code conventions and structure rules
- validate changed behavior where practical
- record important implementation decisions so they can be synced back into the spec later

### 6. `/sync-spec`
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

### 7. `/verify-feature`
Purpose:
- verify the implemented feature against the latest synced spec at the implementation level

Rules:
- verify against the latest synced acceptance criteria and behavioral rules
- map acceptance criteria to implementation surfaces before judging coverage
- run only the relevant implementation checks for the changed feature
- separate executed checks, failures, coverage gaps, and runtime follow-ups
- do not modify code, write new tests, or sync the spec during verification
- flag unresolved questions, blocked checks, or partial coverage explicitly
- write to `docs/ai/verifications/{feature}.md`

Typical checks when relevant:
- lint
- typecheck
- build
- existing unit or integration tests
- migration check or dry-run
- docker build or packaging validation

Expected output sections:
- `## Sources`
- `## Implementation Surfaces`
- `## Executed Checks`
- `## Passed`
- `## Failed`
- `## Coverage Gaps`
- `## Needs Runtime Verification`
- `## Final Status`

### 8. `/verify-runtime`
Purpose:
- verify runtime behavior against the latest synced spec after implementation verification is complete

Rules:
- read the latest synced spec and the current verification artifact before runtime checks
- classify acceptance criteria as automatically verifiable, manual-only, or blocked before execution
- verify only observable runtime behavior; do not infer hidden system behavior without evidence
- record evidence and a status for each acceptance criterion checked at runtime
- do not modify code, sync the spec, or repair failures during runtime verification
- append or update runtime verification sections in `docs/ai/verifications/{feature}.md`

Per-acceptance-criterion runtime results:
- `Pass`
- `Fail`
- `Partial`
- `Blocked`
- `Not automatically verifiable`

Final runtime status:
- `Pass`
- `Fail`
- `Partial`
- `Blocked`

Status rule:
- `Not automatically verifiable` is valid only at the acceptance-criterion level, not as the final runtime status

Expected output sections:
- `## Runtime Target`
- `## Runtime Coverage Matrix`
- `## Automated Runtime Checks`
- `## Manual Follow-ups`
- `## Evidence Summary`
- `## Runtime Status`

## Human-Controlled Execution

The workflow is not mode-based.

The human decides which step to invoke next:
- `/execute-task` for small, local work
- `/spec` when durable feature knowledge is needed
- `/execute-spec` after the spec is approved enough to build
- `/sync-spec` after implementation stabilizes
- `/verify-feature` when checking implementation readiness against the latest spec
- `/verify-runtime` when checking runtime behavior against the latest synced spec

Agent behavior rules:
- do not silently choose a larger or smaller workflow mode
- if the current step is too early or too late, say so explicitly and recommend the next step
- if a request is too broad for one spec, `Decide` must recommend slicing before `/spec`
- if feasibility is uncertain, `Decide` must recommend a spike before `/spec`

## Workflow Artifacts

| Artifact path | Produced by |
|---|---|
| `docs/ai/specs/{feature}.md` | `/spec` and later updated by `/sync-spec` |
| `docs/ai/summaries/{feature}.md` | `/execute-spec` |
| `docs/ai/verifications/{feature}.md` | `/verify-feature` and later extended by `/verify-runtime` |

## Usage Notes
- Choose the lightest workflow that still gives enough control.
- `Shape` and `Recon` exist to protect spec quality, not to create extra ceremony.
- Let the human control step entry; let the agent enforce the gate conditions inside the chosen step.
- If the task changes shape during execution, re-scope the workflow instead of forcing the original path.
- Keep durable workflow knowledge in the spec; keep temporary execution reasoning out of persistent workflow artifacts unless it remains useful after implementation.
