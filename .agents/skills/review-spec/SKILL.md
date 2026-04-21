---
name: review-spec
description: Use when the user asks to review a requirement spec before planning, checking for ambiguity, missing requirements, technical risks, and internal consistency.
---

# Review Spec

Use this skill to review a requirement spec doc before `/create-plan` or `/manage-epic` is run.
The goal is to catch vague requirements, missing edge cases, technical risks, and internal conflicts before planning starts.

Each finding gets a confidence % so the user knows which issues are certain and which need human verification.

## Inputs

- A requirement spec path, usually `docs/ai/requirements/DD-MM-YYYY-req-{name}.md`
- Optional agent output docs in `docs/ai/requirements/agents/` (ba-, sa-, uiux-)

## Codex Tool Mapping

- Claude `Read/Glob/Grep` -> inspect files with `rg`, `rg --files`, `find`, and `sed`
- Claude review-only agent behavior -> do not edit any files unless the user explicitly asks
- Independent file reads -> use `multi_tool_use.parallel` only for parallel reads

## Workflow

### 1. Load the spec and available context

Read the requirement spec first.

Then read in parallel if they exist:

- `docs/ai/requirements/agents/ba-{name}.md`
- `docs/ai/requirements/agents/sa-{name}.md`
- `docs/ai/requirements/agents/uiux-{name}.md`

Skip any file that does not exist and continue.
If the spec file itself does not exist, stop and report the missing path.

### 2. Assign confidence % to every finding

Before writing any finding, determine how it was derived and assign a confidence %:

| Range | Meaning | When to use |
|-------|---------|-------------|
| 90–100% | Directly observed in text — no inference | Vague word found verbatim, missing field, internal contradiction |
| 70–89% | Inferred from clear pattern — low ambiguity | Common missing requirement, known risk pattern |
| 40–69% | Heuristic / generic checklist — may not apply | Category-based gap, standard risk not confirmed in this domain |
| < 40% | Speculation — domain or codebase context needed | Domain-specific rule, compliance requirement, project-specific risk |

Every finding below 70% must include a `Verify:` line stating exactly what the user should check and where.

### 3. Evaluate the four criteria

#### 1. Ambiguity Detection — check with HIGH confidence

Detect language-level vagueness directly from the spec text.

Ask:

- Are quantities, limits, and thresholds specified — not "some", "many", "quickly"?
- Are success and failure conditions explicitly defined?
- Would two developers implement each FR the same way?
- Do acceptance criteria describe testable outcomes?

Red flags: "System should respond quickly", "Handle errors appropriately", "Support multiple formats", "Users can manage their data"

Also flag domain-specific terms that appear without a glossary definition — these require human verification even if the language itself is not vague.

#### 2. Missing Requirements — check with LIMITED confidence

AI applies a generic software checklist. It cannot know what is domain-specifically required.

Do:

- Check if the spec addresses error handling, edge cases, security, data lifecycle, and user states
- Apply this checklist: network errors, invalid data, empty states, max limits, auth failures, concurrent access, data retention

Do not:

- Claim domain-specific completeness — flag those findings at 40–69% with a `Verify:` line pointing to the domain expert or business stakeholder to consult

#### 3. Technical Risk Detection — check with LIMITED confidence

Identify common engineering risk patterns from the spec text. Cannot assess project-specific risks without reading the codebase.

Do:

- Flag missing idempotency for state-changing operations
- Flag missing signature verification for external callbacks
- Flag unbounded queries or missing pagination
- Flag auth or input validation gaps stated or implied in the spec
- Flag external API dependencies with no failure handling

Label each risk as:

- `GENERAL RISK` — a well-known pattern risk, regardless of this project
- `NEEDS CODEBASE VERIFICATION` — risk exists only if a specific condition holds in the actual code; user must verify

Do not claim a risk is real without qualifying it at the right confidence level.

#### 4. Consistency Check — check with HIGH confidence

Compare sections within the spec and across available agent output docs directly.

Ask:

- Do user stories align with functional requirements?
- Do acceptance criteria match the FRs they validate?
- Does the SA assessment align with BA scope (when sa doc is available)?
- Are priorities consistent across sections?
- Does the UI/UX design cover all user stories (when uiux doc is available)?

If agent docs are not available, scope the check to internal spec consistency only and state this explicitly.

### 4. Produce the review output

## Output Format

```markdown
## Spec Review: {feature-name}

### Verdict
**Status**: Ready for Planning | Needs Revision | Not Ready

**Implementation Readiness**: {0-100}%
(Based only on what could be verified)

---

### 1. Ambiguity Issues
| # | Location | Current Text | Problem | Confidence | Verify |
|---|----------|--------------|---------|------------|--------|
| 1 | {section} | "{quoted text}" | {why ambiguous} | {X}% | {what to confirm, or "-"} |

### 2. Missing Requirements
| # | Category | What's Missing | Impact | Confidence | Verify |
|---|----------|----------------|--------|------------|--------|
| 1 | {category} | {description} | High/Med/Low | {X}% | {what to check} |

### 3. Technical Risks
| # | Risk | Type | Severity | Confidence | Verify |
|---|------|------|----------|------------|--------|
| 1 | {description} | GENERAL RISK or NEEDS CODEBASE VERIFICATION | High/Med/Low | {X}% | {file or domain knowledge needed} |

### 4. Consistency Issues
| # | Conflict | Between | Confidence | Suggestion |
|---|----------|---------|------------|------------|
| 1 | {description} | {Section A} vs {Section B} | {X}% | {fix} |

---

### Critical Issues (Must Fix Before Planning)
1. [Issue] — Confidence: {X}% -> [Fix]

### Warnings (Should Fix)
1. [Issue] — Confidence: {X}% -> [Fix]

### Items to Verify (Confidence < 70%)
1. [Finding] — {X}% -> [Exactly what to check and where]

---

### Recommendation
[Ready for planning / revise specific sections / needs major rework]
```

If a section has no findings, state that explicitly instead of leaving it empty.
If there are no critical issues, say `None`.

## Quality Bar

- Assign confidence % to every individual finding, not just per section
- Be specific enough that the author can revise the spec directly
- Do not invent missing requirements — flag them as gaps with low confidence and a verify instruction
- Distinguish GENERAL RISK from NEEDS CODEBASE VERIFICATION for every technical risk
- Do not edit any files
