---
name: review-plan
description: Use when the user asks to review a feature planning doc before implementation for clarity, completeness, logic, project alignment, and AI executability.
---

# Review Plan

Use this skill to review a planning doc before implementation starts.
The goal is to catch ambiguity, missing scope, broken logic, or project misalignment before an AI agent writes code.

Each finding gets a confidence % so the user knows which issues are certain and which need human verification.

## Inputs

- A planning doc path, usually `docs/ai/planning/feature-{name}.md`
- Optional related docs referenced by the plan

## Codex Tool Mapping

- Claude `Read/Glob/Grep` -> inspect files with `rg`, `rg --files`, `find`, and `sed`
- Claude review-only agent behavior -> do not edit implementation code unless the user explicitly asks
- Independent file reads -> use `multi_tool_use.parallel` only for parallel reads

## Workflow

### 1. Load the plan and required context

Read these files in parallel:

- the target planning doc
- `docs/ai/project/CODE_CONVENTIONS.md`
- `docs/ai/project/PROJECT_STRUCTURE.md`

If either context file is missing, note it as unavailable and continue.
If the plan file does not exist, stop and report the missing path.

### 2. Assign confidence % to every finding

Before writing any finding, determine how it was derived and assign a confidence %:

| Range | Meaning | When to use |
|-------|---------|-------------|
| 90–100% | Directly observed in text — no inference | Vague word found verbatim, file path mismatch, missing field |
| 70–89% | Inferred from clear pattern — low ambiguity | Step order issue, naming inconsistency, known anti-pattern |
| 40–69% | Heuristic / generic checklist — may not apply | Missing edge case from generic list, common risk pattern |
| < 40% | Speculation — domain or codebase context needed | Domain-specific gap, runtime behavior, business rule coverage |

Every finding below 70% must include a `Verify:` line stating exactly what the user should check and where.

### 3. Evaluate the five criteria

#### 1. Clarity — check with HIGH confidence

Detect language-level vagueness directly from the plan text.

Ask:

- Can I tell exactly what needs to be built?
- Are any terms vague, overloaded, or open to interpretation?
- Would two implementers build the same thing from this plan?
- Are user flows, states, and edge cases explicit?

Red flags: "Handle errors appropriately", "Similar to existing feature", "Refine the UI", "Should support various formats"

#### 2. Completeness — check with LIMITED confidence

AI can only check against what is written in the plan. Without a requirement doc as baseline, it cannot know what domain-specific cases are truly missing.

Do:

- Check if happy path is described
- Check if error states and validation rules are mentioned
- Apply a generic checklist: empty state, auth failure, network error, initial load with URL params

Do not:

- Claim completeness from domain knowledge alone — flag those findings at 40–69% with a `Verify:` line

#### 3. Project Context Alignment — check with HIGH confidence

Compare file paths, naming, and patterns in the plan against `CODE_CONVENTIONS.md` and `PROJECT_STRUCTURE.md` directly.

Ask:

- Do file paths in the plan match the repo structure?
- Does the plan follow naming conventions?
- Does it reuse existing patterns instead of reinventing them?

If context files are unavailable, downgrade all alignment findings to 60% and flag them.

#### 4. Logic Soundness — check with LIMITED confidence

Check the internal logic of the plan only. Do not claim to verify against actual codebase state.

Do:

- Check if task steps are in a valid dependency order
- Check if the data flow described in the plan is internally consistent
- Flag obvious security gaps stated or implied in the plan

Do not:

- Claim that DB schemas, API contracts, or runtime behaviors match the codebase without reading the actual files — flag those at 50–65% with specific files to check

#### 5. AI Executability — check with LIMITED confidence

Detect missing specs that would force an AI agent to guess during implementation.

Do:

- Flag tasks with no input/output spec
- Flag pseudo-code that is too abstract
- Flag "implement similar to X" references without specifics
- State what the AI would assume if asked to implement the task right now

Do not:

- Claim a spec is sufficient just because it appears complete — note implicit assumptions the user should confirm

### 4. Produce the review output

## Output Format

```markdown
## Plan Review: {feature-name}

### Verdict
**Status**: Ready to Execute | Needs Clarification | Not Ready

---

### 1. Clarity
| # | Finding | Confidence | Verify |
|---|---------|------------|--------|
| 1 | {vague term or missing detail} | {X}% | {what to check, or "-" if confident} |

### 2. Completeness
| # | Gap | Confidence | Verify |
|---|-----|------------|--------|
| 1 | {missing case or scenario} | {X}% | {what to check} |

### 3. Project Context Alignment
| # | Deviation | Confidence | Verify |
|---|-----------|------------|--------|
| 1 | {mismatch with conventions or structure} | {X}% | {file or rule to check, or "-"} |

### 4. Logic Soundness
| # | Issue | Confidence | Verify |
|---|-------|------------|--------|
| 1 | {logic or ordering problem} | {X}% | {file, schema, or contract to check} |

### 5. AI Executability
| # | Gap | Confidence | Assumption AI would make |
|---|-----|------------|--------------------------|
| 1 | {underspecified task or missing spec} | {X}% | {what AI would guess if implementing now} |

---

### Critical Issues (Must Fix)
1. [Issue] — Confidence: {X}% -> [Suggested fix]

### Warnings (Should Fix)
1. [Issue] — Confidence: {X}% -> [Suggested fix]

### Items to Verify (Confidence < 70%)
1. [Finding] — {X}% -> [Exactly what to check and where]

---

### Recommendation
[Proceed / revise specific sections / major rework needed]
```

If a section has no findings, state that explicitly instead of leaving it empty.
If there are no critical issues, say `None`.

## Quality Bar

- Assign confidence % to every individual finding, not just per section
- Be specific enough that the author can revise the plan directly
- Treat ambiguity as implementation risk
- Do not invent missing requirements — flag them as gaps with low confidence
- Prefer file or section references when available
- Do not edit any implementation files
