---
id: FLOW-VERIFICATION-DISCREPANCY-RECONCILIATION
title: Discrepancy Reconciliation Flow
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
  - WIKI-CORE-GOVERNANCE
  - FEAT-VERIFICATION-VALIDATOR-FRESHNESS
  - TEMPLATE-DISCREPANCY-NOTE
  - OPS-CORE-KNOWN-RISKS
tags:
  - project-wiki
  - verification
  - flow
summary: Canonical flow doc for analyzing documentation mismatches without silently overwriting confirmed truth.
---

# Discrepancy Reconciliation Flow

## Trigger

A mismatch is observed between canonical docs, code, runtime behavior, or related evidence.

## Preconditions

- the relevant canonical docs have been identified
- the observed mismatch is described clearly enough to inspect
- the analyst is prepared to separate evidence from assumptions

## Main Flow

1. Read the current canonical docs for the target topic and inspect the relevant implementation behavior or evidence.
2. Compare the intended behavior in docs with the observed implementation or runtime behavior.
3. Classify the mismatch as likely stale documentation, likely code drift, or unresolved ambiguity.
4. Preserve the current canonical doc until the intended behavior is reviewed rather than silently rewriting it to match the latest observation.
5. Create a discrepancy note or review handoff that captures evidence, interpretation, and next action.
6. Route the outcome toward doc updates, implementation fixes, or human review once the intended behavior is resolved.

## Alternative Flows

- If there is no confirmed doc for the topic, record the knowledge gap first and treat the issue as missing canonical coverage.
- If the mismatch is actually a proposed change, route it toward a change request instead of a discrepancy note.

## Failure Paths

- If evidence is incomplete, keep the ambiguity explicit and do not collapse it into a false conclusion.
- If multiple docs appear to own the same topic, resolve canonical ownership before reconciling the mismatch.

## Related Docs

- [Governance](../GOVERNANCE.md)
- [Validator and Freshness](../03_features/verification/feature-validator-and-freshness.md)
- [Discrepancy Note Template](../99_templates/template_discrepancy_note.md)
- [Known Risks](../07_operations/incident_known_risks.md)

## Confirmed

- None yet. Human confirmation is still required for the flow below.

## Inferred

- Confirmed docs should stay intact until intended behavior is reviewed.
- Discrepancy handling exists to expose drift safely, not to hide it behind fast edits.

## Unknown

- The exact escalation threshold that should require immediate human review for every mismatch category.

## Open Questions

- Which mismatch classes should become validator-detected versus reviewer-detected in later phases?
