---
name: design-spec
description: Create an interactive HTML design review for a feature, collect explicit high-level human decisions through Lavish Editor, and persist an approved decision manifest before detailed spec creation. Use before create-spec for new features or material user-visible changes that need human choices about scope, behavior, business rules, compatibility, or risk. Do not use for small execute-task changes, pure refactors, or already-approved design decisions.
---

# Design Spec

Create the human-facing design approval artifact that precedes the detailed implementation spec.

## Required Resources

Before creating the artifact, read:

- `references/design-contract.md`

Use these bundled resources:

- `assets/design-review-template.html` as the starting HTML
- `scripts/validate_design_decisions.py` to validate the final decision manifest

Resolve all relative paths from the directory containing this `SKILL.md`.

## Workflow

1. Resolve the kebab-case `feature_slug`.
   - Under orchestrator, use the provided `feature_slug` exactly.
   - Write the review to `docs/ai/designs/{feature_slug}.html`.
   - Write approved decisions to `docs/ai/design-decisions/{feature_slug}.json`.
2. Inspect only the codebase context needed to present an accurate high-level design.
   - Confirm current behavior, affected surfaces, existing patterns, constraints, and conflicts.
   - Keep file-level implementation planning out of the human review unless it changes a high-level decision.
3. Choose exactly one result before opening Lavish:
   - `review-design`
   - `ask-human`
   - `split-slices`
   - `run-spike`
   - `escalate-conflict`
4. Stop without creating an approval manifest when the result is not `review-design`.
   - Ask at most five focused questions for `ask-human`.
   - Propose the smallest valuable executable slice for `split-slices`.
   - State the feasibility question for `run-spike`.
   - State the concrete codebase or business conflict for `escalate-conflict`.
5. For `review-design`, identify only decisions that materially change human-visible outcomes.
   - Include goal, target user, scope, primary flow, must-happen behavior, and must-not-happen behavior.
   - Ask about permissions, quotas, validation limits, ranking or fairness, defaults, fallback, persistence, compatibility, migration, destructive behavior, or rollout only when relevant.
   - Present a direct recommendation when one option is clearly better.
   - Present multiple options only when the correct choice depends on human priorities.
   - If no open choice remains, include one required approval decision for the recommended design.
6. Copy `assets/design-review-template.html` to the design path and replace all template content.
   - Use Vietnamese for all human-facing content.
   - Keep code symbols, paths, and JSON keys in English.
   - Remove every `REPLACE_` token and every sample-only note before opening the artifact.
   - Keep the artifact self-contained with inline CSS and JavaScript.
   - Do not add CDN scripts, remote fonts, analytics, or external assets.
7. Open the artifact with the pinned Lavish version:

   ```bash
   npx -y lavish-axi@0.1.43 <design-path>
   ```

   If `npx` is unavailable, use an already installed `lavish-axi` binary.
   If neither path works, stop as blocked and keep the HTML artifact.
8. Poll in the foreground and keep the review loop attached to the current agent turn:

   ```bash
   npx -y lavish-axi@0.1.43 poll <design-path> --agent-reply "Đã tạo bản design review. Hãy kiểm tra mục tiêu, scope và các quyết định được đánh dấu."
   ```

   - Never use shell backgrounding, `nohup`, `&`, or `disown` for the poll.
   - If the poll is interrupted, run it again; queued feedback is preserved.
   - If `layout_warnings` are returned, repair the HTML and recheck before asking the human to continue.
   - Apply annotations and feedback to the HTML, increment its revision, then poll again.
9. Treat only a prompt tagged `design-approval` whose text starts with `DESIGN_SPEC_APPROVAL` as approval.
   - Parse the JSON payload after the marker.
   - Require `approved: true`, the expected feature slug, the current design revision, and one answer for every required decision.
   - Feedback, annotations, ordinary chat messages, or a session end without this payload are not approval.
10. After valid approval:
    - do not mutate the approved HTML after receiving the payload
    - compute the SHA-256 of the exact reviewed HTML revision
    - write the decision manifest defined in `references/design-contract.md`
    - validate it with `scripts/validate_design_decisions.py`
    - end the Lavish session with `npx -y lavish-axi@0.1.43 end <design-path>`
11. Do not create the detailed Markdown spec from this skill.
    - `create-spec` consumes the approved decision manifest in the next workflow step.

## Review Surface Rules

- Optimize the page for high-level human judgment, not implementation completeness.
- Make confirmed facts visually distinct from assumptions and choices.
- Put the recommendation before alternatives.
- Show concrete tradeoffs beside each option.
- Keep technical evidence collapsible or secondary.
- Use semantic headings, fieldsets, legends, labels, buttons, and an `aria-live` status region.
- Preserve visible keyboard focus and at least 44px interactive targets.
- Do not rely on color alone for status or recommendation.
- Keep one final approval action that queues exactly one structured payload.

## Approval And Source Of Truth

- The HTML is the human review surface.
- The decision manifest is approval provenance for `create-spec` and `review-spec`.
- The later reviewed Markdown spec is the source of truth for implementation and verification.
- Never treat Lavish local state, DOM snapshots, or free-form prompts as the durable source of truth.
- Never publish or share the artifact through third-party hosting unless the human explicitly asks.

## Allowed Outcomes

- `Design approved`
- `Questions needed`
- `Slice proposed`
- `Spike required`
- `Conflict escalated`
- `Blocked`

## Orchestrator Contract

When run under `/orchestrator`, append exactly one HTML comment as the final output line.

- Design approved:
  `<!-- orchestrator: outcome=continue provides=design_path,design_decisions_path design_path=docs/ai/designs/{feature_slug}.html design_decisions_path=docs/ai/design-decisions/{feature_slug}.json -->`
- Questions needed or review ended without approval:
  `<!-- orchestrator: outcome=stop-ask-human -->`
- Slice proposed:
  `<!-- orchestrator: outcome=stop-split-slices -->`
- Spike required:
  `<!-- orchestrator: outcome=stop-run-spike -->`
- Conflict escalated:
  `<!-- orchestrator: outcome=stop-escalate-conflict -->`
- Lavish unavailable or another hard dependency is missing:
  `<!-- orchestrator: outcome=stop-blocked -->`

Emit `continue` only after both files exist and the decision manifest validator passes.

## Self-Check

- Does the HTML ask only material high-level questions?
- Are current facts, recommendations, alternatives, assumptions, and risks distinguishable?
- Does every required decision have a stable `D-xxx` identifier?
- Are all `REPLACE_` and sample-only tokens removed?
- Is the artifact local-only and self-contained?
- Did the human submit the explicit approval payload for the current revision?
- Does the manifest match the final HTML checksum?
- Did the validator pass before emitting `continue`?
