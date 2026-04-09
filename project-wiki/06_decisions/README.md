---
id: INDEX-DECISIONS-ROOT
title: Architecture Decisions Index
doc_type: folder_index
domain: decisions
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
  - WIKI-CORE-GOVERNANCE
  - REQ-CORE-BUSINESS-RULES
tags:
  - project-wiki
  - decisions
  - adr
summary: Entry point for architecture decision records and their expected conventions.
---

# Architecture Decisions

Use this area for technical or structural decisions that need durable rationale.

## Create an ADR When

- a decision changes implementation direction
- multiple options were considered and trade-offs matter
- future contributors need to understand why a path was chosen

## Naming Convention

- Reserve the `ADR-001-topic-slug.md` style for future decisions.
- Keep numbering stable after the first ADR is published.

## Current State

- ADRs now exist for the source-of-truth boundary, one-canonical-doc ownership, and visible uncertainty.
- Use this README as the folder entry point, then read the specific ADR that explains the rationale for the target rule or trade-off.
