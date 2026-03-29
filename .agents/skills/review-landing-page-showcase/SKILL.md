---
name: review-landing-page-showcase
description: |
  Review premium showcase landing pages focused on creative direction, brand expression,
  hero impact, storytelling flow, color, typography, layout, motion design, interaction quality,
  media quality, performance, responsive behavior, accessibility, technical execution, and polish.
  Use when evaluating a landing page from screenshots, Figma, a live URL, or frontend source code.
  Do NOT use for backend reviews, generic code reviews, or non-visual product pages.
---

# Review Landing Page Showcase

Use this skill to review a showcase-style landing page with a structured rubric instead of ad hoc design opinions.

## Inputs

Accepted inputs:

- screenshot set
- screenshot plus motion video
- Figma frame or exported design
- live URL
- local frontend code
- mixed evidence

## Shared Knowledge

Read these files before reviewing:

- `.agents/knowledge/review-landing-page-showcase/rubric.md`
- `.agents/knowledge/review-landing-page-showcase/scoring-policy.md`
- `.agents/knowledge/review-landing-page-showcase/evidence-matrix.md`
- `.agents/knowledge/review-landing-page-showcase/output-template.md`

Read these when scoring feels subjective or inflated:

- `.agents/knowledge/review-landing-page-showcase/scoring-anchors.md`
- `.agents/knowledge/review-landing-page-showcase/calibration-examples.md`
- `.agents/knowledge/review-landing-page-showcase/anti-bias-rules.md`

## Review Modes

Choose the narrowest honest mode:

- `Visual-only`: screenshots, Figma, or stills only
- `Experience review`: live site or video-backed runtime review
- `Full audit`: live site plus code and performance evidence

Do not present a `Full audit` when only static evidence exists.

## Workflow

### 1. Identify evidence and set ceiling

- classify evidence type
- set maximum confidence using `evidence-matrix.md`
- decide which categories are likely `Scored`, `Provisional`, or `Unverified`

### 2. Review against rubric

For each category:

- capture `Observed`
- separate `Inference`
- assign status using `scoring-policy.md`
- assign a `0-5` rating only when a score is defensible
- convert to weighted score using `rubric.md`

### 3. Apply anti-bias checks

Before finalizing:

- check for hero halo
- check for flashy-motion inflation
- check for screenshot overconfidence
- compare rough scoring against `calibration-examples.md`

### 4. Calculate totals honestly

- compute verified-scope total using `scoring-policy.md`
- report coverage separately
- do not fabricate a full `100` score when major categories are unverified

### 5. Enforce verdict gates

Never label a page `Top Tier` if:

- `Motion`, `Performance`, `Responsive`, or `Typography` score below `3/5`
- any of those four are `Unverified`
- coverage or confidence is too low per `scoring-policy.md`

## Output Contract

Use the report structure from:

- `.agents/knowledge/review-landing-page-showcase/output-template.md`

Always include:

- review mode
- evidence confidence
- coverage
- category status
- observed evidence
- inference
- total on verified scope
- verdict
- strengths
- gaps
- priority fixes
- evidence limits

## Review Discipline

- Do not guess runtime quality from still images.
- Do not reward style volume over control.
- Do not inflate `Technical Execution` without code or strong runtime evidence.
- Prefer `Unverified` over fake certainty.
