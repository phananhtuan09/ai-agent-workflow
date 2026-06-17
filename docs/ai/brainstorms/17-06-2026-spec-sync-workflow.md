---
phase: brainstorm
title: Spec Sync Workflow
description: Lean workflow proposal that keeps spec as the single durable source of truth and replaces plan artifacts with a spec sync step
---

# Spec Sync Workflow

## Problem
The current workflow creates too many intermediate artifacts:
- spec
- plan
- plan review
- enrich details

In practice, these artifacts add ceremony without enough durable value.
The main failure patterns observed are:
- execution follows plan details more than the original spec
- plan artifacts become stale after a few implementation turns
- humans still need to adjust behavior expectations during execution
- only the spec remains useful later when the feature is revisited

## Core Decision
Adopt a leaner workflow with one durable primary artifact:
- `spec`

Replace plan and enrich artifacts with a post-implementation reconciliation step:
- `sync-spec`

## Proposed Standard Flow

```text
/spec
  ↓
/execute-spec
  ↓
human feedback / iterative code fixes
  ↓
/sync-spec
  ↓
/verify-feature
```

## Why Keep Only Spec

### 1. Single source of truth
Execution should always be grounded in the spec, not in a derivative plan artifact.

### 2. Durable artifact value
Specs remain useful for:
- future updates
- feature understanding
- verification
- onboarding

Plans and phase-details usually do not.

### 3. Real implementation is iterative
Even with a strong spec, implementation often changes through:
- human feedback
- newly discovered project constraints
- architecture fit issues
- clarified business expectations

This is normal and should be supported directly.

## Role of `sync-spec`
`sync-spec` is the workflow step that reconciles the spec with the final codebase state.

It exists because implementation can evolve over multiple turns before the final shape is clear.

`sync-spec` should:
- read the current spec
- inspect the implemented code paths
- update technical sections of the spec
- record important implementation decisions
- surface business-level drift as proposed deltas instead of silently rewriting product intent

## Update Rules

### Auto-sync allowed
The agent may update:
- technical approach
- architecture or pattern notes
- implementation constraints
- decision log
- status notes

### Human confirmation required
The agent must not silently change:
- problem statement
- scope
- acceptance criteria
- business rules
- visible behavior

If the code drifted from those sections, `sync-spec` should propose a delta and ask for confirmation.

## Why This Fits The Harness Direction
This workflow aligns with the target harness architecture because it:
- keeps durable workflow state in files
- reduces artifacts that have no long-term reader
- preserves clear phase boundaries
- makes reconciliation explicit instead of hiding it in chat history
- keeps business judgment with humans and technical reconciliation with the agent

## Recommended Next Changes
1. Update `WORKFLOW_CODING_STANDARD.md` to make `spec -> execute-spec -> sync-spec -> verify-feature` the default flow.
2. Redefine the spec contract so it includes both behavior and technical approach.
3. Add an explicit contract for `sync-spec`, including what it may update automatically and what requires human approval.
4. Remove plan and enrich artifacts from the standard path.
