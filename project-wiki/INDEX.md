---
id: WIKI-CORE-INDEX
title: Project Wiki Index
doc_type: index
domain: core
status: proposed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-09
source_of_truth: false
canonical: false
related_docs:
  - WIKI-CORE-README
  - WIKI-CORE-GOVERNANCE
  - WIKI-CORE-GLOSSARY
  - ONBOARDING-CORE-PROJECT-OVERVIEW
  - ONBOARDING-CORE-HOW-TO-READ
  - REQ-CORE-BUSINESS-RULES
  - REQ-CORE-PRODUCT-SCOPE
  - REQ-CORE-NON-FUNCTIONAL
  - REQ-CORE-CONSTRAINTS
  - INDEX-FEATURES-ROOT
  - INDEX-FLOWS-ROOT
  - INDEX-DECISIONS-ROOT
  - VERIFY-CORE-IMPACT-ANALYSIS-RULES
  - VERIFY-CORE-REGRESSION-SENSITIVE-AREAS
  - VERIFY-CORE-ACCEPTANCE-CRITERIA-PATTERNS
  - VERIFY-CORE-TEST-STRATEGY
tags:
  - project-wiki
  - navigation
summary: Top-level navigation and canonical map for the project wiki and its seeded canonical content.
---

# Project Wiki Index

Use this file as the main navigation layer for both humans and AI agents.

## Start Here

- [Project Wiki Home](README.md)
- [Governance](GOVERNANCE.md)
- [Project Overview](01_onboarding/project_overview.md)
- [How to Read This Wiki](01_onboarding/how_to_read_this_wiki.md)

## Canonical Sources

- [Business Rules](02_requirements/confirmed/business_rules.md) - proposed canonical business-rules document for this wiki system
- [Product Scope](02_requirements/confirmed/product_scope.md) - proposed scope boundary for the wiki system
- [Non-Functional Requirements](02_requirements/confirmed/non_functional_requirements.md) - proposed quality expectations for clarity, retrieval, and maintainability
- [Constraints](02_requirements/confirmed/constraints.md) - proposed durable constraints for how the wiki is stored and maintained
- [Project Wiki Foundation](03_features/core/feature-wiki-foundation.md) - proposed canonical feature doc for the core wiki capability
- [Doc Lifecycle and Governance](03_features/authoring/feature-doc-lifecycle-and-governance.md) - proposed canonical feature doc for durable-doc lifecycle behavior
- [Index and Navigation](03_features/retrieval/feature-index-and-navigation.md) - proposed canonical feature doc for retrieval behavior
- [Validator and Freshness](03_features/verification/feature-validator-and-freshness.md) - proposed canonical feature doc for verification behavior
- [Doc Create or Update Flow](04_flows/doc-create-or-update-flow.md) - proposed canonical authoring flow
- [Impact Analysis Flow](04_flows/impact-analysis-flow.md) - proposed canonical pre-change analysis flow
- [Discrepancy Reconciliation Flow](04_flows/discrepancy-reconciliation-flow.md) - proposed canonical mismatch-handling flow
- [ADR-001 Docs Source of Truth Boundary](06_decisions/ADR-001-docs-source-of-truth-boundary.md) - proposed rationale for docs-versus-code ownership
- [ADR-002 One Canonical Doc per Topic](06_decisions/ADR-002-one-canonical-doc-per-topic.md) - proposed rationale for anti-duplication ownership
- [ADR-003 Visible Uncertainty](06_decisions/ADR-003-visible-uncertainty.md) - proposed rationale for section-level certainty handling
- [Impact Analysis Rules](08_verification/impact_analysis_rules.md) - proposed canonical verification checklist for pre-change analysis
- [Regression-Sensitive Areas](08_verification/regression_sensitive_areas.md) - proposed canonical map of the wiki surfaces most vulnerable to drift
- [Acceptance Criteria Patterns](08_verification/acceptance_criteria_patterns.md) - proposed canonical acceptance patterns for validation and review
- [Verification Test Strategy](08_verification/test_strategy.md) - proposed canonical strategy for task-based checks, review cadence, and validator scope

## Read Path

1. [README.md](README.md)
2. [INDEX.md](INDEX.md)
3. [GOVERNANCE.md](GOVERNANCE.md)
4. [project_overview.md](01_onboarding/project_overview.md)
5. [business_rules.md](02_requirements/confirmed/business_rules.md)
6. Feature docs for the target domain
7. Flow docs for the affected area
8. Relevant ADRs before major changes

## By Domain

- Core wiki system
- Authoring
- Retrieval
- Verification
- Architecture decisions

## Onboarding

- [Project Overview](01_onboarding/project_overview.md)
- [How to Read This Wiki](01_onboarding/how_to_read_this_wiki.md)
- [Business Context](01_onboarding/business_context.md)
- [Architecture Summary](01_onboarding/architecture_summary.md)

## Requirements

- [Business Rules](02_requirements/confirmed/business_rules.md)
- [Product Scope](02_requirements/confirmed/product_scope.md)
- [Non-Functional Requirements](02_requirements/confirmed/non_functional_requirements.md)
- [Constraints](02_requirements/confirmed/constraints.md)

## Feature, Flow, and Decision Surfaces

