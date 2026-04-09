---
id: ADR-001-DOCS-SOURCE-OF-TRUTH-BOUNDARY
title: Docs Source of Truth Boundary
doc_type: adr
domain: architecture
status: proposed
version: 1.0
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: true
canonical: true
related_docs:
  - WIKI-CORE-GOVERNANCE
  - REQ-CORE-BUSINESS-RULES
  - FEAT-CORE-WIKI-FOUNDATION
tags:
  - project-wiki
  - adr
  - source-of-truth
summary: Records the rationale for treating docs as the source of intended business behavior and code as the source of unspecified implementation detail.
---

# ADR-001: Docs Source of Truth Boundary

## Context

The wiki needs a stable rule for resolving ambiguity between documented intended behavior and observed implementation detail. Without a clear boundary, maintainers may silently rewrite docs to match code or ignore drift until knowledge becomes unreliable.

## Decision

Treat confirmed requirement-style docs as the source of intended business behavior, and treat code as the source of unspecified implementation detail.

## Alternatives Considered

- Treat code as the single source of truth for all questions.
- Treat docs as the source of truth for every detail, including implementation specifics.
- Allow ad hoc source selection per topic without a durable rule.

## Trade-Offs

- This decision makes intended behavior easier to preserve, but it requires maintainers to handle code-vs-doc mismatches explicitly.
- It avoids overloading docs with low-level implementation detail, but it means some questions still require code inspection.

## Consequences

- Mismatches between code and confirmed docs should be surfaced as drift or ambiguity rather than merged silently.
- The wiki can stay behavior-focused while still acknowledging that code owns unspecified technical detail.

## Related Docs

- [Governance](../GOVERNANCE.md)
- [Business Rules](../02_requirements/confirmed/business_rules.md)
- [Project Wiki Foundation](../03_features/core/feature-wiki-foundation.md)

## Confirmed

- None yet. Human confirmation is still required for this decision.

## Inferred

- The chosen boundary reduces ambiguity for future maintenance and impact analysis.
- Preserving this boundary makes discrepancy handling safer than rewriting canonical docs from observation alone.

## Unknown

- Whether future projects will need a documented override when a topic blurs business behavior and implementation detail more tightly.

## Open Questions

- Should any project-specific exception patterns be documented if this boundary proves too coarse for some domains?
