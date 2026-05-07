---
name: enrich-plan
description: Use when the user asks to enrich a plan, explore the codebase for a plan, or map files to a plan. Generates per-phase detail files from a plan. Do NOT use for inline plans (no ## Spec section).
---

# Enrich Plan

Explore the codebase for a plan and generate per-phase detail files.

## Input

Path to plan file (e.g. docs/ai/plans/{feature-name}.md)

## Startup

1. Read plan file
2. Collect all phases from ## Tasks section
3. For each phase, extract the list of task descriptions

## Explore Process

Repeat for each phase:

Spawn an Explore sub-agent with:
- Context: phase name + all task descriptions for that phase
- Goal: find all files that will be modified or created to fulfill these tasks;
  for each file identify relevant function/constant names to add or modify
- Output format expected back:
  - Modified: {path} — {FunctionName}(), {CONSTANT_NAME}
  - Created: {path} — new module for {purpose}

Write the explore agent's output to docs/ai/plans/{name}-phase-{N}-details.md.

## Details File Format Per Phase

```markdown
## Phase {N} Details — {phase name}

### Files to modify
- {path} — add {FunctionName}(), modify {existingFn}(), add {CONSTANT_NAME}

### Files to create
- {path} — new module for {purpose}

### Notes
- {ordering constraint or non-obvious dependency between tasks}
```

Notes: max 3 bullets, omit section entirely if nothing critical.

## After All Phases

Append to plan file:

```markdown
## Enrich Summary
Total files: {N} ({X} modified, {Y} created)
{Phase 1 name}: {N} files · {Phase 2 name}: {N} files · ...

Details:
- Phase 1 → docs/ai/plans/{name}-phase-1-details.md
- Phase 2 → docs/ai/plans/{name}-phase-2-details.md
- ...
```

## Done When

- One details file exists per phase at docs/ai/plans/{name}-phase-{N}-details.md
- ## Enrich Summary appended to plan file
