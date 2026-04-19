---
id: INDEX-FEATURES-ROOT
title: Feature Specs Index
doc_type: folder_index
domain: features
status: confirmed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: false
canonical: false
related_docs:
  - WIKI-CORE-INDEX
  - REQ-CORE-BUSINESS-RULES
  - WIKI-CORE-GOVERNANCE
tags:
  - project-wiki
  - features
summary: Entry point for canonical feature specifications and their expected scope.
---

# Feature Specs

Use this area for one feature per document.

## What Belongs Here

- feature behavior
- feature scope
- acceptance criteria
- feature-specific business logic
- links to related flows, APIs, entities, and decisions

## What Does Not Belong Here

- reusable cross-feature rules that belong in [business_rules.md](../02_requirements/confirmed/business_rules.md)
- sequence logic that belongs in [04_flows/README.md](../04_flows/README.md)
- architectural trade-offs that belong in [06_decisions/README.md](../06_decisions/README.md)

## Current State

- Canonical feature specs now exist for the core, authoring, retrieval, and verification areas of the wiki system.
- Domain folders currently in use:
  - `core/`
  - `authoring/`
  - `retrieval/`
  - `verification/`
- Use this README as the folder entry point, then follow the real feature docs for topic-specific behavior.
