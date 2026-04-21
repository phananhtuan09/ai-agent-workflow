---
name: review-spec
description: Review a requirement spec for ambiguity, missing requirements, and technical risks before planning.
---

## Goal

Review the provided requirement spec doc and output an actionable verdict before `/create-plan` or `/manage-epic` is run.

Accepts a file path argument: `/review-spec docs/ai/requirements/DD-MM-YYYY-req-{name}.md`

If no path is provided, look for the most recently modified file matching `docs/ai/requirements/req-*.md` (excluding `archive/` and template files).

---

## Workflow Alignment

- Provide a brief status update before starting the review.
- No todos needed — this is a single-pass read-and-report task.

---

## Step 1: Load Inputs

Read the requirement spec:

```
Read(file_path="{spec_path}")
```

Read agent outputs if they exist (in parallel):

```
Read(file_path="docs/ai/requirements/agents/ba-{name}.md")       # if exists
Read(file_path="docs/ai/requirements/agents/sa-{name}.md")       # if exists
Read(file_path="docs/ai/requirements/agents/uiux-{name}.md")     # if exists
```

If any file does not exist, skip it and continue. If the spec file itself does not exist → stop and report the path that was not found.

---

## Step 2: Evaluate Against 4 Criteria

Each criterion has a **confidence level** that determines how to report findings:

- **HIGH confidence** → give a definitive score and findings
- **LIMITED confidence** → report what was checked, flag what could not be verified, tell the user what to manually verify

---

### 1. Ambiguity Detection _(HIGH confidence — language level)_

AI can reliably detect language-level vagueness in requirement text.

Check:
- Are quantities, limits, and thresholds specified (not "some", "many", "quickly")?
- Are success and failure conditions explicitly defined?
- Would two developers implement each FR the same way?

Red flags:
- "System should respond quickly" → no response time target
- "Handle errors appropriately" → no error handling spec
- "Support multiple formats" → which formats exactly?
- "Users can manage their data" → what operations? what data?
- Vague acceptance criteria that can't be tested

**Limitation**: AI can detect vague language but may miss domain-specific ambiguity where the same term has multiple valid meanings in the project's domain. Flag any domain-specific terms that appear in the spec without a glossary definition.

---

### 2. Missing Requirements _(LIMITED confidence)_

AI applies a generic software checklist. It cannot know what is domain-specifically required without deeper context.

What AI will do — check if the spec addresses:

| Category | What to look for |
|----------|-----------------|
| Error handling | Network errors, invalid data, timeouts |
| Edge cases | Empty states, max limits, boundary values |
| Security | Auth, authorization, input validation |
| Data lifecycle | Create, update, delete, archival |
| User states | First-time, returning, admin, guest |
| Performance | Pagination, load expectations |

What AI cannot verify:
- Whether domain-specific business rules are complete
- Whether all regulatory or compliance requirements for this domain are covered
- Whether integration contracts with external systems are fully specified

**When reporting**: label each gap `[AI FLAGGED — generic checklist]`. Explicitly state: `⚠️ Domain-specific completeness cannot be verified — user should review with domain knowledge.`

---

### 3. Technical Risk Detection _(LIMITED confidence)_

AI can identify common engineering risks from the spec text. It cannot assess project-specific risks without reading the actual codebase.

What AI will do — flag known risk patterns:
- **Security**: auth gaps, missing input validation, exposed data
- **Performance**: unbounded queries, no pagination mentioned, N+1 patterns in described flows
- **Integration**: external API dependency with no failure handling
- **Data**: destructive operations with no confirmation or soft-delete

What AI cannot verify:
- Whether the current codebase already handles some of these risks
- Whether the tech stack chosen has specific known issues for this use case
- Project-specific infrastructure constraints

**When reporting**: prefix each risk with `[GENERAL RISK]` if it's a generic pattern, or `[NEEDS CODEBASE VERIFICATION]` if it requires checking actual code to confirm.

---

### 4. Consistency Check _(HIGH confidence)_

AI can directly compare sections within the spec against each other.

Check:
- Do user stories align with functional requirements?
- Do acceptance criteria match the FRs they validate?
- Does SA assessment align with BA scope (if agent outputs are available)?
- Are priorities consistent across sections?
- Does UI/UX design cover all user stories (if uiux doc is available)?

If agent output files are not available, scope the check to internal spec consistency only and state this explicitly.

---

## Confidence % Rules

Assign a confidence % to every individual finding based on how it was derived:

| Range | Meaning | When to use |
|-------|---------|-------------|
| 90–100% | Directly observed in text — no inference | Vague word found verbatim, missing field, internal contradiction |
| 70–89% | Inferred from clear pattern — low ambiguity | Common missing requirement, known risk pattern |
| 40–69% | Heuristic / generic checklist — may not apply | Category-based gap, standard risk not confirmed in this domain |
| < 40% | Speculation — domain or codebase context needed | Domain-specific rule, compliance requirement, project-specific risk |

Items below 70% must include a `Verify:` line telling the user exactly what to check.

---

## Step 3: Output Review

```markdown
## Spec Review: {feature-name}

### Verdict
**Status**: ✅ Ready for Planning | ⚠️ Needs Revision | ❌ Not Ready

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
| # | Risk | Severity | Confidence | Verify |
|---|------|----------|------------|--------|
| 1 | {description} | 🔴/🟡/🟢 | {X}% | {file, contract, or domain knowledge needed} |

### 4. Consistency Issues
| # | Conflict | Between | Confidence | Suggestion |
|---|----------|---------|------------|------------|
| 1 | {description} | {Section A} vs {Section B} | {X}% | {fix} |

---

### Critical Issues (Must Fix Before Planning)
1. [Issue] — Confidence: {X}% → [Fix]

### Warnings (Should Fix)
1. [Issue] — Confidence: {X}% → [Fix]

### Items to Verify (Confidence < 70%)
1. [Finding] — {X}% → [Exactly what to check and where]

---

### Recommendation
{Clear next action: ready for planning / revise specific sections / needs major rework}
```

---

## Step 4: Next Actions

If verdict is `✅ Ready for Planning`:
```
✓ Spec reviewed: {spec_path}

Next steps:
  /create-plan     → Generate a single feature plan
  /manage-epic     → Break into multiple feature plans (large feature)
```

If verdict is `⚠️ Needs Revision` or `❌ Not Ready`:
```
⚠ Spec needs revision before planning.

Fix the Critical Issues listed above, then re-run:
  /review-spec {spec_path}
```
