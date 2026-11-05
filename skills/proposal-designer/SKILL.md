---
name: proposal-designer
description: Turn a vague product or feature idea into a reviewable proposal in docs/proposals, or review, revise, compare alternatives, and finalize an existing proposal before human approval. Create and Revise ask design questions in rounds and record confirmed terms. Finalize checks those terms against the glossary. Use for decisions that need product framing and high-level feasibility, not for ordinary bounded implementation work.
---

# Proposal Designer

Shape an idea into `docs/proposals/<topic>/proposal.md` so a human can decide whether to pursue it and which direction to take.
The proposal covers product intent and high-level technical feasibility.
Do not produce implementation tasks, API designs, schemas, class layouts, file structures, or code.
This skill is optional and does not make a proposal a prerequisite for normal repository work.

## Repository boundary

Read `AGENTS.md`, the relevant parts of `docs/WORKFLOW.md`, and `docs/proposals/README.md` before writing a proposal.
Inspect the smallest relevant product rules, decisions, code, and existing behavior.
Treat an unapproved proposal as a candidate, not accepted repository intent.
Surface conflicts with accepted intent instead of silently replacing it.
After approval, hand accepted long-lived product rules or decisions to their existing namespaces when the current task authorizes that work; the proposal does not replace `docs/product/` or `docs/decisions/`.

Use one topic directory and one `proposal.md` per proposal.
Keep research findings, review feedback, alternatives, and human decisions in that file when they materially affect the proposal.
Do not create companion review, research, decision, or task files for this capability.
Follow the local namespace contract for naming, status, and content.
A confirmed project-specific term, and a decision that passes the decisions admission tests, are recorded in their own namespaces through `manage-project-knowledge`.
They are not extra files inside the proposal directory.

## Choose the operation

- **Create:** Start with the human's idea, even if it is only one sentence.
  Investigate the problem, users, existing behavior, constraints, and feasible directions.
  Research uncertain external claims when material.
  Run question rounds for unresolved decisions that change the proposal materially.
  Write a draft using supported facts and clearly marked assumptions.
- **Review:** Start a fresh, independent sub-agent without conversation history when the runtime supports it.
  Give it only the complete `proposal.md` and the fixed criteria below.
  Do not pass prior conversation, author reasoning, intended answers, or extra explanations.
  The reviewer does not edit the file or redesign the proposal.
  Return findings to the author and human as advisory feedback.
  If a fresh isolated sub-agent is unavailable, report that independent review could not be performed; do not present a self-review as independent.
- **Revise:** Update the same file from human feedback, new research, or review findings.
  Resolve supported issues, preserve still-valid decisions, and leave unresolved material choices explicit.
  Run question rounds again when a new material choice appears.
  A substantive change to an Approved proposal returns it to Draft until the human approves the changed version.
- **Compare:** Investigate a small set of realistic alternatives in the current proposal.
  Explain how each meets the goal, its meaningful trade-offs, evidence, and limitations.
  Recommend a direction when one is clearly stronger.
  Ask the human to choose only when the remaining options differ materially in product, security, compatibility, cost, or operations.
- **Finalize:** Remove stale alternatives and resolved questions from the main recommendation, check that the proposed behavior and feasibility claims are coherent and sourced, check terms against the glossary, and mark the document Ready for Approval.
  Do this before the final human decision.
  Mark Approved only after the human explicitly approves that version; approval of an earlier version does not transfer to a substantively changed one.

Operations are entry points, not a required sequence.
Create may include comparison or revision when useful.
Run independent review when requested or when its findings would materially improve a consequential proposal; if review is invoked, preserve the independence rule above.
Reviewer feedback is advisory, and the human has final authority over approval.

## Research and questions

Investigate uncertainty that affects feasibility or the recommendation, including available solutions, third-party limits, platform constraints, and simpler approaches.
Use current primary sources when external facts may have changed.
Record consequential findings with source links or repository paths, relevant versions or dates, and distinguish evidence from inference.
Do not imply a library, service, or approach is feasible solely because it exists.
Do not research or compare options that would not change the decision.

Do not ask the human to supply a full requirement document before beginning.
Question rounds below are how Create and Revise ask for decisions.
If a blocking decision remains unanswered, keep the proposal Draft and state the open decision; do not invent approval.

## Question rounds

Use these rounds during Create and Revise for decisions that change the proposal materially.
Load `design-interview` when it is installed and follow its rounds and vocabulary checks.
This skill still owns the proposal file and the knowledge writes below.
When `design-interview` is not installed, follow this section and say that the shared skill is missing.

Map the open decisions as a tree.
Each round asks every question whose prerequisites are resolved, numbered Q1 onward.
A question that depends on an open question waits for a later round.
Each question has lettered options and exactly one recommended option marked ★.
Word it so `ok` accepts that recommendation.
`ok`, or a short affirmative reply with no override such as `yes` or `đồng ý`, accepts every recommended option.
`Q2: b` sets that question to option b and accepts the recommendation for every question the reply does not name.
Do not show a next-step list in the same turn.
Do not implement during the rounds.

Research facts yourself, including with a sub-agent when the runtime provides one and the lookup is more than a quick read.
Do not ask the human for a fact you can look up.
A lookup still running blocks only the questions that depend on it.
Ask the rest of the frontier in the current round.

Read `docs/glossary/` when it exists.
Challenge a term that conflicts with it.
Propose one canonical term for a fuzzy or overloaded term.
Invent a concrete edge-case scenario when a boundary is soft.
When the human's statement contradicts the code, report the drift and cite the code.
Do not rewrite the glossary or another authority artifact to match the code.

When the human explicitly confirms a term, record it before the next round through `manage-project-knowledge` and `docs/glossary/README.md`.
When an accepted decision meets every test in `docs/decisions/README.md`, record it the same way without asking for a separate permission step.
When a test fails, do not record a decision.
A term inferred only from code is not a glossary entry.

The rounds are done when no question remains and the human confirms the shared understanding.
Until then, keep the proposal Draft where a material choice is still open.
Write the conversation in the human's language.
If the human writes in Vietnamese, write in Vietnamese.
Glossary files stay English.

## Glossary check before approval

During Finalize, compare the proposal's project-specific terms with `docs/glossary/`.
Use the canonical term.
Leave a synonym listed under `_Avoid_` out of the proposal wording.
A missing or conflicting project-specific term blocks Ready for Approval until the human confirms it and the glossary records that confirmation.
A term inferred only from code stays out of the glossary and stays visible on the proposal as an assumption or as observed behavior.

## Fixed independent review criteria

Give the reviewer the complete proposal and exactly these criteria as its substantive review input:

1. **Problem:** Does the proposal address a specific, credible user problem and goal?
2. **Scope:** Are the included and excluded behaviors coherent and proportionate?
3. **User flow:** Are the main behavior, failure paths, and decision points understandable and consistent?
4. **Solution:** Does the recommended direction plausibly achieve the stated goal?
5. **Feasibility:** Are the high-level technical claims supported, and are material constraints or unknowns visible?
6. **Alternatives:** Is an obvious simpler or better direction missing or dismissed without reason?
7. **Risks and assumptions:** Could an untested assumption or unresolved decision change the recommendation?

The reviewer should report only concrete findings with the affected proposal section, why each matters, and a severity of blocking or advisory.
It may say that no material issue was found, but must not claim to have verified sources or runtime behavior it could not access.
Its assessment never approves the proposal.

## Handoff

Report the proposal path, current status, recommendation, material open decisions, sources or checks actually used, and any independent review limitation.
Do not start planning or implementation from this skill.
