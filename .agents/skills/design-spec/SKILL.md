---
name: design-spec
description: Create or resume a local interactive HTML design review for a feature, collect high-level human decisions through the bundled local runner, and persist an approved decision manifest before detailed spec creation. Use before create-spec for new features or material user-visible changes that need human choices about scope, behavior, business rules, compatibility, or risk. Do not use for small execute-task changes, pure refactors, or already-approved design decisions.
---

# Design Spec

Create the human-facing design approval artifact that precedes the detailed implementation spec.

## Required Resources

Before creating or resuming the artifact, read:

- `references/design-contract.md`

Use these bundled resources:

- `assets/design-review-template.html` as the starting HTML
- `scripts/design_review_server.py` to serve the review and persist approval or feedback
- `scripts/validate_design_review.py` to preflight the human-facing HTML
- `scripts/validate_design_decisions.py` to validate the final decision manifest

Resolve all relative paths from the directory containing this `SKILL.md`.

## Workflow

1. Resolve the kebab-case `feature_slug`.
   - Under orchestrator, use the provided `feature_slug` exactly.
   - Write the review to `docs/ai/designs/{feature_slug}.html`.
   - Write approved decisions to `docs/ai/design-decisions/{feature_slug}.json`.
   - Read human change requests from `docs/ai/design-feedback/{feature_slug}.json`.
2. Inspect only the codebase context needed to present an accurate high-level design.
   - Confirm current behavior, affected surfaces, existing patterns, constraints, and conflicts.
   - Keep file-level implementation planning out of the human review unless it changes a high-level decision.
3. If a decision manifest already exists, validate it.
   - Run `scripts/validate_design_decisions.py docs/ai/design-decisions/{feature_slug}.json --repo-root <repo-root>`.
   - If validation passes, stop the local runner if it is still running and emit `continue`.
   - If validation fails, report the validator error and emit `stop-blocked`.
4. If feedback exists for the current design revision, apply it before reopening review.
   - Treat `docs/ai/design-feedback/{feature_slug}.json` as the latest human change request.
   - If its `design_revision` matches the HTML `data-design-revision`, update the HTML, increment the revision, and reopen review.
   - If its `design_revision` is older than the HTML revision, treat it as already handled and continue the normal review-open path.
   - Do not create a manifest from feedback.
5. Choose exactly one result before opening review:
   - `review-design`
   - `ask-human`
   - `split-slices`
   - `run-spike`
   - `escalate-conflict`
6. Stop without creating an approval manifest when the result is not `review-design`.
   - Ask at most five focused questions for `ask-human`.
   - Propose the smallest valuable executable slice for `split-slices`.
   - State the feasibility question for `run-spike`.
   - State the concrete codebase or business conflict for `escalate-conflict`.
7. For `review-design`, identify only decisions that materially change human-visible outcomes.
   - Include goal, target user, scope, output preview, primary flow, must-happen behavior, and must-not-happen behavior.
   - Express must-happen and must-not-happen inside the summary, scope, flow, or constraints; do not create duplicate sections for them by default.
   - Ask about permissions, quotas, validation limits, ranking or fairness, defaults, fallback, persistence, compatibility, migration, destructive behavior, or rollout only when relevant.
   - Present a direct recommendation when one option is clearly better.
   - Present multiple options only when the correct choice depends on human priorities.
   - If no open choice remains, include one required approval decision for the recommended design.
   - Keep the default review to one to three required decisions, at most five bullets per scope or output-preview list, and two to six flow nodes.
   - Target no more than 700 words visible on initial load; put technical detail in collapsed evidence sections.
   - Use exactly one `Bản xem trước đầu ra` section.
   - Select one preview kind: `ui`, `api`, `full-stack`, `workflow`, `data`, or `generic`.
   - For `ui`, graph the implemented user interaction from action through UI state, request or local processing, and feedback.
   - For `api`, graph the consumer, endpoint, authorization and validation, domain or persistence boundary, and response.
   - For `full-stack`, graph the observable path across user, frontend, backend, persistence or infrastructure, and returned UI state.
   - For other kinds, graph the smallest meaningful input-to-output lifecycle.
8. Copy `assets/design-review-template.html` to the design path and preserve its structure and behavior.
   - Use Vietnamese for all human-facing content.
   - Keep code symbols, paths, and JSON keys in English.
   - Remove every `REPLACE_` token and every sample-only note before opening the artifact.
   - Replace placeholders and decision cards in place; add a new top-level section only when a material decision cannot be represented by the template.
   - Keep the artifact self-contained with inline CSS and JavaScript.
   - Do not add CDN scripts, remote fonts, analytics, or external assets.
   - Keep approve and request-changes controls inside the HTML and wired to the local runner endpoints.
