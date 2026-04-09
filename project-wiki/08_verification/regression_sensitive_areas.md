---
id: VERIFY-CORE-REGRESSION-SENSITIVE-AREAS
title: Regression-Sensitive Areas
doc_type: verification_guide
domain: verification
status: proposed
version: 1.0
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-09
source_of_truth: true
canonical: true
related_docs:
  - OPS-CORE-RELEASE-PROCESS
  - FEAT-VERIFICATION-VALIDATOR-FRESHNESS
  - WIKI-CORE-INDEX
  - WIKI-CORE-GOVERNANCE
  - ADR-001-DOCS-SOURCE-OF-TRUTH-BOUNDARY
  - ADR-002-ONE-CANONICAL-DOC-PER-TOPIC
  - ADR-003-VISIBLE-UNCERTAINTY
summary: Canonical map of the wiki areas where small mistakes can cause broad drift, broken retrieval, or hidden uncertainty.
---

# Regression-Sensitive Areas

## Purpose

Identify the wiki topics and surfaces where small changes can create outsized retrieval, maintenance, or trust failures.

## Confirmed

- None yet. Human confirmation is still required for the preventive guidance below.

## Inferred

### Source-of-Truth Boundary

This area is sensitive because silent mixing of intended business behavior and implementation detail can make the wiki contradict itself.

### Status Handling and Confirmation

This area is sensitive because an incorrect status can make unconfirmed content look authoritative or can hide historical context that should remain visible.

### One Canonical Doc per Topic

This area is sensitive because duplicate canonicals force readers and agents to guess which file owns the truth.

### Visible Uncertainty

This area is sensitive because hiding inferred content inside confirmed-looking prose weakens change analysis and makes review harder.

### Navigation and Link Integrity

This area is sensitive because broken links, stale indexes, or missing folder entry points raise the number of files readers must inspect before they find the right doc.

### Verification and Operations Guidance

This area is sensitive because drift in impact-analysis rules, release steps, or validator usage can let broken metadata and stale docs pass through ordinary maintenance.

## Unknown

- Which of these areas should gain stricter automated warnings after the pilot proves the minimum validator is useful.

## Open Questions

- Should future verification work rank these areas by severity or review cadence instead of keeping them as a flat list?

## Related Docs

- [Validator and Freshness](../03_features/verification/feature-validator-and-freshness.md)
- [Index](../INDEX.md)
- [Governance](../GOVERNANCE.md)
- [ADR-001 Docs Source of Truth Boundary](../06_decisions/ADR-001-docs-source-of-truth-boundary.md)
- [ADR-002 One Canonical Doc per Topic](../06_decisions/ADR-002-one-canonical-doc-per-topic.md)
- [ADR-003 Visible Uncertainty](../06_decisions/ADR-003-visible-uncertainty.md)
