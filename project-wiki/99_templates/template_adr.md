---
id: TEMPLATE-ADR
title: ADR Template
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
  - INDEX-DECISIONS-ROOT
  - WIKI-CORE-GOVERNANCE
tags:
  - project-wiki
  - templates
  - adr
summary: Reusable template for documenting one architecture decision with context, choice, trade-offs, and open questions.
---

# ADR Template

Use this template when a technical or structural decision needs durable rationale. Keep numbering aligned with [06_decisions/README.md](../06_decisions/README.md), and do not mark a decision `confirmed` without human approval.

## Copy Template

```md
---
id: ADR-001-<TOPIC>
title: <Decision Title>
doc_type: adr
domain: architecture
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
  - architecture
summary: <One-sentence summary of the decision and why it exists.>
---

# <Decision Title>

## Context

## Decision

## Alternatives Considered

- ...

## Trade-Offs

- ...

## Consequences

- ...

## Related Docs

- ...

## Confirmed

## Inferred

## Open Questions
```
