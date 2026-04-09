---
id: VERIFY-CORE-ACCEPTANCE-CRITERIA-PATTERNS
title: Acceptance Criteria Patterns
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
  - INDEX-FEATURES-ROOT
  - TEMPLATE-FEATURE-SPEC
  - TEMPLATE-FLOW-SPEC
  - TEMPLATE-DISCREPANCY-NOTE
summary: Canonical patterns for reviewing wiki changes against metadata, link integrity, status validity, and visible certainty expectations.
---

# Acceptance Criteria Patterns

## Purpose

Provide small, repeatable acceptance patterns that maintainers can reuse when reviewing wiki changes manually or when turning review expectations into validator checks.

## Confirmed

- None yet. Human confirmation is still required for the patterns below.

## Inferred

### Metadata Pattern

- Given a durable wiki doc is added or updated
- When the reviewer inspects frontmatter
- Then `id`, `status`, `last_updated`, `related_docs`, and `summary` should be present and parseable

### Related-Docs Pattern

- Given a doc references other docs through `related_docs`
- When the reviewer or validator checks those IDs
- Then each referenced ID should resolve to an existing wiki document unless the gap is documented explicitly

### Link Integrity Pattern

- Given a doc contains Markdown links
- When those links are resolved
- Then each internal link should lead to a real target and not force readers into guessing

### Status Validity Pattern

- Given a doc declares a status
- When the value is compared to governance
- Then the status should come from the allowed list and should not imply human confirmation unless that confirmation exists

### Visible Certainty Pattern

- Given a spec-like or review-heavy doc changes
- When certainty is incomplete
- Then confirmed, inferred, unknown, and open questions should remain visibly separated

### Navigation Pattern

- Given a material doc is added, moved, retired, or superseded
- When retrieval surfaces are reviewed
- Then `INDEX.md`, relevant folder entry points, and `CHANGELOG.md` should reflect the material change

## Unknown

- Which acceptance patterns should eventually fail the validator versus remain reviewer guidance only.

## Open Questions

- Should future template revisions embed these patterns directly into every doc type, or should they stay centralized here?

## Related Docs

- [Validator and Freshness](../03_features/verification/feature-validator-and-freshness.md)
- [Feature Specs Entry Point](../03_features/README.md)
- [Feature Spec Template](../99_templates/template_feature_spec.md)
- [Flow Spec Template](../99_templates/template_flow_spec.md)
- [Discrepancy Note Template](../99_templates/template_discrepancy_note.md)
