---
id: OPS-CORE-DEPENDENCY-NOTES
title: Project Wiki Dependency Notes
doc_type: operations
domain: operations
status: proposed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: true
canonical: true
related_docs:
  - OPS-CORE-RELEASE-PROCESS
  - REF-CORE-RELATED-LINKS
  - REF-CORE-EXTERNAL-DEPENDENCIES
tags:
  - project-wiki
  - operations
  - dependencies
summary: Proposed dependency notes for the human, structural, and tooling assumptions that affect wiki maintenance.
---

# Project Wiki Dependency Notes

## Confirmed

- None yet. Human confirmation is still required for the dependency notes below.

## Inferred

### Human Review Dependency

The wiki depends on human reviewers for final business-truth confirmation and for resolving intended behavior when code and docs conflict.

### Structure Dependency

The wiki depends on stable folder layout, relative links, and predictable entry points so humans and AI agents can retrieve the correct documents efficiently.

### Tooling Dependency

Later validator automation will depend on frontmatter presence, stable IDs, and link consistency. Current maintenance still depends on manual checks.

### Workflow Asset Dependency

Command and skill workflows are part of the wider system, but they live outside `project-wiki/` and should stay synchronized with the document model rather than be treated as wiki content themselves.

### Reference Dependency

Curated links and external dependency notes should stay aligned with major navigation changes so readers can follow the same stable paths from multiple entry points.

## Open Questions

- Which assumptions should become explicit validator requirements once automation is added?
