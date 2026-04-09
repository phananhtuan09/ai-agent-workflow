---
id: TEMPLATE-DISCREPANCY-NOTE
title: Discrepancy Note Template
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
  - OPS-CORE-KNOWN-RISKS
tags:
  - project-wiki
  - templates
  - discrepancy
summary: Reusable template for recording a documented mismatch between sources without silently rewriting canonical truth.
---

# Discrepancy Note Template

Use this template when code, docs, or observed behavior do not line up and the mismatch needs explicit triage.

## Copy Template

```md
---
id: NOTE-<DOMAIN>-<TOPIC>-DISCREPANCY
title: <Discrepancy Title>
doc_type: discrepancy_note
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
  - FEAT-<DOMAIN>-<TOPIC>
tags:
  - <domain>
  - discrepancy
summary: <One-sentence summary of the mismatch and why review is needed.>
---

# <Discrepancy Title>

## Mismatch Summary

## Reviewed Docs

- ...

## Reviewed Code or Runtime Evidence

- ...

## Interpretations

- ...

## Suggested Next Action

- ...

## Related Docs

- ...

## Confirmed

## Inferred

## Unknown

## Open Questions
```
