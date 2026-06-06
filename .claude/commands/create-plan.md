Create a plan from a spec file or inline task description.

INPUT (two modes):
- File mode: path to spec file (e.g. docs/ai/specs/{feature-name}.md)
- Inline mode: quoted description (e.g. "Fix: avatar not updating after save")

ROUTING — detect mode from input:
- If input ends in .md → File mode
- If input is a quoted string → Inline mode

---

FILE MODE PROCESS:
1. Read spec file
2. Write single plan file to docs/ai/plans/{feature-name}.md

FILE MODE FORMAT (≤ 60 lines):

## Spec
docs/ai/specs/{feature-name}.md · ACs: #1 #2 #3

## Approach
[3-5 sentences: technical approach, which layers are touched]

## Tasks

### Phase 1: {name}
- [ ] Task described as intent, not implementation
- [ ] ...

### Phase 2: {name}
- [ ] ...

## Test Checklist
- [ ] Unit: ...
- [ ] Integration: ...
- [ ] Manual: ...

---

INLINE MODE PROCESS:
1. Derive a slug from the description (e.g. "fix-avatar-update")
2. Write small plan to docs/ai/plans/{slug}.md

INLINE MODE FORMAT (≤ 20 lines):

## Task
[Restate the problem clearly in 1 sentence]

## Approach
[1-2 sentences: what to change and why]

## Tasks

### Phase 1: Fix
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3 (max 5 total)

---

SHARED RULES:
- All assistant responses, questions, and generated plan files must be written in Vietnamese
- No file paths in tasks — file mapping is done by /enrich-plan
- No [DISCOVER] tasks — that is handled by /enrich-plan
- Each task = one small diff, described as intent
- One plan file only — never split into multiple files
- Inline mode: no ## Spec section, no ## Test Checklist unless regression needed
