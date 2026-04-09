---
id: TEMPLATE-FLOW-SPEC
title: Flow Spec Template
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
  - INDEX-FLOWS-ROOT
tags:
  - project-wiki
  - templates
  - flow-spec
summary: Reusable template for documenting one flow with triggers, sequence logic, failures, and certainty handling.
---

# Flow Spec Template

Use this template for sequence logic, transitions, and failure paths. Keep the focus on behavior, not low-level implementation detail.

## Copy Template

```md
---
id: FLOW-<DOMAIN>-<TOPIC>
title: <Flow Title>
doc_type: flow_spec
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
tags:
  - <domain>
summary: <One-sentence summary of the flow, its trigger, and its main outcome.>
---

# <Flow Title>

## Trigger

## Preconditions

## Main Flow

1. ...

## Alternative Flows

- ...

## Failure Paths

- ...

## Related Docs

- ...

## Confirmed

## Inferred

## Unknown

## Open Questions
```
