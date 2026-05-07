---
name: create-plan
description: Use when the user asks to create a plan, write a plan, or plan implementation for a feature or bug fix. Creates a plan file in docs/ai/plans/.
---

# Create Plan

Create a plan from a spec file or inline task description.

## Input (two modes)

- **File mode**: path to spec file (e.g. docs/ai/specs/{feature-name}.md)
- **Inline mode**: quoted description (e.g. "Fix: avatar does not update after save")

## Routing

Detect mode from input:
- If input ends in .md -> File mode
- If input is a quoted string -> Inline mode

## File Mode Process

1. Read spec file
2. Write single plan file to docs/ai/plans/{feature-name}.md

## Inline Mode Process

1. Derive a slug from the description (e.g. "fix-avatar-update")
2. Write small plan to docs/ai/plans/{slug}.md

## Plan Format - File Mode

Maximum 60 lines:

```markdown
## Spec
docs/ai/specs/{feature-name}.md - ACs: #1 #2 #3

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
```

## Plan Format - Inline Mode

Maximum 20 lines:

```markdown
## Task
[Restate the problem clearly in 1 sentence]

## Approach
[1-2 sentences: what to change and why]

## Tasks

### Phase 1: Fix
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3 (max 5 total)
```

## Shared Rules

- All output files must be written in English
- No file paths in tasks - file mapping is done by /enrich-plan
- No [DISCOVER] tasks - that is handled by /enrich-plan
- Each task = one small diff, described as intent
- One plan file only - never split into multiple files
- Inline mode: no ## Spec section, no ## Test Checklist unless regression needed
