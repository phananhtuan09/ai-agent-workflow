---
id: REF-CORE-EXTERNAL-DEPENDENCIES
title: External Dependencies
doc_type: reference
domain: references
status: proposed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: true
canonical: true
related_docs:
  - WIKI-CORE-GLOSSARY
  - OPS-CORE-DEPENDENCY-NOTES
tags:
  - project-wiki
  - references
  - dependencies
summary: Proposed catalog of external standards and tools that the project wiki relies on conceptually or operationally.
---

# External Dependencies

## Current External References

| Dependency | Why It Matters |
|------------|----------------|
| Markdown syntax | The wiki is stored as Markdown, so authoring and rendering assumptions depend on readable Markdown structure. |
| YAML frontmatter conventions | Durable docs rely on frontmatter metadata for IDs, status, relationships, and parsing. |
| Git history | Material wiki history, replacements, and rollback context depend on version control rather than hidden edits. |

## Usage Notes

- Keep this list focused on stable external standards or tool categories that matter to the wiki model.
- Project-internal links and workflow assets belong in [related_links.md](related_links.md).

## Open Questions

- Should future validator tooling standardize one explicit Markdown or frontmatter parser assumption for the project wiki?
