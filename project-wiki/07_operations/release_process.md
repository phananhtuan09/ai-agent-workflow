---
id: OPS-CORE-RELEASE-PROCESS
title: Project Wiki Release Process
doc_type: operations
domain: operations
status: proposed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-09
source_of_truth: true
canonical: true
related_docs:
  - WIKI-CORE-GOVERNANCE
  - WIKI-CORE-CHANGELOG
  - OPS-CORE-DEPENDENCY-NOTES
  - WIKI-CORE-README
  - VERIFY-CORE-TEST-STRATEGY
  - VERIFY-CORE-IMPACT-ANALYSIS-RULES
  - VERIFY-CORE-REGRESSION-SENSITIVE-AREAS
  - VERIFY-CORE-ACCEPTANCE-CRITERIA-PATTERNS
tags:
  - project-wiki
  - operations
  - release
summary: Proposed workflow for reviewing, confirming, and publishing material changes to the project wiki.
---

# Project Wiki Release Process

## Confirmed

- None yet. Human confirmation is still required for the process below.

## Inferred

### Ready for Review

A wiki change is ready for review when:

- the target doc has clear scope and metadata
- related docs and navigation links are updated as needed
- uncertainty is explicit where the topic is not fully confirmed

### Review and Confirmation

- Human reviewers decide whether business-truth changes can move to `confirmed`.
- AI may prepare or restructure the update, but it does not approve final truth by itself.

### Release Expectations

- Material changes should update [CHANGELOG.md](../CHANGELOG.md).
- New durable docs or moved docs should update [INDEX.md](../INDEX.md) or the relevant folder entry point.
- Related docs should stay synchronized enough that readers do not have to guess the current canonical path.

### Automation Guidance

- Use [../../.claude/commands/wiki-update.md](../../.claude/commands/wiki-update.md) for targeted wiki edits that should preserve the current canonical structure.
- Use [../../.claude/commands/wiki-add-feature.md](../../.claude/commands/wiki-add-feature.md) when a new feature behavior may need its own canonical spec.
- Use [../../.claude/commands/wiki-impact-check.md](../../.claude/commands/wiki-impact-check.md) before code or logic changes that may affect documented behavior.
- Use [../../.claude/commands/wiki-reconcile.md](../../.claude/commands/wiki-reconcile.md) when implementation behavior and the wiki may have drifted apart.
- Use [../../.claude/commands/wiki-retire-doc.md](../../.claude/commands/wiki-retire-doc.md) when a durable doc must be deprecated, superseded, or archived safely.
- Use [../../.agents/skills/project-wiki-maintainer/SKILL.md](../../.agents/skills/project-wiki-maintainer/SKILL.md) when Codex is the runtime performing the maintenance task.
- These assets follow the wiki governance model; they do not replace human confirmation.

### Validator Gate

- Run `node scripts/validate-project-wiki.mjs project-wiki` from the repository root before treating a material wiki update as release-ready.
- Validation errors should block the release until the affected docs, links, or metadata are repaired.
- Validation warnings may proceed only when the maintainer records a clear follow-up and the warning does not hide canonical truth or broken retrieval.

### Freshness Review

- Review important canonical docs when related changes land, or at least once every one to two sprints if they remain critical but untouched.
- Use [../08_verification/impact_analysis_rules.md](../08_verification/impact_analysis_rules.md) before changes with a broad blast radius.
- Use [../08_verification/test_strategy.md](../08_verification/test_strategy.md) for the recommended task-based checks and measurements.

## Open Questions

- Should future rollouts require a formal review checklist before a doc can be treated as release-ready?
