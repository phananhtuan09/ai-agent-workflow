---
id: ADR-003-VISIBLE-UNCERTAINTY
title: Visible Uncertainty
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
  - FEAT-VERIFICATION-VALIDATOR-FRESHNESS
  - FLOW-VERIFICATION-DISCREPANCY-RECONCILIATION
tags:
  - project-wiki
  - adr
  - uncertainty
summary: Records the rationale for separating confirmed, inferred, unknown, and open questions instead of relying on a doc-level status alone.
---

# ADR-003: Visible Uncertainty

## Context

A document can contain a mixture of approved facts, inferred interpretation, missing evidence, and unresolved questions. A single doc-level status is not enough to show that mixture safely.

## Decision

Keep uncertainty visible by separating confirmed, inferred, unknown, and open questions where the topic requires it, with a documented fallback pattern when a full section layout is too heavy.

## Alternatives Considered

- Rely only on doc-level status and avoid section-level certainty handling.
- Keep uncertainty in inline prose without consistent labels.
- Delay documentation until every detail is fully confirmed.

## Trade-Offs

- This decision adds authoring overhead, but it makes mixed-certainty docs safer to read and update.
- It improves clarity for humans and AI agents, but it requires discipline to keep sections honest over time.

## Consequences

- Important spec-like docs should expose uncertainty explicitly instead of hiding it in narrative text.
- Review and discrepancy workflows can use the certainty sections to preserve ambiguity without blocking all documentation.

## Related Docs

- [Governance](../GOVERNANCE.md)
- [Validator and Freshness](../03_features/verification/feature-validator-and-freshness.md)
- [Discrepancy Reconciliation Flow](../04_flows/discrepancy-reconciliation-flow.md)

## Confirmed

- None yet. Human confirmation is still required for this decision.

## Inferred

- Visible uncertainty is safer than silent assumption because it preserves knowledge gaps explicitly.
- Section-level certainty supports better impact analysis and safer AI-assisted maintenance.

## Unknown

- Whether any future project will need a documented override for alternative certainty section names.

## Open Questions

- Should future templates include stronger prompts or examples for keeping certainty sections updated after edits?
