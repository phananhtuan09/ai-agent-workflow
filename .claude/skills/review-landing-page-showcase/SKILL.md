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

Use this skill when the task is to evaluate a showcase landing page with a reusable scoring framework rather than a loose design critique.

## Inputs

Accepted evidence:

- screenshots
- screenshots plus video
- Figma exports or design frames
- live URL
- local frontend code
- mixed evidence

## Shared Knowledge

Read these first:

- `.agents/knowledge/review-landing-page-showcase/rubric.md`
- `.agents/knowledge/review-landing-page-showcase/scoring-policy.md`
- `.agents/knowledge/review-landing-page-showcase/evidence-matrix.md`
- `.agents/knowledge/review-landing-page-showcase/output-template.md`

Load these when needed:

- `.agents/knowledge/review-landing-page-showcase/scoring-anchors.md`
- `.agents/knowledge/review-landing-page-showcase/calibration-examples.md`
- `.agents/knowledge/review-landing-page-showcase/anti-bias-rules.md`

## Review Modes

- `Visual-only` for still evidence only
- `Experience review` for live runtime review
- `Full audit` for live runtime plus code or profiling evidence

Auto-detect the mode from available context first. Ask only when ambiguity is material.

## Workflow

1. Identify evidence type and set confidence ceiling from `evidence-matrix.md`.
2. Decide category statuses using `scoring-policy.md`.
3. Score only defensible categories with the rubric and anchors.
4. Separate `Observed` from `Inference` in every category.
5. Apply anti-bias checks before final verdict.
6. Compute verified-scope total and coverage.
7. Enforce top-tier eligibility gates before naming verdict.

## Output

Use `.agents/knowledge/review-landing-page-showcase/output-template.md`.

Always include:

- review mode
- evidence confidence
- coverage
- category status
- evidence limits
- strengths
- gaps
- priority fixes

## Guardrails

- Prefer `Unverified` over invented certainty.
- Do not infer performance or responsive quality from a single screenshot.
- Do not let a strong hero inflate downstream scores.
- Do not call a page `Top Tier` when core runtime categories are missing or blocked by evidence.
