---
phase: project
title: AI Workflow Build Docs
description: Guide for AI agents to read the workflow-building documents in this repository
---

# AI Workflow Build Docs

## Purpose
This folder contains only the documents needed to design, evolve, and maintain the AI agent workflow of this repository.

It is not a general project implementation guide.
It does not describe coding conventions or project structure for a real application codebase cloned from this workflow.

Read these files when the task is about workflow logic, routing, commands, artifacts, harness design, or agent behavior.

## Read Order
Use this order when the task is about building or changing the workflow system:

1. `docs/ai/project/README.md`
2. `docs/ai/project/AI_WORKFLOW_RULES.md`
3. `docs/ai/project/WORKFLOW_CODING_STANDARD.md`
4. `docs/ai/project/HARNESS_ARCHITECTURE.md` when the task touches harness design

If documents conflict, follow the more specific file for the current workflow task.

## When To Read Which File

### `docs/ai/project/AI_WORKFLOW_RULES.md`
Read when:
- designing or changing the AI agent workflow
- adding commands, skills, phases, or artifacts
- deciding whether a workflow pattern is worth keeping
- reviewing if a proposal is too complex or unnecessary

This file defines the mandatory principles that every workflow change must follow.

### `docs/ai/project/WORKFLOW_CODING_STANDARD.md`
Read when:
- implementing or updating the standard coding workflow
- deciding routing for feature, bug fix, refactor, or small update tasks
- aligning new commands with the repository's execution flow
- checking which artifact should be produced in each phase

This file defines the standard end-to-end workflow used by the agent system.

### `docs/ai/project/HARNESS_ARCHITECTURE.md`
Read when:
- designing the harness or runtime integration model
- adding policy, approval, memory, observability, or delegation behavior
- making the workflow portable across different coding-agent runtimes
- deciding architectural boundaries between content, orchestration, and runtime bindings

This file defines the target architecture direction for the harness workflow.

## Task Routing Guide

### Workflow design task
Read:
- `docs/ai/project/README.md`
- `docs/ai/project/AI_WORKFLOW_RULES.md`
- `docs/ai/project/WORKFLOW_CODING_STANDARD.md`

### Harness architecture task
Read:
- `docs/ai/project/README.md`
- `docs/ai/project/AI_WORKFLOW_RULES.md`
- `docs/ai/project/HARNESS_ARCHITECTURE.md`

### Workflow implementation task
Read:
- `docs/ai/project/README.md`
- the workflow document that defines the behavior being implemented or changed
- when touching verification flow, also read the command contracts for `/verify-feature` and `/verify-runtime`

### Workflow review task
Read:
- `docs/ai/project/README.md`
- whichever workflow document defines the expected behavior

## Agent Behavior Expectations
- Treat this folder as workflow-building documentation only.
- Do not use this folder as the coding standard for an external application project.
- Do not invent workflow phases that are not documented.
- Do not add commands, artifacts, or roles unless they satisfy the mandatory rules.
- Prefer the simplest workflow that still preserves reviewability and control.
- Keep workflow artifacts readable by humans.
- Escalate when the repository documents do not cover an ambiguous decision.

## Related Files
- `docs/ai/project/AI_WORKFLOW_RULES.md`
- `docs/ai/project/WORKFLOW_CODING_STANDARD.md`
- `docs/ai/project/HARNESS_ARCHITECTURE.md`
