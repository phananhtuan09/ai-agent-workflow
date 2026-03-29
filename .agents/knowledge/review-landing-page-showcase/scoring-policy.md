# Scoring Policy — Landing Page Showcase

This file defines score status, total calculation, confidence limits, and verdict eligibility.

Use it together with:

- `rubric.md`
- `evidence-matrix.md`
- `output-template.md`

---

## Score Status

Every category must include one of these statuses:

- `Scored`: Enough evidence exists to assign a normal score.
- `Provisional`: Some evidence exists, but coverage is incomplete.
- `Unverified`: Not enough evidence to defend a score.
- `N/A`: Category does not apply to the page or review request.

---

## How To Score Each Status

### Scored

- Assign a `0-5` rating.
- Include weighted score.
- Count it in total normally.

### Provisional

- Assign a `0-5` rating with explicit uncertainty.
- Count it in total normally.
- Lower overall confidence if several core categories are provisional.

### Unverified

- Do not assign a numeric rating.
- Do not assign weighted score.
- Exclude it from the achieved-points total.
- Exclude its weight from the verified-weight total.
- Add an `Evidence Limits` note and a `Coverage Warning`.

### N/A

- Do not assign a numeric rating.
- Do not assign weighted score.
- Exclude it from achieved-points total and verified-weight total.
- Use sparingly. Most categories should be `Scored`, `Provisional`, or `Unverified`, not `N/A`.

---

## Total Calculation

Use two totals:

### Verified Total

```text
verified_total = sum(weighted_scores for Scored or Provisional categories)
verified_max = sum(weights for Scored or Provisional categories)
normalized_total = (verified_total / verified_max) * 100
```

Report this as:

```text
Total: X / 100 (verified scope)
```

### Coverage

Also report:

```text
Coverage: verified_max / 100
```

This prevents fake precision when important categories are unverified.

---

## Confidence Rules

- Overall confidence cannot exceed the ceiling from `evidence-matrix.md`.
- If three or more categories are `Unverified`, overall confidence should usually be `Low`.
- If any of `Motion`, `Performance`, `Responsive`, `Typography` are `Unverified`, overall confidence cannot exceed `Medium`.
- If two or more of those core categories are `Unverified`, overall confidence should be `Low`.

---

## Top-Tier Eligibility

A page must not be labeled `Top Tier` if any of these are true:

- `Motion Design / Animation Quality` is below `3/5`
- `Performance` is below `3/5`
- `Responsive Design` is below `3/5`
- `Typography` is below `3/5`
- Any of those four categories are `Unverified`
- Coverage is below `80 / 100`
- Overall confidence is below `Medium`

If those conditions fail, downgrade the verdict to the strongest eligible label and explain why.

---

## When To Use N/A

Only use `N/A` when the category genuinely does not apply, for example:

- a no-motion page being reviewed only as a static visual system, if motion is explicitly out of scope
- a concept-board review where QA readiness is intentionally excluded

Do not use `N/A` just because evidence is missing. Use `Unverified` instead.

---

## Report Requirements

Every final review must include:

- category status
- observed evidence
- inference
- weighted score only when a score exists
- `Total` on verified scope
- `Coverage`
- `Evidence Limits`
- verdict ceiling explanation when coverage blocks a stronger verdict
