# Phase 2: Create New Commands

## Goal
Create 5 new command files. Each section below contains the exact content
to write into the corresponding file.

## Tasks

- [ ] Create .claude/commands/init.md — see spec below
- [ ] Create .claude/commands/spec.md — see spec below
- [ ] Create .claude/commands/plan.md — see spec below
- [ ] Create .claude/commands/execute-plan.md — see spec below
- [ ] Create .claude/commands/verify.md — see spec below
- [ ] Create folder docs/ai/specs/ if not exists
- [ ] Create folder docs/ai/plans/ if not exists (may already exist)
- [ ] Create folder docs/ai/summaries/ if not exists
- [ ] Create folder docs/ai/verifications/ if not exists

---

## /init — content to write

```
Analyze the codebase, then generate or overwrite .claude/CLAUDE.md.

SCAN SCOPE (in order, stop when pattern is clear):
1. Root config files: package.json, tsconfig, eslint config
2. src/ top-level folders only (no recursive scan)
3. Per folder: read 1-2 representative files to infer pattern
4. Stop scanning a folder when pattern is consistent across 2 files
Do NOT recursively scan entire codebase.
If pattern unclear after 2 files → note "pattern unclear, needs manual review".

OUTPUT FILE: .claude/CLAUDE.md

HARD LIMITS:
- Total ≤ 50 lines
- Structure table ≤ 8 rows (only folders not self-explanatory from name)
- Conventions ≤ 5 bullets
- Constraints ≤ 6 bullets
- Patterns index ≤ 6 entries
- No explanations, no examples, no history — actionable rules only
- Anything exceeding limits → create docs/patterns/{topic}.md,
  reference from Patterns index

SECTIONS (in order):

## Structure
Scan actual folder structure. Include only folders not self-explanatory.

## Conventions
Scan codebase for: naming patterns, import style, export style.
Document what actually exists — do not assume.
If inconsistent: "inconsistent — prefer X"

## Constraints
Most important section:
- What must NOT be done (infer from ESLint config, existing patterns)
- Cross-boundary rules (what cannot import what)
- Which module/helper must be used instead of direct library usage
- Critical gotchas found in codebase

## Patterns
For each domain with non-obvious patterns (auth, forms, data fetching,
state, routing, testing):
- Do NOT inline detail here
- Create docs/patterns/{topic}.md with full detail
- Reference as: {topic} → docs/patterns/{topic}.md

IMPORTANT:
- Scan actual files — do not assume patterns
- Find real example files to verify each convention
- If a pattern cannot be found → do not document it
```

---

## /spec — content to write

```
Create a spec file for the described feature.

PROCESS:
1. Evaluate if the description already covers: problem, solution,
   edge cases, out of scope
2. If sufficient → write spec directly, note "No questions needed —
   proceeding with provided context"
3. If gaps exist → ask only missing questions (max 5),
   batch into one block, wait for answers
4. Write spec file to docs/ai/specs/{feature-name}.md

SPEC FORMAT (≤ 40 lines, business logic only — no tech details):

## Problem
[1-2 sentences: what is broken or missing]

## Solution
[2-3 sentences: what the feature does, not how to build it]

## Acceptance Criteria
- [ ] AC1: ...
- [ ] AC2: ...
- [ ] AC3: ...

## Out of Scope
- ...

## Open Questions
- ...

RULES:
- No technology, framework, or implementation details
- No project context (already in CLAUDE.md)
- AC must be verifiable — "user can X" not "system should Y"
- If something is unclear after answers → list in Open Questions,
  do not assume
```

---

## /plan — content to write

