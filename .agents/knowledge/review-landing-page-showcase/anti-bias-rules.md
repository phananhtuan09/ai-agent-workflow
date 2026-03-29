# Anti-Bias Rules — Landing Page Showcase

Use these rules to prevent inflated scores caused by style halo, novelty, or reviewer overconfidence.

---

## Core Rules

1. A strong hero does not automatically raise:
- Storytelling / Flow
- Typography across the full page
- Final Polish
- Technical Execution

2. Heavy motion does not automatically raise:
- Motion Design quality
- Interaction Design
- Performance

3. Visual polish does not automatically raise:
- Frontend Craft
- QA Readiness
- Accessibility

4. Dark themes, glows, cinematic video, or premium-sounding copy do not automatically imply premium execution.

5. Novelty should not outrank readability, comfort, or control.

6. A visually striking desktop should not mask weak tablet or mobile behavior.

7. A smooth experience on one powerful machine should not imply strong performance on mid-range devices.

---

## Required Separation

For every category, split reasoning into:

- `Observed`: What was directly seen or measured
- `Inference`: What is being concluded from that evidence

If the inference is doing most of the work, lower confidence and consider `Provisional` or `Unverified`.

---

## Common Failure Patterns

### Halo From Hero

Symptom:

- Hero is excellent, so later sections are scored too generously.

Fix:

- Re-score downstream sections after ignoring the hero mentally.

### Flashy Motion Bias

Symptom:

- Large or frequent animations are mistaken for quality.

Fix:

- Judge timing, hierarchy, smoothness, restraint, and usability impact separately.

### Premium Aesthetic Bias

Symptom:

- Luxury styling is assumed to equal strong brand or craft.

Fix:

- Ask whether identity is unique and whether the implementation is stable.

### Screenshot Confidence Bias

Symptom:

- Runtime-only categories receive strong scores from still images.

Fix:

- Apply `evidence-matrix.md` strictly and cap confidence.

---

## Reviewer Reset Questions

Ask these before finalizing:

- If the hero were removed, would the rest still score highly?
- If the motion were disabled, would the page still feel premium?
- If this were tested on a mid-range phone, would the experience likely hold up?
- Am I rewarding style signals instead of actual control?
