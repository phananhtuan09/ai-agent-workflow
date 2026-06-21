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
- before writing the spec, classify important assumptions into:
  - confirmed
  - inferred but safe
  - needs confirmation
  - chosen to keep scope small
- if an assumption changes core business behavior, fairness logic, ranking logic, thresholds, or user-visible decision-making, it must not stay implicit
- for those assumptions, the agent must either ask the human, or write them down explicitly as slice constraints in the spec

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
- if the agent chooses a default rule only to keep scope small, label it explicitly instead of presenting it as confirmed human intent

Tier guidance:
- `Lite`: 25-39 lines, usually up to 7 ACs
- `Standard`: 40-90 lines, usually up to 12 ACs
- `Extended`: 91-140 lines, usually up to 18 ACs
- if an `Extended` spec would exceed 18 ACs or 140 lines, split it into sub-features or add a short addendum instead of bloating the main spec

Expected output:
- `## Tier`
- `## Problem`
- `## Scope`
- `## Assumption Check`
- `## Technical Approach`
- `## Architecture / Pattern Notes` when relevant
- `## Acceptance Criteria`
- `## Out of Scope`
- `## Open Questions`
- `## Key Behavioral Rules` when relevant
- `## Agent Constraints Chosen For This Slice` when relevant
- `## Edge Cases / Failure States` when relevant
- `## Decision Log` when relevant

Assumption rules:
- `## Assumption Check` should separate:
  - confirmed
  - inferred but safe
  - needs confirmation
  - chosen to keep scope small
- `## Agent Constraints Chosen For This Slice` is required when the agent had to choose a default rule to keep the slice executable without overbuilding
- examples include default fairness rules, ranking logic, tolerance thresholds, tie-breakers, or temporary simplifications such as equal split, simple priority ordering, or single-round snapshot behavior
- if no such constraints were chosen, the section may be omitted

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
- do not invent thresholds, scoring weights, ranking formulas, fairness rules, or tie-breakers in code unless they already exist in the spec or are explicitly recorded as agent-chosen slice constraints
- if execution requires choosing such a rule to complete the slice safely, record it for sync back into the spec instead of leaving it implicit in code

Execution expectations:
- make minimal, scoped changes
- follow project code conventions and structure rules
- validate changed behavior where practical
- record important implementation decisions so they can be synced back into the spec later
- write a concise execution summary to `docs/ai/summaries/{feature}.md`

Required summary sections:
- `## Done`
- `## Not Done / Blocked`
- `## Decisions`
- `## Verified`
- `## Not Verified`

Summary rules:
- `## Verified` may include only checks that were actually executed during implementation
- `## Not Verified` must contain pending checks, manual-only checks, or checks intentionally deferred to verification
- do not mark an acceptance criterion as verified in both sections
- if later verification changes the confidence level, the verification artifact is the source of truth
- the summary is an execution handoff artifact, not the final verification artifact

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
- `## Agent Constraints Chosen For This Slice`
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
- if `docs/ai/verifications/{feature}.md` already exists, read it first and preserve still-valid sections instead of rewriting blindly
- verify against the latest synced acceptance criteria and behavioral rules
- map acceptance criteria to implementation surfaces before judging coverage
- run only the relevant implementation checks for the changed feature
- separate executed checks, failures, coverage gaps, and runtime follow-ups
- do not modify code, write new tests, or sync the spec during verification
- flag unresolved questions, blocked checks, or partial coverage explicitly
- write to `docs/ai/verifications/{feature}.md`
- do not include runtime-only evidence in this phase; leave runtime behavior to `/verify-runtime`

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

Section intent:
- `## Sources`: latest synced spec, relevant code paths, existing verification artifact if present
- `## Implementation Surfaces`: files, components, routes, scripts, or other concrete surfaces mapped to ACs
- `## Executed Checks`: only checks actually run in this phase, with command or inspection method
- `## Passed`: ACs or checks supported by executed evidence
- `## Failed`: ACs or checks that failed, with concrete reason
- `## Coverage Gaps`: ACs or behaviors not proven yet
- `## Needs Runtime Verification`: observable behaviors that still need browser/manual/runtime proof
- `## Final Status`: one of `Pass`, `Partial`, `Fail`, `Blocked`

Status rules:
- `Pass`: all implementation-level checks needed for this phase passed and no material coverage gaps remain
- `Partial`: some checks passed but meaningful coverage gaps or deferred runtime proof remain
- `Fail`: at least one required implementation-level check failed
- `Blocked`: the phase could not complete because required inputs, environment, or artifacts were unavailable

Overwrite rules:
- `/verify-feature` may update the implementation-level sections above
- `/verify-feature` must not delete valid runtime sections that were previously appended by `/verify-runtime`
- when older content conflicts with current evidence, replace only the conflicting section and note the reason in `## Executed Checks` or `## Failed`

### 8. `/verify-runtime`
Purpose:
- verify runtime behavior against the latest synced spec after implementation verification is complete

Rules:
- read the latest synced spec and the current verification artifact before runtime checks
- if the verification file does not exist yet, stop and recommend running `/verify-feature` first
- if the verification file already exists from another session, append or update runtime sections in place instead of recreating the file from scratch
- classify acceptance criteria as automatically verifiable, manual-only, or blocked before execution
- verify only observable runtime behavior; do not infer hidden system behavior without evidence
- record evidence and a status for each acceptance criterion checked at runtime
- do not modify code, sync the spec, or repair failures during runtime verification
- append or update runtime verification sections in `docs/ai/verifications/{feature}.md`
- do not rewrite implementation-level sections produced by `/verify-feature` except to add a narrow cross-reference when runtime evidence changes the overall conclusion

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

Runtime append rules:
- `/verify-runtime` owns only the runtime sections above
- keep existing implementation-level sections intact
- if runtime evidence contradicts an earlier implementation-only pass, preserve the earlier section and record the contradiction explicitly in runtime sections

Evidence rules:
- do not claim `no overflow`, `responsive`, `works on mobile`, or similar layout outcomes from CSS declarations alone when runtime measurement is available
- prefer concrete evidence such as viewport dimensions, DOM counts, visible text, screenshots, console output, `scrollWidth/clientWidth`, or browser-evaluated state
- when a claim cannot be proven in the current environment, mark it `Partial`, `Blocked`, or `Not automatically verifiable` instead of upgrading it to `Pass`

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
| `docs/ai/summaries/{feature}.md` | `/execute-spec` as an execution handoff summary, not final proof |
| `docs/ai/verifications/{feature}.md` | `/verify-feature` and later extended by `/verify-runtime` |

## Usage Notes
- Choose the lightest workflow that still gives enough control.
- `Shape` and `Recon` exist to protect spec quality, not to create extra ceremony.
- Let the human control step entry; let the agent enforce the gate conditions inside the chosen step.
- If the task changes shape during execution, re-scope the workflow instead of forcing the original path.
- Keep durable workflow knowledge in the spec; keep temporary execution reasoning out of persistent workflow artifacts unless it remains useful after implementation.
