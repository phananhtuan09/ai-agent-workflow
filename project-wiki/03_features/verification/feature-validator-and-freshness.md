---
id: FEAT-VERIFICATION-VALIDATOR-FRESHNESS
title: Validator and Freshness
doc_type: feature_spec
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
  - REQ-CORE-NON-FUNCTIONAL
  - REQ-CORE-BUSINESS-RULES
  - FLOW-VERIFICATION-IMPACT-ANALYSIS
  - FLOW-VERIFICATION-DISCREPANCY-RECONCILIATION
tags:
  - project-wiki
  - verification
  - freshness
summary: Canonical feature doc for the wiki capability that checks document integrity, surfaces drift risks, and supports freshness review over time.
---

# Validator and Freshness

## Purpose

Define the verification capability that helps the wiki stay trustworthy by checking document integrity, highlighting drift, and keeping uncertainty visible.

## Scope

- minimum validation checks for metadata, links, and structural consistency
- freshness-review expectations for durable docs
- protection against hidden uncertainty, stale docs, and broken navigation
- a bridge from current manual checks toward later validator automation

## Out of Scope

- repository-wide build or deployment quality gates
- confirming business truth automatically

## Acceptance Criteria

- Given a contributor reviews this feature doc, when they need current verification behavior, then manual checks and future validator intent are separated clearly.
- Given a reader needs freshness expectations, when this feature doc is read, then the role of review and drift detection is explicit.
- Given a mismatch or gap is found, when this feature doc is read, then related impact-analysis and discrepancy-reconciliation flows are discoverable.

## Related Docs

- [Non-Functional Requirements](../../02_requirements/confirmed/non_functional_requirements.md)
- [Business Rules](../../02_requirements/confirmed/business_rules.md)
- [Impact Analysis Flow](../../04_flows/impact-analysis-flow.md)
- [Discrepancy Reconciliation Flow](../../04_flows/discrepancy-reconciliation-flow.md)

## Confirmed

- None yet. Human confirmation is still required for the verification behavior below.

## Inferred

### Current Minimum Capability

A validator script (`scripts/validate-project-wiki.mjs`) exists and checks metadata presence, duplicate IDs, invalid statuses, date formats, non-array related_docs, and internal link integrity. Manual documentation-driven checks (navigation review, certainty handling) complement the automated checks.

### Freshness Behavior

Durable docs should be reviewed when material project understanding changes so indexes, related links, and canonical content do not drift out of sync.

### Protection Goals

Verification exists to reduce stale docs, duplicate canonicals, hidden uncertainty, and broken retrieval paths.

### Automation Boundary

The current validator covers structural and metadata integrity. Deeper checks — such as semantic drift detection, cross-doc consistency, and freshness enforcement — remain outside the current implementation scope.

## Unknown

- The exact validator thresholds, cadence rules, or enforcement levels that future automation should require.

## Open Questions

- Which freshness signals should become mandatory once validator automation is implemented?