```
Create a plan from a spec file or inline task description.

INPUT (two modes):
- File mode: path to spec file (e.g. docs/ai/specs/{feature-name}.md)
- Inline mode: quoted description (e.g. "Fix: avatar không update after save")

ROUTING — detect mode from input:
- If input ends in .md → File mode
- If input is a quoted string → Inline mode

FILE MODE PROCESS:
1. Read spec file
2. Write plan to docs/ai/plans/{feature-name}.md

INLINE MODE PROCESS:
1. Derive a slug from the description (e.g. "fix-avatar-update")
2. Write small plan to docs/ai/plans/{slug}.md
   - 1 phase only, max 5 tasks
   - No ## Spec section
   - No ## Test Checklist (unless bug fix needs regression test)

---

PLAN FORMAT — File mode (≤ 60 lines):

## Spec
docs/ai/specs/{feature-name}.md · ACs: #1 #2 #3

## Approach
[3-5 sentences: technical approach, which layers are touched]

## Tasks

### Phase 1: {name}
- [ ] [DISCOVER] Find all files related to {domain/feature}:
      search by feature name, related component/store/hook names.
      Output: file list + which will be modified vs created.
- [ ] Task described as intent, not implementation
- [ ] ...

### Phase 2: {name}
- [ ] [DISCOVER] ...
- [ ] ...

## Test Checklist
- [ ] Unit: ...
- [ ] Integration: ...
- [ ] Manual: ...

---

PLAN FORMAT — Inline mode (≤ 20 lines):

## Task
[Restate the problem clearly in 1 sentence]

## Approach
[1-2 sentences: what to change and why]

## Tasks

### Phase 1: Fix
- [ ] [DISCOVER] Find files related to {domain}: search {terms}.
      Output: file list + which will be modified.
- [ ] [task 2]
- [ ] [task 3, max 5 total]

---

SHARED RULES:
- No file paths in tasks — AI discovers during execution
- [DISCOVER] is mandatory as first task of each phase
- [DISCOVER] format: "Find all files related to {domain}: search {terms}.
  Output list + modified vs created."
- Each task = one small diff, described as intent
- If File mode plan exceeds 60 lines → split by phase:
    Parent: docs/ai/plans/{name}.md (overview + phase index only)
    Children: docs/ai/plans/{name}-phase-{N}.md (tasks of that phase)
    Parent format:
      ## Phases
      - Phase 1: {name} → plans/{name}-phase-1.md
    Execute command always receives parent file.
    Summary always written to docs/ai/summaries/{name}.md (named after
    parent, not child — one summary per feature regardless of split).
```

---

## /execute-plan — content to write

```
Execute the plan file provided.

INPUT: path to plan file (e.g. docs/ai/plans/{feature-name}.md)

If parent plan (has ## Phases section): read phase index, then read each
child file before executing that phase.

PROCESS PER TASK:
1. [DISCOVER] tasks: list files to be touched, output list before coding
2. Find similar existing files in codebase to use as pattern reference
3. If pattern not found in CLAUDE.md or codebase → ask, do not assume
4. Implement
5. Use Edit tool to mark task done: [ ] → [x] in plan file

After all phases complete → write summary to
docs/ai/summaries/{feature-name}.md

RULES:
- Execute all phases from start to finish
- Do not touch files outside scope of current task
- If blocked (open question, missing context) → stop and report, do not guess

SUMMARY FORMAT:

## Done
- [what was implemented, mapped to AC numbers]

## Not Done / Blocked
- [what was skipped and why]

## Verified
- AC1 ✅ / AC2 ✅ ...

## Not Verified
- AC3 ⚠️ [reason]

SUMMARY RULES:
- AC ✅ only if: test passed (show output) OR human explicitly confirmed
- AC ⚠️ if: not tested yet, test skipped, or test failed
- Claude never self-judges AC as passed — evidence required
- If no test exists for an AC → ⚠️ "No test coverage"
```

---

## /verify — content to write

```
Read the spec file, generate a verification checklist.

INPUT: path to spec file (e.g. docs/ai/specs/{feature-name}.md)

OUTPUT: docs/ai/verifications/{feature-name}.md

VERIFICATION FORMAT:

## Source
docs/ai/specs/{feature-name}.md

## Manual Verification
[One test scenario per AC — written as step-by-step human action]
- [ ] AC1: [action] → [expected result]
- [ ] AC2: [action] → [expected result]

## Automated Verification
- [ ] Unit: [what to test]
- [ ] Integration: [what to test]

## Edge Cases
[Only from explicit AC conditions + Open Questions already answered]
- [ ] ...

## Excluded (Out of Scope)
[Items from spec's Out of Scope — listed so reviewer knows they are
intentionally not tested]
- ...

RULES:
- Every AC must have at least one manual verification step
- Steps written as: "[do X] → [expect Y]" — unambiguous, no interpretation
- Do not invent test cases beyond what ACs specify
- Out of Scope in spec → excluded from verification, not edge case source
- Open Questions not yet answered → flag as:
  ⚠️ "Unresolved — cannot verify until clarified"
- Do not create test scenarios for unresolved Open Questions
```

## Done when
All 5 command files created. All 4 docs/ai/ subfolders exist.
