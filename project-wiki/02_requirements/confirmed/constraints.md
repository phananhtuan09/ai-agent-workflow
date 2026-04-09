---
id: REQ-CORE-CONSTRAINTS
title: Project Wiki Constraints
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
  - WIKI-CORE-README
  - REQ-CORE-PRODUCT-SCOPE
tags:
  - project-wiki
  - constraints
summary: Proposed durable constraints that govern how the project wiki is stored, maintained, and confirmed.
---

# Project Wiki Constraints

## Confirmed

- None yet. Human confirmation is still required for the constraint set below.

## Inferred

### Content Constraints

- The wiki uses Markdown documents rather than binary or hidden placeholder files.
- Durable content and metadata are written in English.

### Confirmation Constraints

- Human reviewers are required for final business-truth confirmation.
- AI may draft and update docs but may not self-confirm business truth.

### Placement Constraints

- The wiki currently lives under `project-wiki/` at the repository root.
- Workflow assets that act on the wiki are maintained outside `project-wiki/`.

### Lifecycle Constraints

- Durable history should be preserved through status transitions such as `deprecated`, `superseded`, or `archived`.
- Relative navigation and related-doc references should remain intact as the structure grows.

## Unknown

- No additional repository-level storage constraint is locked beyond the current root placement.

## Open Questions

- Should future projects permit a configurable wiki root path while keeping the same document model?
