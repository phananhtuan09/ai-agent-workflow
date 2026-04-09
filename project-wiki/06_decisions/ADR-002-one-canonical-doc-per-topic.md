---
id: ADR-002-ONE-CANONICAL-DOC-PER-TOPIC
title: One Canonical Doc per Topic
doc_type: adr
domain: architecture
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
  - FEAT-AUTHORING-DOC-LIFECYCLE-GOVERNANCE
  - FEAT-RETRIEVAL-INDEX-NAVIGATION
tags:
  - project-wiki
  - adr
  - canonical
summary: Records the rationale for requiring one canonical active document per durable topic instead of allowing overlapping active truth.
---

# ADR-002: One Canonical Doc per Topic

## Context

Without a clear ownership rule, the wiki can accumulate overlapping active docs that restate the same topic differently. That creates retrieval confusion for humans and AI agents and makes impact analysis unreliable.

## Decision

Require one canonical active doc per durable topic and use cross-links instead of competing restatements.

## Alternatives Considered

- Allow multiple active docs to describe the same topic if they serve different audiences.
- Keep a loose duplicate-tolerant model and rely on human judgment to choose the right doc each time.
- Solve overlap only through naming conventions without a canonical ownership rule.

## Trade-Offs

- This decision reduces ambiguity, but it requires authors to spend effort finding the current owner before creating a new doc.
- It encourages focused docs and cross-linking, but it can make file-splitting decisions more important.

## Consequences

- Folder indexes and related-doc links should help readers reach the canonical owner quickly.
- Duplicate active topics should be treated as a maintenance problem, not as harmless extra context.

## Related Docs

- [Governance](../GOVERNANCE.md)
- [Doc Lifecycle and Governance](../03_features/authoring/feature-doc-lifecycle-and-governance.md)
- [Index and Navigation](../03_features/retrieval/feature-index-and-navigation.md)

## Confirmed

- None yet. Human confirmation is still required for this decision.

## Inferred

- Canonical ownership makes retrieval, maintenance, and discrepancy handling more reliable.
- Cross-linking is safer than parallel duplication because it preserves one primary reference path per topic.

## Unknown

- Whether some future document families will need a more explicit ownership notation beyond current metadata and navigation.

## Open Questions

- Should future validator tooling enforce canonical uniqueness more strictly once seed content grows?
