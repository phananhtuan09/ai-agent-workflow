---
id: FLOW-VERIFICATION-IMPACT-ANALYSIS
title: Impact Analysis Flow
doc_type: flow_spec
domain: verification
status: proposed
version: 1.0
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: true
canonical: true
related_docs:
  - FEAT-VERIFICATION-VALIDATOR-FRESHNESS
  - REQ-CORE-BUSINESS-RULES
  - OPS-CORE-KNOWN-RISKS
  - FLOW-VERIFICATION-DISCREPANCY-RECONCILIATION
tags:
  - project-wiki
  - verification
  - flow
summary: Canonical flow doc for analyzing the document impact of a change before implementation or wiki updates proceed.
---

# Impact Analysis Flow

## Trigger

A contributor or AI agent needs to understand which docs, rules, flows, and decisions a proposed change could affect.

## Preconditions

- the target change or question is defined clearly enough to inspect
- the analyst has access to the relevant canonical docs and folder entry points
- current uncertainty is visible rather than hidden

## Main Flow

1. Define the change target, its scope, and the area of the wiki or system it touches.
2. Read the relevant business rules, feature docs, flow docs, APIs, entities, and ADRs for that area.
3. Classify the change type, such as rule change, flow change, navigation change, or documentation-drift investigation.
4. Identify regression-sensitive areas and neighboring docs that could be affected indirectly.
5. Record the required document updates, reviews, or follow-up checks needed before the change can be treated as complete.
6. If evidence is missing, record the knowledge gap explicitly instead of silently inferring the answer.

## Alternative Flows

- If the change touches only one clearly scoped doc, keep the analysis narrow but still confirm that no linked canonical doc is affected.
- If the change spans multiple document types, group the impacted docs by canonical owner so updates stay coordinated.

## Failure Paths

- If a required canonical doc does not exist, record the gap and route the need toward a new durable doc instead of guessing the missing truth.
- If the analysis exposes a code-vs-doc mismatch, hand off to discrepancy reconciliation rather than folding the mismatch into ordinary change work.

## Related Docs

- [Validator and Freshness](../03_features/verification/feature-validator-and-freshness.md)
- [Business Rules](../02_requirements/confirmed/business_rules.md)
- [Known Risks](../07_operations/incident_known_risks.md)
- [Discrepancy Reconciliation Flow](discrepancy-reconciliation-flow.md)

## Confirmed

- None yet. Human confirmation is still required for the flow below.

## Inferred

- Impact analysis should treat missing knowledge as an explicit output, not as permission to improvise a canonical answer.
- Regression-sensitive areas deserve focused review because small changes there can distort multiple dependent docs.

## Unknown

- The exact format future validator tooling will use to store or enforce impact-analysis outputs.

## Open Questions

- Which impact-analysis outputs should become required artifacts once verification automation exists?
