---
id: REQ-CORE-BUSINESS-RULES
title: Project Wiki Business Rules
doc_type: business_rules
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
  - WIKI-CORE-README
  - WIKI-CORE-INDEX
  - WIKI-CORE-GOVERNANCE
tags:
  - project-wiki
  - business-rules
summary: Proposed canonical business rules for how the project wiki stores and preserves durable project knowledge.
---

# Project Wiki Business Rules

This document is the intended canonical home for durable wiki-system rules. It is stored under `confirmed/` to match the long-term folder model, but the frontmatter `status` remains authoritative and still requires human confirmation.

## Confirmed

- None yet. Human confirmation is still required for the rule set below.

## Inferred

### Project Memory Rule

The wiki exists as a per-project Markdown memory system for humans and AI agents. It is not just a loose notes folder.

### Language Rule

Durable wiki content and metadata are written in English.

### Canonical Ownership Rule

One topic should have one canonical active doc. Other docs should reference that canonical doc instead of redefining the same truth.

### Source-of-Truth Rule

Docs define intended business behavior when the topic is documented and confirmed. Code defines implementation details that the docs do not explicitly specify.

### Confirmation Boundary Rule

AI may draft and update docs, but only humans may confirm final business truth.

### Visible Uncertainty Rule

When information is incomplete, docs should separate confirmed facts, inferred statements, unknowns, and open questions instead of hiding uncertainty.

### Durability Rule

Durable docs should use metadata, keep stable IDs, and preserve history through status changes rather than hard deletion.

### Maintenance Rule

Material wiki changes should update navigation and changelog surfaces so humans and AI agents can still retrieve the correct context.

## Unknown

- No additional unknowns are recorded for this MVP foundation slice.

## Open Questions

- Should future projects support a configurable wiki root path instead of a fixed `project-wiki/` location?
- Should metadata defaults include project-specific reviewer roles beyond `project-maintainer`?
