---
id: FLOW-AUTHORING-DOC-CREATE-OR-UPDATE
title: Doc Create or Update Flow
doc_type: flow_spec
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
  - FEAT-AUTHORING-DOC-LIFECYCLE-GOVERNANCE
  - FEAT-RETRIEVAL-INDEX-NAVIGATION
  - WIKI-CORE-GOVERNANCE
  - TEMPLATE-CHANGE-REQUEST
tags:
  - project-wiki
  - authoring
  - flow
summary: Canonical flow doc for safely creating or updating a wiki document while preserving canonical ownership, navigation integrity, and review handoff.
---

# Doc Create or Update Flow

## Trigger

A contributor or AI agent needs to add new durable knowledge or revise an existing wiki topic.

## Preconditions

- the author has read the relevant root docs and topic docs
- the target topic has been checked for an existing canonical owner
- the intended change is understood well enough to decide whether it belongs in a durable doc

## Main Flow

1. Start from the relevant canonical docs, folder entry points, and related-doc links.
2. Determine whether an existing doc already owns the topic.
3. If a suitable canonical doc exists, update that doc instead of creating a duplicate.
4. If no suitable durable doc exists, choose the correct folder and create a new doc with metadata and related links.
5. Keep certainty explicit by separating confirmed, inferred, unknown, and open questions where needed.
6. Review impacted docs for cross-links, canonical references, and naming consistency.
7. Update index or folder navigation when the new or changed doc should be discoverable.
8. Add a changelog entry when the change is material and hand the result off for human review if confirmation is needed.

## Alternative Flows

- If the topic is not yet stable enough for a durable doc, capture it first in the drafts area or a change request instead of forcing canonical placement.
- If the change only clarifies an existing doc, update the current doc and avoid creating a new file.

## Failure Paths

- If an author cannot identify the canonical topic owner, record the ambiguity and resolve ownership before creating a new durable doc.
- If related docs would become inconsistent after the change, pause and update the affected navigation or references before calling the work complete.
- If the content would overwrite confirmed truth with guesswork, stop and route the issue to review instead of publishing it as if it were settled.

## Related Docs

- [Doc Lifecycle and Governance](../03_features/authoring/feature-doc-lifecycle-and-governance.md)
- [Index and Navigation](../03_features/retrieval/feature-index-and-navigation.md)
- [Governance](../GOVERNANCE.md)
- [Change Request Template](../99_templates/template_change_request.md)

## Confirmed

- None yet. Human confirmation is still required for the flow below.

## Inferred

- The safest default is to update an existing suitable doc before creating a new one.
- Navigation and changelog updates are part of completion for material knowledge changes, not optional cleanup.

## Unknown

- Whether future tooling will add stricter automation checkpoints before this flow can be considered complete.

## Open Questions

- Should some doc types require mandatory human review before they are visible from root navigation?
