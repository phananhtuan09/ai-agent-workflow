---
id: VERIFY-CORE-TEST-STRATEGY
title: Verification Test Strategy
doc_type: verification_strategy
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
  - VERIFY-CORE-IMPACT-ANALYSIS-RULES
  - VERIFY-CORE-REGRESSION-SENSITIVE-AREAS
  - VERIFY-CORE-ACCEPTANCE-CRITERIA-PATTERNS
summary: Canonical strategy for validating the wiki through repeatable review tasks, minimum measurements, and lightweight validator automation.
---

# Verification Test Strategy

## Purpose

Define how maintainers check whether the wiki remains trustworthy through a combination of real tasks, focused review, and lightweight validator automation.

## Confirmed

- None yet. Human confirmation is still required for the strategy below.

## Inferred

### Validation Layers

Use two complementary layers:

- task-based review for real change scenarios and retrieval quality
- validator automation for high-value consistency checks such as frontmatter, IDs, related-doc references, and broken links

### Recommended Task-Based Checks

Run these checks during the pilot:

1. New joiner test for common project questions.
2. AI retrieval test for canonical-source selection and uncertainty handling.
3. Drift test that compares one recent change against the wiki and implementation.
4. Uncertainty test for a partially specified topic.

### Minimum Measurements

Track at least:

- number of files read per task
- wrong-canonical selections
- stale or conflicting docs found
- update lag after a confirmed change
- tasks where the wiki reduced the need to ask humans again

### Freshness Review Cadence

Important canonical docs should be reviewed when related changes occur or at least once every one to two sprints if they remain critical but untouched.

### Validator Scope for This Slice

The minimum validator should enforce only:

- parseable frontmatter
- unique IDs
- valid statuses
- related-doc ID resolution
- internal-link integrity

## Unknown

- Which measurements should become automated once the repository adds a richer workflow runner or CI support.

## Open Questions

- Should review cadence remain process-driven, or should later metadata such as `review_cycle` and `last_reviewed` become required?

## Related Docs

- [Release Process](../07_operations/release_process.md)
- [Validator and Freshness](../03_features/verification/feature-validator-and-freshness.md)
- [Impact Analysis Rules](impact_analysis_rules.md)
- [Regression-Sensitive Areas](regression_sensitive_areas.md)
- [Acceptance Criteria Patterns](acceptance_criteria_patterns.md)
