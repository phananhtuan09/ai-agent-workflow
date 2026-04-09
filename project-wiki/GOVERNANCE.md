---
id: WIKI-CORE-GOVERNANCE
title: Project Wiki Governance
doc_type: governance
domain: core
status: proposed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-09
source_of_truth: true
canonical: true
related_docs:
  - WIKI-CORE-README
  - WIKI-CORE-INDEX
  - WIKI-CORE-CHANGELOG
  - REQ-CORE-BUSINESS-RULES
tags:
  - project-wiki
  - governance
summary: Canonical governance rules for creating, updating, confirming, deprecating, and indexing project wiki documents.
---

# Project Wiki Governance

## Purpose

This document defines how project wiki docs are created, updated, confirmed, deprecated, and indexed.

## Operating Boundaries

- The wiki currently lives under `project-wiki/` at the repository root.
- Workflow assets that act on the wiki live outside `project-wiki/`, mainly under `.claude/commands/` and `.agents/skills/`.
- Business behavior belongs in [business_rules.md](02_requirements/confirmed/business_rules.md) or later canonical specs, not in this governance file.

## Confirmation Rule

- Only humans may set `status: confirmed`.
- AI may draft, edit, restructure, add links, and flag uncertainty.
- AI must not invent confirmed business truth or overwrite confirmed logic with guesses.

## Allowed Statuses

Use only these statuses:

- `draft`
- `proposed`
- `inferred`
- `confirmed`
- `deprecated`
- `superseded`
- `archived`

## Core Business Rules

The source-of-truth and canonical-ownership rules that govern wiki content are defined in [business_rules.md](02_requirements/confirmed/business_rules.md). This governance file references those rules but does not redefine them.

## Certainty Rule

- Important spec-like docs must keep uncertainty visible.
- When relevant, use `Confirmed`, `Inferred`, `Unknown`, and `Open Questions` sections, or the equivalent `Knowledge Status` fallback.
- Never mix inferred content into a confirmed section.

## Metadata Rule

All durable docs must include frontmatter with at least:

- `id`
- `title`
- `doc_type`
- `domain`
- `status`
- `last_updated`
- `related_docs`
- `summary`

Recommended fields remain `version`, `owner`, `reviewers`, `tags`, `source_of_truth`, and `canonical`.

## Update Trigger Rule

Docs must be updated when:

- business logic changes
- API contracts change
- permission logic changes
- user-visible flows change
- confirmed decisions change
- the canonical doc for a topic is replaced

## Create, Update, Delete, and Rename Rules

### Create

Create a new doc only when no existing doc fits the topic or the content has become large enough to deserve a stable reference of its own.

### Update

Keep the same doc ID unless the topic identity changes, update `last_updated`, review related docs, and add a changelog entry when the change is material.

### Delete

Do not hard-delete durable docs during normal maintenance. Use `deprecated`, `superseded`, or `archived` so history stays visible.

### Rename

Renaming a file for clarity is allowed. Changing the doc ID is not recommended unless the topic itself fundamentally changed.

## Index and Changelog Responsibilities

- Update [INDEX.md](INDEX.md) or the relevant folder README when a durable doc is added, retired, or moved.
- Update [CHANGELOG.md](CHANGELOG.md) only for material changes, not for minor wording fixes.

## AI Editing Rule

Before writing, AI should read [README.md](README.md), [INDEX.md](INDEX.md), this governance file, and the relevant canonical docs for the target topic.

During writing, AI should preserve frontmatter, prefer updates over duplicates, mark uncertainty honestly, and avoid generic filler.

After writing, AI should update impacted index entries, add a changelog entry when needed, and flag contradictions instead of hiding them.

## Confirmed

- None yet. Human confirmation is still required for the governance rules above.

## Inferred

- The confirmation boundary, allowed statuses, metadata requirements, and update triggers reflect the intended operating model for this wiki system.
- Governance mechanics (how docs are managed) are distinct from business rules (what the wiki system does), which are owned by business_rules.md.

## Unknown

- Whether future projects will require additional allowed statuses beyond the current set.
- Whether the AI editing rule will need to evolve as retrieval automation replaces manual index reads.

## Open Questions

- Should governance itself require a human-confirmed version before AI agents treat it as authoritative?
