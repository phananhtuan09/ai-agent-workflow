---
id: INDEX-FLOWS-ROOT
title: Flow Specs Index
doc_type: folder_index
domain: flows
status: proposed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: false
canonical: false
related_docs:
  - WIKI-CORE-INDEX
  - INDEX-FEATURES-ROOT
  - WIKI-CORE-GOVERNANCE
tags:
  - project-wiki
  - flows
summary: Entry point for canonical flow specifications and sequence-based logic.
---

# Flow Specs

Use this area for sequence logic that spans steps, branches, and failure paths.

## What Belongs Here

- ordered user or system flows
- branching paths
- failure handling
- lifecycle and transition rules

## Relationship to Feature Specs

- Feature specs describe behavior and scope.
- Flow specs describe the order of events and key transitions.
- When both exist, each doc should link to the other instead of duplicating content.

## Current State

- Canonical flow specs now exist for authoring, impact analysis, and discrepancy reconciliation.
- Use this README as the folder entry point, then read the flow doc that matches the target activity.
