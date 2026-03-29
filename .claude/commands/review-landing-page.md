---
name: review-landing-page
description: Reviews a showcase landing page using a weighted rubric, evidence rules, and verdict gates.
---

## Goal

Review a showcase landing page with a repeatable framework instead of an ad hoc opinion dump.

The review must:

- choose an honest review mode
- respect evidence limits
- score only defensible categories
- report verified coverage separately from total
- enforce top-tier eligibility gates

---

## Inputs

Expected inputs may include:

- screenshots
- video capture
- Figma link or export
- live URL
- local frontend code path

Optional user request:

- quick score
- full critique
- audit with fixes

---

## Shared Knowledge

Load these files:

- `.agents/knowledge/review-landing-page-showcase/rubric.md`
- `.agents/knowledge/review-landing-page-showcase/scoring-policy.md`
- `.agents/knowledge/review-landing-page-showcase/evidence-matrix.md`
- `.agents/knowledge/review-landing-page-showcase/output-template.md`

Load these if calibration is needed:

- `.agents/knowledge/review-landing-page-showcase/scoring-anchors.md`
- `.agents/knowledge/review-landing-page-showcase/calibration-examples.md`
- `.agents/knowledge/review-landing-page-showcase/anti-bias-rules.md`

---

## Workflow

### Step 1: Detect Inputs First

Infer from context before asking:

- evidence type
- likely review mode
- likely output depth

Defaults:

- screenshots or Figma only -> `Visual-only`
- live URL without code -> `Experience review`
- live URL plus code or profiling -> `Full audit`
- no explicit depth -> `full critique`

Only ask follow-up questions if the current context is too ambiguous to review honestly.

---

### Step 2: Set Review Constraints

Use `evidence-matrix.md` to determine:

- confidence ceiling
- which categories can be `Scored`
- which categories should be `Provisional`
- which categories must be `Unverified`

Do not promise a complete 100-point audit when the evidence does not support it.

---

### Step 3: Review Category By Category

For each rubric category:

- state `Observed`
- state `Inference`
- assign `Scored`, `Provisional`, `Unverified`, or `N/A`
- assign `0-5` only when defensible
- calculate weighted score only when a numeric score exists

Use `scoring-anchors.md` if scores feel unstable or inflated.

---

### Step 4: Run Bias Checks

Before final verdict, apply `anti-bias-rules.md`:

- avoid hero halo
- avoid flashy-motion inflation
- avoid premium-aesthetic bias
- avoid screenshot confidence bias

If needed, compare rough scoring against `calibration-examples.md`.

---

### Step 5: Compute Final Result

Use `scoring-policy.md` to report:

- verified-scope total
- coverage
- evidence confidence
- verdict ceiling

Never label the page `Top Tier` when:

- `Motion`, `Performance`, `Responsive`, or `Typography` are below `3/5`
- any of those four are `Unverified`
- coverage is too low
- confidence is too low

---

## Output Format

Use `.agents/knowledge/review-landing-page-showcase/output-template.md`.

If the user asks for a shorter answer, keep the same structure but compress category notes to one or two lines each.

---

## Tone

- Be direct and specific.
- Prefer evidence-backed critique over taste-only commentary.
- If a category is unverified, say that plainly instead of padding with vague praise.