- [Feature Specs Entry Point](03_features/README.md)
- [Project Wiki Foundation](03_features/core/feature-wiki-foundation.md)
- [Doc Lifecycle and Governance](03_features/authoring/feature-doc-lifecycle-and-governance.md)
- [Index and Navigation](03_features/retrieval/feature-index-and-navigation.md)
- [Validator and Freshness](03_features/verification/feature-validator-and-freshness.md)
- [Flow Specs Entry Point](04_flows/README.md)
- [Doc Create or Update Flow](04_flows/doc-create-or-update-flow.md)
- [Impact Analysis Flow](04_flows/impact-analysis-flow.md)
- [Discrepancy Reconciliation Flow](04_flows/discrepancy-reconciliation-flow.md)
- [Architecture Decisions Entry Point](06_decisions/README.md)
- [ADR-001 Docs Source of Truth Boundary](06_decisions/ADR-001-docs-source-of-truth-boundary.md)
- [ADR-002 One Canonical Doc per Topic](06_decisions/ADR-002-one-canonical-doc-per-topic.md)
- [ADR-003 Visible Uncertainty](06_decisions/ADR-003-visible-uncertainty.md)

## Operations

- [Release Process](07_operations/release_process.md)
- [Known Risks](07_operations/incident_known_risks.md)
- [Dependency Notes](07_operations/dependency_notes.md)

## Verification

- [Impact Analysis Rules](08_verification/impact_analysis_rules.md)
- [Regression-Sensitive Areas](08_verification/regression_sensitive_areas.md)
- [Acceptance Criteria Patterns](08_verification/acceptance_criteria_patterns.md)
- [Verification Test Strategy](08_verification/test_strategy.md)
- Validator command from repo root: `node scripts/validate-project-wiki.mjs project-wiki`

## References

- [External Dependencies](09_references/external_dependencies.md)
- [Third-Party Services](09_references/third_party_services.md)
- [Related Links](09_references/related_links.md)

## Template Library

- [Feature Spec Template](99_templates/template_feature_spec.md)
- [Flow Spec Template](99_templates/template_flow_spec.md)
- [API Spec Template](99_templates/template_api_spec.md)
- [Entity Spec Template](99_templates/template_entity_spec.md)
- [ADR Template](99_templates/template_adr.md)
- [Discrepancy Note Template](99_templates/template_discrepancy_note.md)
- [Change Request Template](99_templates/template_change_request.md)

## By Document Type

- Onboarding: [01_onboarding/project_overview.md](01_onboarding/project_overview.md), [01_onboarding/how_to_read_this_wiki.md](01_onboarding/how_to_read_this_wiki.md)
- Requirements: [02_requirements/confirmed/business_rules.md](02_requirements/confirmed/business_rules.md), [02_requirements/confirmed/product_scope.md](02_requirements/confirmed/product_scope.md), [02_requirements/confirmed/non_functional_requirements.md](02_requirements/confirmed/non_functional_requirements.md), [02_requirements/confirmed/constraints.md](02_requirements/confirmed/constraints.md)
- Features: [03_features/README.md](03_features/README.md), [03_features/core/feature-wiki-foundation.md](03_features/core/feature-wiki-foundation.md), [03_features/authoring/feature-doc-lifecycle-and-governance.md](03_features/authoring/feature-doc-lifecycle-and-governance.md), [03_features/retrieval/feature-index-and-navigation.md](03_features/retrieval/feature-index-and-navigation.md), [03_features/verification/feature-validator-and-freshness.md](03_features/verification/feature-validator-and-freshness.md)
- Flows: [04_flows/README.md](04_flows/README.md), [04_flows/doc-create-or-update-flow.md](04_flows/doc-create-or-update-flow.md), [04_flows/impact-analysis-flow.md](04_flows/impact-analysis-flow.md), [04_flows/discrepancy-reconciliation-flow.md](04_flows/discrepancy-reconciliation-flow.md)
- ADRs: [06_decisions/README.md](06_decisions/README.md), [06_decisions/ADR-001-docs-source-of-truth-boundary.md](06_decisions/ADR-001-docs-source-of-truth-boundary.md), [06_decisions/ADR-002-one-canonical-doc-per-topic.md](06_decisions/ADR-002-one-canonical-doc-per-topic.md), [06_decisions/ADR-003-visible-uncertainty.md](06_decisions/ADR-003-visible-uncertainty.md)
- Operations: [07_operations/release_process.md](07_operations/release_process.md), [07_operations/incident_known_risks.md](07_operations/incident_known_risks.md), [07_operations/dependency_notes.md](07_operations/dependency_notes.md)
- Verification: [08_verification/impact_analysis_rules.md](08_verification/impact_analysis_rules.md), [08_verification/regression_sensitive_areas.md](08_verification/regression_sensitive_areas.md), [08_verification/acceptance_criteria_patterns.md](08_verification/acceptance_criteria_patterns.md), [08_verification/test_strategy.md](08_verification/test_strategy.md)
- References: [09_references/external_dependencies.md](09_references/external_dependencies.md), [09_references/third_party_services.md](09_references/third_party_services.md), [09_references/related_links.md](09_references/related_links.md)
- Templates: [99_templates/template_feature_spec.md](99_templates/template_feature_spec.md), [99_templates/template_flow_spec.md](99_templates/template_flow_spec.md), [99_templates/template_api_spec.md](99_templates/template_api_spec.md), [99_templates/template_entity_spec.md](99_templates/template_entity_spec.md), [99_templates/template_adr.md](99_templates/template_adr.md), [99_templates/template_discrepancy_note.md](99_templates/template_discrepancy_note.md), [99_templates/template_change_request.md](99_templates/template_change_request.md)

## Regression-Sensitive Areas

- confirmation boundaries and status transitions
- canonical ownership of durable topics
- visible uncertainty in spec-like docs
- root navigation integrity for humans and AI agents
- template and starter-doc alignment with governance

## Notes

- Some areas currently expose starter docs instead of deep project content. That is intentional and should remain visible to readers.
- Workflow commands and skills that maintain this wiki are part of the wider system but live outside `project-wiki/`.
