---
id: TEMPLATE-CHANGE-REQUEST
title: Change Request Template
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
  - INDEX-REQ-DRAFTS
  - WIKI-CORE-GOVERNANCE
tags:
  - project-wiki
  - templates
  - change-request
summary: Reusable template for proposing a documentation or behavior change without treating the request as confirmed truth.
---

# Change Request Template

Use this template when a change needs review before the canonical docs should be updated. A change request does not confirm truth by itself.

## Copy Template

```md
---
id: CHANGE-<DOMAIN>-<TOPIC>
title: <Change Request Title>
doc_type: change_request
domain: <domain>
status: proposed
version: 1.0
owner: ai-primary
reviewers:
  - <human-reviewer>
last_updated: YYYY-MM-DD
source_of_truth: false
canonical: false
related_docs:
  - REQ-<DOMAIN>-<TOPIC>
tags:
  - <domain>
  - change-request
summary: <One-sentence summary of the requested change and why it matters.>
---

# <Change Request Title>

## Requested Change

## Motivation

## Impacted Docs

- ...

## Risks and Trade-Offs

- ...

## Proposed Next Step

- ...

## Related Docs

- ...

## Confirmed

## Inferred

## Unknown

## Open Questions
```
