---
id: TEMPLATE-ENTITY-SPEC
title: Entity Spec Template
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
  - INDEX-SYSTEM-DATA
  - WIKI-CORE-GLOSSARY
tags:
  - project-wiki
  - templates
  - entity-spec
summary: Reusable template for documenting one entity or state model with fields, constraints, lifecycle, and certainty sections.
---

# Entity Spec Template

Use this template when a model, entity, or state machine needs a durable data-definition reference. Keep terminology aligned with [GLOSSARY.md](../GLOSSARY.md).

## Copy Template

```md
---
id: ENTITY-<DOMAIN>-<TOPIC>
title: <Entity Title>
doc_type: entity_spec
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
summary: <One-sentence summary of the entity and why it matters.>
---

# <Entity Title>

## Purpose

## Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| ... | ... | ... | ... |

## Constraints and Invariants

- ...

## Relationships

- ...

## Lifecycle and States

- ...

## Related Docs

- ...

## Confirmed

## Inferred

## Unknown

## Open Questions
```
