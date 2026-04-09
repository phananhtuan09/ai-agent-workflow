---
id: TEMPLATE-API-SPEC
title: API Spec Template
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
  - INDEX-SYSTEM-API
  - WIKI-CORE-GOVERNANCE
tags:
  - project-wiki
  - templates
  - api-spec
summary: Reusable template for documenting one API contract with validation, auth, side effects, and certainty guidance.
---

# API Spec Template

Use this template when an endpoint needs a durable contract reference. Keep global business rules in their canonical docs and document endpoint-specific behavior here.

## Copy Template

```md
---
id: API-<DOMAIN>-<TOPIC>
title: <API Title>
doc_type: api_spec
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
  - FEAT-<DOMAIN>-<TOPIC>
  - FLOW-<DOMAIN>-<TOPIC>
tags:
  - <domain>
summary: <One-sentence summary of the endpoint contract and main behavior.>
---

# <API Title>

## Endpoint Summary

- Method: `<METHOD>`
- Path: `<PATH>`
- Consumers: <who uses this endpoint>

## Request

## Validation

## Response

## Errors

## Auth and Permissions

## Side Effects

## Related Docs

- ...

## Confirmed

## Inferred

## Unknown

## Open Questions
```
