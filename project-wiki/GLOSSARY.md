---
id: WIKI-CORE-GLOSSARY
title: Project Wiki Glossary
doc_type: glossary
domain: core
status: proposed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: false
canonical: false
related_docs:
  - WIKI-CORE-GOVERNANCE
  - REQ-CORE-BUSINESS-RULES
tags:
  - project-wiki
  - glossary
summary: Shared terminology reference used across governance, templates, and seeded project-wiki documents.
---

# Project Wiki Glossary

Use this glossary as a quick terminology reference. Governance and canonical requirement docs remain the authoritative source for rule details.

## Terms

### Canonical Doc

The single active document that should be treated as the primary reference for one durable topic. See [GOVERNANCE.md](GOVERNANCE.md) for the canonical-doc rule.

### Source of Truth

The document or system that should be trusted first for a given question. For intended behavior, see confirmed requirement-style docs. For unspecified implementation detail, see code, as described in [GOVERNANCE.md](GOVERNANCE.md).

### Durable Doc

A Markdown document expected to remain useful beyond one task or one conversation. Durable docs should include frontmatter and stable links.

### Starter Doc

A lightweight document that exposes a folder surface, scope boundary, or future content shape without pretending the topic is fully documented yet.

### Draft Area

A non-canonical intake area for partial, early, or still-evolving notes before they are promoted into a more durable document.

### Proposed

Content that is structured and useful but still waiting for human confirmation before it should be treated as final business truth.

### Inferred

Content derived from existing docs, code, or patterns but not yet confirmed by a human reviewer.

### Discrepancy Note

A document used to capture a mismatch between code, docs, or observed behavior without silently rewriting the current canonical source.

### Discrepancy Reconciliation

The review flow used to analyze a mismatch safely, classify it, and route it toward a discrepancy note, a doc update, an implementation fix, or human review.

### Discoverable

A document or topic is discoverable when readers can reach it through stable navigation, related links, or entry-point docs without guessing filenames.

### Freshness Review

A review of whether durable docs still match current project understanding after a material change.

### Impact Analysis

The flow of identifying which rules, docs, flows, decisions, or gaps a proposed change could affect before making the change.

### Knowledge Gap

An explicit record that required information or canonical coverage is missing and should not be guessed silently.

### Material Change

A change significant enough to require index or changelog updates because it affects navigation, retrieval, or durable project understanding.

### Regression-Sensitive Area

An area where a small change can affect multiple dependent docs, rules, or behaviors and therefore deserves focused review.

### Source of Truth Boundary

The documented division of responsibility between confirmed docs that define intended behavior and code that defines unspecified implementation detail.
