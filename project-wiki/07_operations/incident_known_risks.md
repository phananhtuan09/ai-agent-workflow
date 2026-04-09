---
id: OPS-CORE-KNOWN-RISKS
title: Project Wiki Known Risks
doc_type: operations
domain: operations
status: proposed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: true
canonical: true
related_docs:
  - WIKI-CORE-GOVERNANCE
  - WIKI-CORE-CHANGELOG
  - OPS-CORE-RELEASE-PROCESS
tags:
  - project-wiki
  - operations
  - risk
summary: Proposed register of known documentation risks and failure modes that can reduce trust in the wiki.
---

# Project Wiki Known Risks

## Confirmed

- None yet. Human confirmation is still required for the risk register below.

## Inferred

| Risk | Impact | Detection Guidance | Mitigation Guidance |
|------|--------|--------------------|---------------------|
| Stale durable docs | Readers may act on outdated understanding. | Review recent material changes and compare them with linked docs. | Update affected docs and add a changelog entry when the change is material. |
| Duplicate canonical docs | Humans and AI agents may choose different sources of truth. | Look for overlapping topic ownership and conflicting summaries. | Consolidate to one canonical active doc and leave cross-links from adjacent docs. |
| Broken relative links | Navigation becomes unreliable and retrieval slows down. | Check folder entry points and root navigation after material edits. | Repair links immediately and re-check impacted docs. |
| Hidden uncertainty | Inferred behavior may be mistaken for approved truth. | Review spec-like docs for explicit certainty sections. | Separate confirmed, inferred, unknown, and open questions clearly. |
| Starter docs that appear complete | Readers may over-trust thin placeholder content. | Review current-state notes in starter surfaces. | Keep starter status explicit and seed richer canonical docs later. |

## Open Questions

- Which risks should become validator-enforced checks once the verification slice lands?
