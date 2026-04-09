---
id: REQ-CORE-NON-FUNCTIONAL
title: Project Wiki Non-Functional Requirements
doc_type: requirement
domain: core
status: proposed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: true
canonical: true
related_docs:
  - WIKI-CORE-GOVERNANCE
  - REQ-CORE-BUSINESS-RULES
  - OPS-CORE-KNOWN-RISKS
tags:
  - project-wiki
  - requirements
  - nfr
summary: Proposed quality attributes and reviewable expectations for retrieval, maintainability, clarity, and freshness in the wiki system.
---

# Project Wiki Non-Functional Requirements

## Confirmed

- None yet. Human confirmation is still required for the quality expectations below.

## Inferred

### Retrieval and Discoverability

- Readers should be able to reach core wiki docs through stable navigation instead of guessing filenames.
- Important doc groups should expose a visible entry point even before deep content exists.

### Maintainability

- Durable docs should include metadata, stable IDs, and related-doc links.
- Updates should prefer extending an existing suitable doc over creating duplicates.

### Clarity and Safety

- Important spec-like docs should make uncertainty visible instead of mixing it into confirmed statements.
- Starter docs should state when they are entry points rather than complete canonical coverage.

### Freshness

- Material changes should update indexes and changelog surfaces so navigation stays trustworthy.
- The system should preserve history through status changes rather than hard deletion.

### Reviewability

- Expectations should stay reviewable through file presence, link integrity, metadata presence, and explicit certainty sections where relevant.
- Formal verification docs and validator automation are planned for later slices; current checks remain manual and documentation-driven.

## Unknown

- No numeric review cadence is locked yet for all durable docs.

## Open Questions

- Should future validation require explicit freshness metadata such as `last_reviewed` or `review_cycle` on all durable docs?
