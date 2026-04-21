---
name: review-plan
description: Review a feature plan doc for clarity, completeness, logic, and AI-executability before implementation.
---

## Goal

Review the provided feature plan doc and output an actionable verdict before implementation begins.

Accepts a file path argument: `/review-plan docs/ai/planning/DD-MM-YYYY-feature-{name}.md`

If no path is provided, look for the most recently modified file matching `docs/ai/planning/*.md` (excluding `archive/` and template files).

---

## Workflow Alignment

- Provide a brief status update before starting the review.
- No todos needed — this is a single-pass read-and-report task.

---

## Step 1: Load Inputs

Read in parallel:

```
Read(file_path="{plan_path}")
Read(file_path="docs/ai/project/CODE_CONVENTIONS.md")
Read(file_path="docs/ai/project/PROJECT_STRUCTURE.md")
```

If `CODE_CONVENTIONS.md` or `PROJECT_STRUCTURE.md` do not exist, use `"(not available)"` as placeholder and continue.

If the plan file does not exist → stop and report the path that was not found.

---

## Step 2: Evaluate Against 5 Criteria

Each criterion has a **confidence level** that determines how to report findings:

- **HIGH confidence** → give a definitive score and findings
- **LIMITED confidence** → report what was checked, flag what could not be verified, tell the user what to manually verify

---

### 1. Clarity _(HIGH confidence)_

AI can reliably detect language-level vagueness by reading the plan text.

Check:
- Are there ambiguous terms or vague descriptions?
- Would two developers interpret this the same way?
- Are user flows, states, and interactions explicitly described?

Red flags:
- "Handle errors appropriately" — what does appropriately mean?
- "Similar to existing feature" — which feature? how similar?
- "Should support various formats" — which formats exactly?

---

### 2. Completeness _(LIMITED confidence)_

AI can only check completeness against what is written in the plan itself. Without a requirement doc as baseline, it cannot know what cases are truly missing from the domain.

What AI will do:
- Check if happy path is described
- Check if error states and validation rules are mentioned
- Apply a generic checklist: empty state, auth failure, network error, concurrent access

What AI cannot verify:
- Whether domain-specific edge cases are missing
- Whether all business rules from the original requirement are covered

**When reporting**: for each gap found, label it `[AI FLAGGED]`. For coverage that cannot be verified, explicitly state: `⚠️ Cannot fully verify completeness without requirement doc — user should cross-check against original requirements.`

---

### 3. Project Context Alignment _(HIGH confidence)_

AI reads `CODE_CONVENTIONS.md` and `PROJECT_STRUCTURE.md` and compares against the plan directly.

Check:
- Do file paths in the plan match project structure?
- Does the plan follow naming conventions?
- Does it reuse existing patterns or reinvent them?
- Is it creating abstractions that already exist?

If context files are unavailable, downgrade to LIMITED confidence and flag it.

---

### 4. Logic Soundness _(LIMITED confidence)_

AI can check the internal logic of the plan but cannot verify against actual codebase state.

What AI will do:
- Check if steps are in a valid dependency order (A depends on B which hasn't been created yet)
- Check if data flow described in the plan is internally consistent
- Identify obvious security gaps mentioned in the plan (missing auth, no input validation)

What AI cannot verify:
- Whether DB schema described matches actual schema in codebase
- Whether API contracts described match existing implementations
- Whether race conditions exist in actual runtime behavior

**When reporting**: prefix uncertain findings with `[NEEDS CODEBASE VERIFICATION]` and list the specific files or schemas the user should check.

---

### 5. AI Executability _(LIMITED confidence)_

AI can detect missing or ambiguous specs that would force guessing during implementation. It cannot predict what it will guess wrong when specs appear sufficient but are subtly incorrect.

What AI will do:
- Flag tasks with no clear input/output spec
- Flag pseudo-code that is too abstract to translate into code
- Flag "implement similar to X" references without specifics
- Flag tasks requiring human judgment calls with no defined outcome

What AI cannot verify:
- Whether a spec that appears complete will lead to correct implementation
- Whether implicit assumptions in the plan match the user's intent

**When reporting**: flag uncertain tasks as `[USER SHOULD VERIFY]` and state what assumption the AI would make if asked to implement right now.

---

## Confidence % Rules

Assign a confidence % to every individual finding based on how it was derived:

| Range | Meaning | When to use |
|-------|---------|-------------|
| 90–100% | Directly observed in text — no inference | Vague word found verbatim, file path mismatch, missing field |
| 70–89% | Inferred from clear pattern — low ambiguity | Step order issue, naming inconsistency, known anti-pattern |
| 40–69% | Heuristic / generic checklist — may not apply | Missing edge case from generic list, common risk pattern |
| < 40% | Speculation — domain or codebase context needed | Domain-specific gap, runtime behavior, business rule coverage |

Items below 70% must include a `Verify:` line telling the user exactly what to check.

---

## Step 3: Output Review

```markdown
## Plan Review: {feature-name}

### Verdict
**Status**: ✅ Ready to Execute | ⚠️ Needs Clarification | ❌ Not Ready

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
1. [Issue] — Confidence: {X}% → [Suggested fix]

### Warnings (Should Fix)
1. [Issue] — Confidence: {X}% → [Suggested fix]

### Items to Verify (Confidence < 70%)
1. [Finding] — {X}% → [Exactly what to check and where]

---

### Recommendation
[Clear next action: proceed / revise specific sections / major rework needed]
```

---

## Step 4: Next Actions

If verdict is `✅ Ready to Execute`:
```
✓ Plan reviewed: {plan_path}

Next steps:
  /execute-plan {plan_path}    → Implement this feature
```

If verdict is `⚠️ Needs Clarification` or `❌ Not Ready`:
```
⚠ Plan needs revision before implementation.

Fix the Critical Issues listed above, then re-run:
  /review-plan {plan_path}
```
