---
name: sync-spec
description: "Use when the user asks to update a spec after implementation. Reconciles the spec with the current codebase and proposes business-level deltas when needed."
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
   - Acceptance criteria
   - Key behavioral rules
   - Technical approach
   - Architecture or pattern notes
   - Open questions
3. Inspect the relevant implemented code paths
4. Compare the codebase against the current spec
5. Update the spec in place using the rules below

## Auto-Sync Allowed

You may update these sections automatically when the codebase confirms them:
- `## Technical Approach`
- `## Architecture / Pattern Notes`
- `## Agent Constraints Chosen For This Slice`
- `## Decision Log`
- Implementation constraints
- Technical clarifications
- Status wording tied to implementation shape

## Human Confirmation Required

Do NOT silently change these sections:
- `## Problem`
- `## Scope`
- `## Acceptance Criteria`
- `## Key Behavioral Rules`
- `## Out of Scope`
- Any user-visible recommendation or ranking rule that changes from transparent logic to hidden scoring, or the reverse

If the implementation no longer matches those sections:
- Do not force the code to fit the spec during sync
- Propose a spec delta
- Clearly state which section drifted
- Ask for human confirmation before applying the business-level change

## Output Rules

- Update the same spec file in `docs/ai/specs/`
- Keep the spec concise and human-readable
- Add or update `## Decision Log` when implementation introduced important durable decisions
- Preserve unresolved product questions instead of guessing

## Drift Handling

When drift is technical-only:
- Sync the spec directly

When drift changes user-visible behavior or acceptance:
- Stop before applying that part
- Report the proposed delta
- Wait for confirmation

When the spec says logic should be transparent, visible, simple, or non-hidden:
- Treat hidden weighted scoring or opaque heuristics in code as business-level drift
- Do not silently normalize that drift into the spec

## Done When

- The technical sections match the implemented codebase
- Important implementation decisions are reflected in the spec
- Business-level drift is either confirmed and applied or explicitly reported as pending
