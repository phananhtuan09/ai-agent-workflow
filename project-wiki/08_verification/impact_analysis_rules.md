---
id: VERIFY-CORE-IMPACT-ANALYSIS-RULES
title: Impact Analysis Rules
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
  - VERIFY-CORE-TEST-STRATEGY
  - OPS-CORE-RELEASE-PROCESS
  - FLOW-VERIFICATION-IMPACT-ANALYSIS
  - FEAT-VERIFICATION-VALIDATOR-FRESHNESS
  - REQ-CORE-BUSINESS-RULES
  - WIKI-CORE-GOVERNANCE
summary: Canonical checklist and guidance for analyzing the wiki impact of a proposed change before implementation or document updates proceed.
---

# Impact Analysis Rules

## Purpose

Define the minimum questions and outputs maintainers must use before changing code or wiki docs that may affect canonical project knowledge.

## Confirmed

- None yet. Human confirmation is still required for the checklist and guidance below.

## Inferred

### Core Questions

Before a change proceeds, the maintainer should ask:

- What business rule or canonical topic is changing?
- Which feature, flow, API, entity, operation, or ADR docs could be affected directly?
- Which neighboring docs could become stale even if they are not edited now?
- Which parts of the wiki remain uncertain and must stay marked as such?

### Required Review Surfaces

Check the relevant:

- business rules
- feature specs
- flow specs
- APIs or data docs when contracts are involved
- ADRs when the change touches rationale or structural trade-offs
- operations or verification docs when the change alters maintenance behavior

### Required Outputs

An impact analysis should produce:

- the impacted canonical docs
- the type of change, such as additive, modifying, or behavior-breaking
- regression-sensitive areas that need focused review
- the docs that must be updated if the change is accepted
- explicit knowledge gaps if the wiki does not contain enough evidence

### Missing Context Handling

If a required canonical doc is missing, record the gap explicitly instead of inferring hidden truth. The next action may be a new durable doc, a discrepancy note, or human review.

## Unknown

- Which impact-analysis outputs should become mandatory machine-readable artifacts in a later validator milestone.

## Open Questions

- Should future rollouts require a fixed template for impact-analysis output beyond the checklist in this doc?

## Related Docs

- [Impact Analysis Flow](../04_flows/impact-analysis-flow.md)
- [Validator and Freshness](../03_features/verification/feature-validator-and-freshness.md)
- [Business Rules](../02_requirements/confirmed/business_rules.md)
- [Governance](../GOVERNANCE.md)
