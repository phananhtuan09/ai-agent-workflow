---
name: sync-spec
description: Use when the user asks to update a spec after implementation. Reconciles the spec with the current codebase and proposes business-level deltas when needed.
---

# Sync Spec

Update an existing spec so it matches the implemented codebase state.

## Input

Path to spec file (e.g. `docs/ai/specs/{feature-name}.md`)

## Goal

Keep the spec as the durable source of truth after implementation and feedback-driven code changes.

## Process

1. Read the current spec completely
2. Identify:
   - acceptance criteria
   - execution contract and approved design decisions
   - behavioral requirements
   - current system evidence
   - detailed technical design and file-level change map
   - state, data, interfaces, validation, security, compatibility, and implementation sequence
   - verification matrix
   - open questions
3. Inspect the relevant implemented code paths
4. Compare the codebase against the current spec
5. Update the spec in place using the rules below

## Auto-Sync Allowed

You may update these sections automatically when the codebase confirms them:
- `## Current System Evidence`
- `## State / Data / Interface Changes`
- `## Detailed Technical Design`
- `## File-Level Change Map`
- `## Validation / Error / Edge Cases`
- `## Security / Permission Considerations`
- `## Compatibility / Migration`
- `## Implementation Sequence`
- `## Verification Matrix`
- `### Agent-Chosen Technical Details`
- `## Decision Log`
- implementation constraints
- technical clarifications
- status wording tied to implementation shape

## Human Confirmation Required

Do NOT silently change these sections:
- `## Execution Contract`
- `## Problem`
- `## Scope`
- `## Acceptance Criteria`
- `## Approved Design Decisions`
- `## Behavioral Requirements`
- `## Out of Scope`
- any user-visible recommendation or ranking rule that changes from transparent logic to hidden scoring, or the reverse

If the implementation no longer matches those sections:
- do not force the code to fit the spec during sync
- propose a spec delta
- clearly state which section drifted
- ask for human confirmation before applying the business-level change

## Output Rules

- Update the same spec file in `docs/ai/specs/`
- Keep the spec structured, traceable, and free of repetition that adds no execution value
- Add or update `## Decision Log` when implementation introduced important durable decisions
- Preserve unresolved product questions instead of guessing

## Drift Handling

When drift is technical-only:
- sync the spec directly

When drift changes user-visible behavior or acceptance:
- stop before applying that part
- report the proposed delta
- wait for confirmation

When the spec says logic should be transparent, visible, simple, or non-hidden:
- treat hidden weighted scoring or opaque heuristics in code as business-level drift
- do not silently normalize that drift into the spec

## Done When

- the technical sections match the implemented codebase
- important implementation decisions are reflected in the spec
- business-level drift is either confirmed and applied or explicitly reported as pending

## Orchestrator Contract

When this skill is run under `/orchestrator`, append exactly one HTML comment as the final output line:

- Sync completed without business-level drift blocking progress:
  `<!-- orchestrator: outcome=continue provides=spec_synced -->`
- Business-level drift needs human confirmation before continuing:
  `<!-- orchestrator: outcome=stop-drift -->`

Rules:
- Emit the comment only after the main human-readable response is complete
- Use `stop-drift` whenever sync cannot safely finish without changing business intent
- If this skill runs standalone, the comment is optional
