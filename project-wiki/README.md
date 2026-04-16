---
id: WIKI-CORE-README
title: Project Wiki Home
doc_type: wiki_home
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
  - WIKI-CORE-INDEX
  - WIKI-CORE-GOVERNANCE
  - WIKI-CORE-GLOSSARY
  - ONBOARDING-CORE-PROJECT-OVERVIEW
  - ONBOARDING-CORE-HOW-TO-READ
  - REQ-CORE-BUSINESS-RULES
  - REQ-CORE-PRODUCT-SCOPE
  - OPS-CORE-RELEASE-PROCESS
  - VERIFY-CORE-TEST-STRATEGY
  - FEAT-VERIFICATION-VALIDATOR-FRESHNESS
tags:
  - project-wiki
  - onboarding
summary: Entry point for the project wiki, its scope, and the recommended documents to read next.
---

# Project Wiki

This wiki is the project memory system for this repository. It is written for both human contributors and AI agents so they can find durable project context, understand current rules, and keep future updates consistent.

## What This Wiki Covers

- Root navigation and onboarding for the wiki.
- Governance rules for creating, updating, indexing, and retiring durable docs.
- Requirement support docs for scope, quality expectations, and constraints.
- Entry points for feature, flow, system, decision, operations, and reference surfaces.
- Verification guides and a lightweight validator for metadata, links, and status integrity.
- A reusable template library for future durable docs.

## Start Here

1. [Index](INDEX.md) for the canonical map and folder entry points.
2. [Governance](GOVERNANCE.md) for the authoritative maintenance rules of this wiki.
3. [Project Overview](01_onboarding/project_overview.md) for system-level orientation.
4. [How to Read This Wiki](01_onboarding/how_to_read_this_wiki.md) for the standard read path.
5. [Business Rules](02_requirements/confirmed/business_rules.md) for the proposed canonical business-rule set.
6. [Glossary](GLOSSARY.md) for shared terminology.

Keep this file concise. Governance policy lives in [GOVERNANCE.md](GOVERNANCE.md), and deeper navigation lives in [INDEX.md](INDEX.md).

## Structure Overview

- Root docs: `README.md`, `INDEX.md`, `GOVERNANCE.md`, `GLOSSARY.md`, and `CHANGELOG.md`
- Onboarding docs under `01_onboarding/`
- Requirement docs and drafts guidance under `02_requirements/`
- Feature, flow, and decision surfaces under `03_features/`, `04_flows/`, and `06_decisions/`
- Operations and reference docs under `07_operations/` and `09_references/`
- Reusable templates under `99_templates/`

Some folders currently contain starter docs rather than rich canonical content. Use [INDEX.md](INDEX.md) for the full map and current-entry-point guidance.

## Scope Boundaries

- The core structure, seeded content, workflow assets, and minimum validator automation now exist, but later phases may still deepen coverage and optional checks.
- Claude and Codex workflow assets that operate on the wiki live outside `project-wiki/`, primarily under `.claude/commands/` and `.agents/skills/`.
- This wiki should stay usable even while some later-phase areas are still empty or planned.

## Automation Entry Points

- Claude Code command entry points live under [../.claude/commands/](../.claude/commands/), including [wiki-update.md](../.claude/commands/wiki-update.md), [wiki-add-feature.md](../.claude/commands/wiki-add-feature.md), [wiki-impact-check.md](../.claude/commands/wiki-impact-check.md), [wiki-reconcile.md](../.claude/commands/wiki-reconcile.md), and [wiki-retire-doc.md](../.claude/commands/wiki-retire-doc.md).
- Codex uses [../.agents/skills/project-wiki-maintainer/SKILL.md](../.agents/skills/project-wiki-maintainer/SKILL.md) for the same governance model.
- These automation assets operate on the wiki but are not stored inside `project-wiki/`.
- Use [07_operations/release_process.md](07_operations/release_process.md) for when to prefer these assets during repeatable maintenance work.

## How to Validate

- Run `node scripts/validate-project-wiki.mjs project-wiki` from the repository root to check parseable frontmatter, unique IDs, valid statuses, related-doc references, and internal links.
- Use [07_operations/release_process.md](07_operations/release_process.md) for the release gate and follow-up handling.
- Use [08_verification/test_strategy.md](08_verification/test_strategy.md) for the broader review cadence, pilot checks, and minimum measurements around freshness and retrieval quality.
