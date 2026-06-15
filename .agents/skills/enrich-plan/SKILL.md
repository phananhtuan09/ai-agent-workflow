---
name: enrich-plan
description: Use when the user asks to enrich a plan, explore the codebase for a plan, or map files to a plan. Generates per-phase detail files from a plan. Do NOT use for inline plans (no ## Spec section).
---

# Enrich Plan

Explore the codebase for a plan and generate per-phase detail files.

## Input

Path to plan file (e.g. `docs/ai/plans/{feature-name}.md`)

## Startup

1. Read the plan file completely
2. Read `## Spec Coverage` and `## Tasks`
3. Collect all phases from the `## Tasks` section
4. For each phase, extract the list of task descriptions
5. Stay within the scope already defined by the spec and plan
   - Do not add new product behavior during enrichment
   - Use enrichment only to map technical touchpoints needed to execute the existing plan

## Explore Process

Repeat for each phase:

Spawn an Explore sub-agent with:
- Context: phase name + all task descriptions for that phase
- Goal: find all files that will likely be modified or created to fulfill these tasks; for each file identify the relevant symbols, technical touchpoints, and notable dependencies
- Output format expected back:
  - Modified: {path} — {FunctionName}(), {CONSTANT_NAME}, {relevant symbol}
  - Created: {path} — new module for {purpose}
  - Notes: {dependency, sequencing constraint, or technical risk}

Write the explore agent's output to `docs/ai/plans/{name}-phase-{N}-details.md`.

## Details File Format Per Phase

Target 20-60 lines, hard cap 80 lines.

```markdown
## Phase {N} Details — {phase name}

### Files to modify
- `{path}` — add/adjust {relevant symbol}, modify {existing symbol}, update related constants/contracts as needed

### Files to create
- `{path}` — new module for {purpose}

### Notes
- {ordering constraint, shared dependency, pattern to reuse, or technical risk}
```

Notes: max 3 bullets, omit section entirely if nothing critical.

## Details Rules

- Keep only the technical touchpoints needed to execute the phase safely
- Do not restate the full plan or spec
- Do not add new product behavior or new acceptance criteria
- If the details file would exceed 80 lines, reduce it to the highest-value files, symbols, and risks only

## After All Phases

Append to plan file:

```markdown
## Enrich Summary
Total files: {N} ({X} modified, {Y} created)
{Phase 1 name}: {N} files · {Phase 2 name}: {N} files · ...

Details:
- Phase 1 → `docs/ai/plans/{name}-phase-1-details.md`
- Phase 2 → `docs/ai/plans/{name}-phase-2-details.md`
- ...
```

## Done When

- One details file exists per phase at `docs/ai/plans/{name}-phase-{N}-details.md`
- `## Enrich Summary` appended to plan file
- Enrichment stays within the scope already defined by the spec and plan
- Each details file stays within the configured detail-file cap
- All assistant responses and generated detail/summary content must be written in Vietnamese
