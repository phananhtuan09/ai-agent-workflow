---
id: REQ-CORE-PRODUCT-SCOPE
title: Project Wiki Product Scope
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
  - WIKI-CORE-README
  - REQ-CORE-BUSINESS-RULES
  - REQ-CORE-CONSTRAINTS
tags:
  - project-wiki
  - scope
summary: Proposed scope boundary for what the project wiki system includes now, what expands later, and what remains outside the project-wiki folder.
---

# Project Wiki Product Scope

## Confirmed

- None yet. Human confirmation is still required for the scope statements below.

## Inferred

### Pilot Scope

The current pilot scope includes:

- root wiki navigation and onboarding
- governance and changelog surfaces
- confirmed-requirements starter docs for scope, rules, quality expectations, and constraints
- folder entry points for features, flows, system docs, and decisions
- operational and reference starter docs
- reusable templates for future durable documents

### Later-Phase Expansion

Later phases are expected to add:

- seeded canonical feature, flow, and ADR content
- command and skill workflows that operate on the wiki
- verification guidance and validator automation

### Boundary Between Wiki Docs and Automation Assets

The wiki system includes supporting automation, but the automation assets themselves live outside `project-wiki/`, primarily under `.claude/commands/` and `.agents/skills/`.

### Optional Surfaces

Some document groups may stay lightweight until real project content justifies deeper coverage. Starter docs make those surfaces visible without claiming they are already complete.

## Unknown

- The long-term level of detail required for each optional support surface may still change once the system is used on real project topics.

## Open Questions

- Should future projects be allowed to store the wiki outside the repository root while keeping the same governance model?
