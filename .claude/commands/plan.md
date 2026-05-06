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
- All output files must be written in English
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