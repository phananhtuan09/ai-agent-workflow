---
id: FEAT-RETRIEVAL-INDEX-NAVIGATION
title: Index and Navigation
doc_type: feature_spec
domain: retrieval
status: proposed
version: 1.0
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: true
canonical: true
related_docs:
  - WIKI-CORE-INDEX
  - ONBOARDING-CORE-HOW-TO-READ
  - WIKI-CORE-GLOSSARY
  - FLOW-VERIFICATION-IMPACT-ANALYSIS
tags:
  - project-wiki
  - retrieval
  - navigation
summary: Canonical feature doc for how the wiki makes canonical docs discoverable through the root index, folder entry points, and curated read paths.
---

# Index and Navigation

## Purpose

Define how readers find the right wiki docs quickly without depending on guesswork or a complex search layer.

## Scope

- root-level navigation through `INDEX.md`
- folder entry points through `README.md` files or starter docs
- curated read paths for onboarding and targeted analysis
- discoverability rules for canonical and support docs

## Out of Scope

- full-text search engine behavior
- ranking algorithms or automated retrieval systems
- external workflow tooling that is not stored inside the wiki

## Acceptance Criteria

- Given a reader starts from the root index, when they need a doc by type or purpose, then the correct entry point is available without guessing filenames.
- Given a folder does not yet contain deep content, when navigation is used, then a starter doc still exposes the surface clearly.
- Given a contributor needs the recommended read order, when this feature doc is read, then it links back to the onboarding read path and glossary terminology.

## Related Docs

- [Index](../../INDEX.md)
- [How to Read This Wiki](../../01_onboarding/how_to_read_this_wiki.md)
- [Glossary](../../GLOSSARY.md)
- [Impact Analysis Flow](../../04_flows/impact-analysis-flow.md)

## Confirmed

- None yet. Human confirmation is still required for the retrieval behavior below.

## Inferred

### Root Navigation Behavior

`INDEX.md` acts as the main navigation layer for both humans and AI agents and should point to real docs or real entry points.

### Discoverability Behavior

A doc is discoverable when a reader can reach it through stable root navigation, a folder entry point, related-doc links, or the standard read path without needing undocumented filename knowledge.

### Folder Entry Point Behavior

Folders that are still growing should expose a README or starter doc so the surface is visible in git and in navigation.

### Retrieval Goal

The wiki optimizes for curated reads of the most relevant small set of documents, not for an elaborate search engine in the first rollout.

## Unknown

- Whether some larger folders will eventually need additional sub-indexes beyond the current starter docs.

## Open Questions

- Which future areas, if any, should get deeper folder-level indexes once canonical content grows beyond the initial seed set?
