---
id: FEAT-CORE-WIKI-FOUNDATION
title: Project Wiki Foundation
doc_type: feature_spec
domain: core
status: proposed
version: 1.0
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: true
canonical: true
related_docs:
  - REQ-CORE-PRODUCT-SCOPE
  - REQ-CORE-BUSINESS-RULES
  - ONBOARDING-CORE-PROJECT-OVERVIEW
  - FLOW-AUTHORING-DOC-CREATE-OR-UPDATE
tags:
  - project-wiki
  - core
  - foundation
summary: Canonical feature doc for the core project-wiki capability, its target users, and the behavior boundaries of the shared project-memory system.
---

# Project Wiki Foundation

## Purpose

Define the core capability of the project wiki as a structured Markdown project-memory system for humans and AI agents.

## Scope

- provide durable project context through organized Markdown docs
- support onboarding, feature clarification, and safer change analysis
- make core rules, navigation, and canonical topic ownership discoverable
- separate wiki content from automation assets that operate on the wiki

## Out of Scope

- external workflow commands and skills themselves
- code-level implementation detail that is not part of documented intended behavior
- automatic confirmation of business truth without human review

## Acceptance Criteria

- Given a reader needs the purpose of the wiki system, when this feature doc is read, then the core capability and intended users are explicit.
- Given a contributor needs boundaries, when this feature doc is read, then in-scope and out-of-scope areas are separated clearly.
- Given an AI agent needs related context, when this feature doc is read, then it can follow links to onboarding, rules, and authoring flow docs.

## Related Docs

- [Product Scope](../../02_requirements/confirmed/product_scope.md)
- [Business Rules](../../02_requirements/confirmed/business_rules.md)
- [Project Overview](../../01_onboarding/project_overview.md)
- [Doc Create or Update Flow](../../04_flows/doc-create-or-update-flow.md)

## Confirmed

- None yet. Human confirmation is still required for the feature behavior below.

## Inferred

### Core Capability

The project wiki provides one per-project documentation system that preserves durable context in a form that both humans and AI agents can read reliably.

### Primary Users

- human contributors who need onboarding or project clarification
- AI agents that need stable context before drafting docs or changing code

### Value Delivered

- lower rediscovery cost for repeated topics
- clearer separation between confirmed truth and inferred detail
- safer change work because impacted docs and rules are easier to find

### Boundary Behavior

The wiki content lives under `project-wiki/`, while commands, skills, and related automation assets live outside that folder and are cross-linked rather than embedded as wiki content.

## Unknown

- The future depth of project-specific content that should be considered part of the core capability rather than an optional support surface.

## Open Questions

- Which parts of this foundation feature should be prioritized for human confirmation first once maintainers review the seeded set?
