---
phase: project
title: AI Workflow Rules
description: Mandatory rules for designing and evolving the AI agent workflow in this repository
---

# AI Workflow Rules

## Purpose
These rules are mandatory when building, changing, or reviewing the AI agent workflow in this repository.

They exist to keep the workflow:
- simple
- reviewable
- useful in real work
- clear about human versus agent responsibility

## Mandatory Rules

### 1. Optimize for real value
Only introduce a workflow pattern if it clearly improves output quality, safety, or total execution efficiency.

Do not add:
- extra phases with no measurable benefit
- agent coordination that produces the same result as a simpler flow
- artifacts that are created but rarely used

Rule of thumb:
- if a simpler design achieves the same outcome, choose the simpler design

### 2. Keep every step human-readable
Every workflow step must be understandable by a human reviewer.

Each phase should make clear:
- what input it consumes
- what output it produces
- what decision it enables next

Artifacts should stay concise enough to review quickly without extra tooling.

### 3. Add only patterns proven by real usage
Do not promote a command, skill, artifact, or sub-agent into the standard workflow until it has shown practical value in repeated real tasks.

Avoid:
- speculative abstractions
- framework-like workflow layers that nobody uses
- command proliferation without clear ownership

A pattern belongs in the workflow only when it improves actual execution, not when it merely sounds complete.

### 4. Separate human judgment from agent verification
The workflow must clearly distinguish between:
- what the agent has actually checked
- what still requires human review or business judgment

Never present human-only validation as if it were already verified by the agent.

Examples of human-owned checks:
- UX quality in the real interface
- product correctness where requirements remain subjective
- risk acceptance for destructive or high-impact changes

Examples of agent-owned checks:
- artifact completeness
- scope traceability
- targeted code edits
- automated validation that was actually run

## Design Implications
When proposing workflow changes, confirm that the design:
- reduces confusion instead of adding ceremony
- produces artifacts that downstream phases really consume
- preserves clear handoffs between planning, execution, and verification
- makes limitations visible instead of hiding them

## Rejection Heuristics
A workflow change should usually be rejected if:
- it adds a new artifact with no regular reader
- it duplicates information already present elsewhere
- it exists mainly to look systematic
- it depends on heavy prompt complexity instead of clear contracts
- it blurs the line between verified facts and assumptions

## Preferred Direction
The repository should evolve toward a workflow that is:
- lightweight for small work
- structured for medium and large work
- explicit about approvals, constraints, and outputs
- portable across coding-agent runtimes where practical

## Related Documents
- `docs/ai/project/WORKFLOW_CODING_STANDARD.md`
- `docs/ai/project/README.md`
