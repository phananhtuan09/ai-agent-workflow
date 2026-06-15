Explore the codebase for a plan and generate per-phase detail files.

INPUT: path to plan file (e.g. `docs/ai/plans/{feature-name}.md`)

---

STARTUP:
1. Read the plan file completely
2. Read `## Spec Coverage` and `## Tasks`
3. Collect all phases from the `## Tasks` section
4. For each phase, extract the list of task descriptions
5. Stay within the scope already defined by the spec and plan
   - Do not add new product behavior during enrichment
   - Use enrichment only to map technical touchpoints needed to execute the existing plan

---

EXPLORE PROCESS (repeat for each phase):
Spawn an Explore sub-agent with:
- Context: phase name + all task descriptions for that phase
- Goal: find all files that will likely be modified or created to fulfill these tasks; for each file identify the relevant symbols, technical touchpoints, and notable dependencies
- Output format expected back:
    Modified: {path} — {FunctionName}(), {CONSTANT_NAME}, {relevant symbol}
    Created:  {path} — new module for {purpose}
    Notes:    {dependency, sequencing constraint, or technical risk}

Write the explore agent's output to `docs/ai/plans/{name}-phase-{N}-details.md`
using the format below.

---

DETAILS FILE FORMAT per phase (target 20-60 lines, hard cap 80 lines):

## Phase {N} Details — {phase name}

### Files to modify
- `{path}` — add/adjust {relevant symbol}, modify {existing symbol}, update related constants/contracts as needed

### Files to create
- `{path}` — new module for {purpose}

### Notes
- {ordering constraint, shared dependency, pattern to reuse, or technical risk}
(max 3 bullets, omit section entirely if nothing critical)

DETAILS RULES:
- Keep only the technical touchpoints needed to execute the phase safely
- Do not restate the full plan or spec
- Do not add new product behavior or new acceptance criteria
- If the details file would exceed 80 lines, reduce it to the highest-value files, symbols, and risks only

---

AFTER ALL PHASES — append to plan file:

## Enrich Summary
Total files: {N} ({X} modified, {Y} created)
{Phase 1 name}: {N} files · {Phase 2 name}: {N} files · ...

Details:
- Phase 1 → `docs/ai/plans/{name}-phase-1-details.md`
- Phase 2 → `docs/ai/plans/{name}-phase-2-details.md`
- ...

---

DONE WHEN:
- One details file exists per phase at `docs/ai/plans/{name}-phase-{N}-details.md`
- `## Enrich Summary` is appended to the plan file
- Enrichment stays within the scope already defined by the spec and plan
- Each details file stays within the configured detail-file cap
- All assistant responses and generated detail/summary content must be written in Vietnamese
