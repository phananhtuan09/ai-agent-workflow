---
id: TEMPLATE-FEATURE-SPEC
title: Feature Spec Template
doc_type: template
domain: templates
status: proposed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: false
canonical: false
related_docs:
  - WIKI-CORE-GOVERNANCE
  - WIKI-CORE-GLOSSARY
tags:
  - project-wiki
  - templates
  - feature-spec
summary: Reusable template for drafting one canonical feature specification with metadata and certainty guidance.
---

# Feature Spec Template

Use this template when one feature needs a durable behavior reference. Keep confirmation handling aligned with [GOVERNANCE.md](../GOVERNANCE.md).

## Copy Template

```md
---
id: FEAT-<DOMAIN>-<TOPIC>
title: <Feature Title>
doc_type: feature_spec
domain: <domain>
status: proposed
version: 1.0
owner: ai-primary
reviewers:
  - <human-reviewer>
last_updated: YYYY-MM-DD
source_of_truth: true
canonical: true
related_docs:
  - REQ-<DOMAIN>-<TOPIC>
tags:
  - <domain>
summary: <One-sentence summary of the feature behavior and scope.>
---

# <Feature Title>

## Purpose

## Scope

## Out of Scope

## Acceptance Criteria

- Given ...
- When ...
- Then ...

## Related Docs

- ...

## Confirmed

## Inferred

## Unknown

## Open Questions
```
