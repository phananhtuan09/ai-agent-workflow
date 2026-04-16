---
id: ONBOARDING-CORE-ARCHITECTURE-SUMMARY
title: Project Wiki Architecture Summary
doc_type: overview
domain: core
status: proposed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: false
canonical: false
related_docs:
  - WIKI-CORE-INDEX
  - WIKI-CORE-GOVERNANCE
  - WIKI-CORE-GLOSSARY
tags:
  - project-wiki
  - onboarding
  - architecture
summary: High-level information architecture map for the project-wiki folder and how readers should traverse it.
---

# Project Wiki Architecture Summary

## Structure Overview

The wiki is organized into a small set of document layers:

- root docs for orientation, governance, navigation, and change history
- onboarding docs for shared context and reading guidance
- requirements docs for durable scope, rules, quality expectations, and constraints
- feature, flow, and decision surfaces for domain-specific knowledge
- operations and reference docs for maintenance support
- reusable templates for future authoring

## Traversal Model

Humans and AI agents should start at [INDEX.md](../INDEX.md), confirm maintenance rules in [GOVERNANCE.md](../GOVERNANCE.md), then move into the most relevant requirement, feature, flow, or system surface for the task at hand.

## Folder Notes

- `01_onboarding/` explains what the wiki is and how to read it.
- `02_requirements/` holds durable rule and boundary documents.
- `03_features/` and `04_flows/` are the future home of canonical behavior and sequence docs.
- `06_decisions/` is reserved for ADRs.
- `07_operations/` records wiki maintenance practices and risks.
- `09_references/` curates supporting links and dependency references.
- `99_templates/` contains reusable authoring templates.

## Availability Note

Some folders currently expose starter documents instead of rich content. That is intentional: the structure is available now so later canonical docs can land without inventing navigation ad hoc.
