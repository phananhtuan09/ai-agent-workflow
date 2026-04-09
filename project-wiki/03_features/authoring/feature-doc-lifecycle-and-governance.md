---
id: FEAT-AUTHORING-DOC-LIFECYCLE-GOVERNANCE
title: Doc Lifecycle and Governance
doc_type: feature_spec
domain: authoring
status: proposed
version: 1.0
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: true
canonical: true
related_docs:
  - WIKI-CORE-GOVERNANCE
  - FLOW-AUTHORING-DOC-CREATE-OR-UPDATE
  - FLOW-VERIFICATION-DISCREPANCY-RECONCILIATION
  - TEMPLATE-CHANGE-REQUEST
tags:
  - project-wiki
  - authoring
  - lifecycle
summary: Canonical feature doc for how durable wiki docs are created, updated, reviewed, renamed, retired, and kept within canonical boundaries.
---

# Doc Lifecycle and Governance

## Purpose

Define the expected lifecycle behavior for durable wiki docs so authors can extend the wiki without creating duplicate truth or erasing history.

## Scope

- creating new docs only when an existing doc does not fit the topic
- updating existing docs while preserving IDs and related links where possible
- renaming or retiring docs without losing traceability
- using review and confirmation boundaries correctly

## Out of Scope

- detailed step ordering for individual authoring tasks
- automatic resolution of code and docs mismatches
- project-specific approval workflows that have not been documented yet

## Acceptance Criteria

- Given an author wants to add knowledge, when the topic already has a suitable canonical doc, then the expected behavior is to update it instead of creating a duplicate.
- Given a doc changes materially, when the lifecycle is followed, then indexes and changelog surfaces are updated as needed.
- Given a doc is no longer current, when lifecycle rules are applied, then status-based retirement preserves history instead of hard deletion.

## Related Docs

- [Governance](../../GOVERNANCE.md)
- [Doc Create or Update Flow](../../04_flows/doc-create-or-update-flow.md)
- [Discrepancy Reconciliation Flow](../../04_flows/discrepancy-reconciliation-flow.md)
- [Change Request Template](../../99_templates/template_change_request.md)

## Confirmed

- None yet. Human confirmation is still required for the lifecycle behavior below.

## Inferred

### Create Behavior

Authors should create a new durable doc only when the topic needs a stable reference of its own and no existing canonical doc already owns it.

### Update Behavior

Authors should preserve the doc identity where possible, update `last_updated`, and review related docs when the topic changes materially.

### Rename and Retire Behavior

Renames are allowed for clarity, but history should remain traceable. Retirement should use status transitions such as `deprecated`, `superseded`, or `archived` instead of silent removal.

### Governance Interaction

Lifecycle behavior depends on canonical boundaries, allowed statuses, certainty handling, and the human-only confirmation rule defined in governance.

## Unknown

- Whether future projects will require a formal review checklist before a lifecycle change can be considered complete.

## Open Questions

- Should a future validator gate become a required lifecycle step before certain durable docs can move closer to confirmation?
