Explore the codebase for a plan and generate per-phase detail files.

INPUT: path to plan file (e.g. docs/ai/plans/{feature-name}.md)

---

STARTUP:
1. Read plan file
2. Collect all phases from ## Tasks section
3. For each phase, extract the list of task descriptions

---

EXPLORE PROCESS (repeat for each phase):
Spawn an Explore sub-agent with:
- Context: phase name + all task descriptions for that phase
- Goal: find all files that will be modified or created to fulfill these tasks;
        for each file identify relevant function/constant names to add or modify
- Output format expected back:
    Modified: {path} — {FunctionName}(), {CONSTANT_NAME}
    Created:  {path} — new module for {purpose}

Write the explore agent's output to docs/ai/plans/{name}-phase-{N}-details.md
using the format below.

---

DETAILS FILE FORMAT per phase:

## Phase {N} Details — {phase name}

### Files to modify
- {path} — add {FunctionName}(), modify {existingFn}(), add {CONSTANT_NAME}

### Files to create
- {path} — new module for {purpose}

### Notes
- {ordering constraint or non-obvious dependency between tasks}
(max 3 bullets, omit section entirely if nothing critical)

---

AFTER ALL PHASES — append to plan file:

## Enrich Summary
Total files: {N} ({X} modified, {Y} created)
{Phase 1 name}: {N} files · {Phase 2 name}: {N} files · ...

Details:
- Phase 1 → docs/ai/plans/{name}-phase-1-details.md
- Phase 2 → docs/ai/plans/{name}-phase-2-details.md
- ...

---

DONE WHEN:
- One details file exists per phase at docs/ai/plans/{name}-phase-{N}-details.md
- ## Enrich Summary appended to plan file
