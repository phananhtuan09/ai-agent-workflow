---
name: create-plan
description: Use when the user asks to create a plan, write a plan, or plan implementation for a feature or bug fix. Creates a plan file in docs/ai/plans/.
---

# Create Plan

Create a plan from a spec file or inline task description.

## Input (two modes)

- **File mode**: path to spec file (e.g. `docs/ai/specs/{feature-name}.md`)
- **Inline mode**: quoted description (e.g. `"Fix: avatar does not update after save"`)

## Routing

Detect mode from input:
- If input ends in `.md` -> File mode
- If input is a quoted string -> Inline mode

## File Mode Process

1. Read the spec file completely
2. Confirm the spec is planning-ready:
   - Scope is clear enough to sequence work
   - Acceptance criteria are identifiable and testable
   - No critical product behavior is missing for planning
3. If the spec is not planning-ready:
   - Do not invent missing behavior
   - Ask concise follow-up questions or tell the user the spec must be expanded first
4. If the spec is planning-ready:
   - Write a single plan file to `docs/ai/plans/{feature-name}.md`
   - `{feature-name}` must match the spec slug

## Inline Mode Process

1. Derive a kebab-case slug from the description (e.g. `fix-avatar-update`)
2. Restate the task clearly
3. Write a small plan to `docs/ai/plans/{slug}.md`

## Plan Format - File Mode

Hard cap: 80 lines.

```markdown
## Spec
`docs/ai/specs/{feature-name}.md` · Covered ACs: #1 #2 #3

## Execution Strategy
[2-4 sentences: phase order, dependency logic, and high-level execution approach. Do not introduce new user-visible behavior or technical design not already implied by the spec.]

## Spec Coverage
- AC1 → Phase 1 / Task 1
- AC2 → Phase 2 / Task 1
- AC3 → Phase 2 / Task 2, Phase 3 / Task 1

## Tasks

### Phase 1: {name}
- [ ] Task 1: described as intent and outcome, not implementation
- [ ] Task 2: ...

### Phase 2: {name}
- [ ] Task 1: ...

## Test Checklist
- [ ] Unit: ...
- [ ] Integration: ...
- [ ] Manual: ...
```

## Plan Format - Inline Mode

Hard cap: 24 lines.

```markdown
## Task
[Restate the problem clearly in 1 sentence]

## Execution Strategy
[1-2 sentences: what will be changed and why, at a high level]

## Tasks

### Phase 1: Fix
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3 (max 5 total)

[Optional only when regression risk is meaningful]
## Test Checklist
- [ ] ...
```

## Shared Rules

- All assistant responses, questions, and generated plan files must be written in Vietnamese
- Do not introduce new product behavior, validation rules, persistence rules, fallback behavior, or visible UX behavior that is not already in the spec or explicitly approved by the user
- If planning requires a missing assumption, do not silently choose it; either ask or mark it clearly as `ASSUMPTION — cần xác nhận`
- No file paths in tasks - file mapping is done by `/enrich-plan`
- No exact function names, schema/model names, storage keys, API shapes, or code structure decisions in the plan
- No `[DISCOVER]` tasks - that is handled by `/enrich-plan`
- Each task must be intent-based, small enough for one focused change set, and traceable to at least one acceptance criterion or explicit requirement
- One plan file only - never split into multiple main plan files
- Inline mode: no `## Spec` section; keep the plan short and include `## Test Checklist` only when regression risk justifies it
- Use `/enrich-plan` for file-level mapping, technical touchpoints, symbol discovery, and implementation detail

## Self-Check Before Writing The File

- Is the spec planning-ready, or are critical behavior rules still missing?
- Does every acceptance criterion appear in `## Spec Coverage`?
- Does every `## Spec Coverage` mapping point to a real task in the referenced phase?
- Did you avoid unresolved assumptions unless they are clearly marked as `ASSUMPTION — cần xác nhận`?
- Does every phase help cover at least one acceptance criterion or explicit requirement?
- Does the plan avoid introducing new behavior that is not in the spec?
- Does the plan stay intent-based rather than design-heavy?
- Did you avoid file paths, symbol mapping, and implementation detail that belongs in `/enrich-plan`?
- Is the test checklist aligned with the actual risks in this feature?
- Does the final plan stay within the hard cap for its mode?