9. Run the HTML preflight before opening the review:

   ```bash
   python3 .agents/skills/design-spec/scripts/validate_design_review.py docs/ai/designs/{feature_slug}.html
   ```

   - Fix validation errors before starting the runner.
   - Treat density warnings as a prompt to shorten or collapse content.
10. Start or reuse the local runner:

   ```bash
   python3 .agents/skills/design-spec/scripts/design_review_server.py --repo-root <repo-root> start docs/ai/designs/{feature_slug}.html
   ```

   - The runner binds to `127.0.0.1`, serves the HTML, and exits the command after printing the local URL.
   - It continues running as a local background process so the human can review asynchronously.
   - If the runner cannot start, stop as blocked and keep the HTML artifact.
11. Stop after opening the review and ask the human to review asynchronously.
    - Report the local runner URL and design path in prose.
    - Tell the human to use `Approve design` to write the manifest or `Request changes` to write feedback.
    - Tell the human to ask the agent or orchestrator to continue after they approve or request changes.
    - Under orchestrator, emit `stop-ask-human` because approval has not been collected yet.
12. On a later invocation, inspect artifacts instead of waiting on a live poll.
    - If `docs/ai/design-decisions/{feature_slug}.json` exists and validates, emit `continue`.
    - If `docs/ai/design-feedback/{feature_slug}.json` exists for the current revision, apply feedback and reopen review.
    - If neither exists, restart or report the runner URL and emit `stop-ask-human`.
13. Do not create the detailed Markdown spec from this skill.
    - `create-spec` consumes the approved decision manifest in the next workflow step.

## Review Surface Rules

- Optimize the page for high-level human judgment, not implementation completeness.
- Make confirmed facts visually distinct from assumptions and choices.
- Put the recommendation before alternatives.
- Show concrete tradeoffs beside each option.
- Keep technical evidence collapsible or secondary.
- Keep the header compact and subordinate to the review content.
- Put the single output-preview section immediately after the compact summary, followed by the decision cards.
- Render the primary flow as a semantic graph with labeled nodes and directional connectors.
- Stack graph nodes vertically on narrow screens.
- Keep the JSON preview collapsed by default.
- Use semantic headings, fieldsets, legends, labels, buttons, and an `aria-live` status region.
- Preserve visible keyboard focus and at least 44px interactive targets.
- Do not rely on color alone for status or recommendation.
- Provide a final general feedback textarea.
- Show a live JSON preview so the human can see what approval will persist.
- Do not rely on sidebar prompts, DOM snapshots, or browser local state as approval provenance.

## Approval And Source Of Truth

- The HTML is the human review surface.
- The local runner is the approval and feedback transport.
- The decision manifest persists the approved output preview, scope, decisions, and constraints for `create-spec` and `review-spec`.
- The later reviewed Markdown spec is the source of truth for implementation and verification.
- Never treat chat text, DOM snapshots, screenshots, downloaded diagnostic JSON, or free-form prompts as the durable source of truth.
- Never publish or share the artifact through third-party hosting unless the human explicitly asks.

## Allowed Outcomes

- `Design approved`
- `Design review opened`
- `Questions needed`
- `Slice proposed`
- `Spike required`
- `Conflict escalated`
- `Blocked`

## Orchestrator Contract

When run under `/orchestrator`, append exactly one HTML comment as the final output line.

- Design approved:
  `<!-- orchestrator: outcome=continue provides=design_path,design_decisions_path design_path=docs/ai/designs/{feature_slug}.html design_decisions_path=docs/ai/design-decisions/{feature_slug}.json -->`
- Design review opened, questions needed, or review ended without approval:
  `<!-- orchestrator: outcome=stop-ask-human -->`
- Slice proposed:
  `<!-- orchestrator: outcome=stop-split-slices -->`
- Spike required:
  `<!-- orchestrator: outcome=stop-run-spike -->`
- Conflict escalated:
  `<!-- orchestrator: outcome=stop-escalate-conflict -->`
- Local runner unavailable, invalid manifest, or another hard dependency is missing:
  `<!-- orchestrator: outcome=stop-blocked -->`

Emit `continue` only after both files exist and the decision manifest validator passes.

## Self-Check

- Does the HTML ask only material high-level questions?
- Is the initial visible review concise enough to scan in one or two minutes?
- Does the output preview show what will exist and how it will operate without becoming an implementation spec?
- Does the graph match the selected preview kind and contain no more than six nodes?
- Are current facts, recommendations, alternatives, assumptions, and risks distinguishable?
- Does every required decision have a stable `D-xxx` identifier?
- Are all `REPLACE_` and sample-only tokens removed?
- Is the artifact local-only and self-contained?
- Did the initial review path stop without polling or writing a manifest?
- On resume, did the skill inspect manifest and feedback artifacts before reopening review?
- Does the manifest match the final HTML checksum?
- Did the validator pass before emitting `continue`?
