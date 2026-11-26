---
name: propose
description: Turn a vague product or feature idea into a reviewable proposal in docs/proposals, or review, revise, compare alternatives, and finalize an existing proposal before human approval. Use for decisions that need product framing and high-level feasibility, not for ordinary bounded implementation work.
---

# Propose

Shape an idea into `docs/proposals/<topic>/proposal.md` so a human can decide whether to pursue it and which direction to take.
The proposal covers product intent and high-level technical feasibility.
Do not produce implementation tasks, API designs, schemas, class layouts, file structures, or code.
This skill is optional and does not make a proposal a prerequisite for normal repository work.

## Repository boundary

Read `AGENTS.md`, the relevant parts of `docs/WORKFLOW.md`, and `docs/proposals/README.md` before writing a proposal.
Inspect the smallest relevant product rules, decisions, code, and existing behavior.
Treat an unapproved proposal as a candidate, not accepted repository intent.
Surface conflicts with accepted intent instead of silently replacing it.
After approval, record accepted long-lived product rules or decisions in `docs/DECISIONS.md` when the current task authorizes that work; the proposal does not replace `docs/DECISIONS.md`.

Use one topic directory with one `proposal.md` and at most one optional `mockup.html`.
Keep research findings, review feedback, alternatives, and human decisions in `proposal.md` when they materially affect the proposal.
Do not create companion review, research, decision, or task files for this capability.
Follow the local namespace contract for naming, status, and content.

## Choose the operation

The human does not need to name an operation.
Infer it from the request and the proposal's current state:

- No proposal exists for the topic: Create.
- Draft with new feedback, Grill results, research, or review findings: Revise.
- Draft that needs a direction chosen between realistic options: Compare.
- Draft with no open decision: Finalize, after offering independent review when the proposal is consequential.
- Ready for Approval: wait for the human's approval or requested changes.

When the human names an operation, run that one.

- **Create:** Start with the human's idea, even if it is only one sentence.
  Investigate the problem, users, existing behavior, constraints, and feasible directions.
  Research uncertain external claims when material.
  Ask only for unresolved decisions that change the proposal materially.
  Write a draft using supported facts and clearly marked assumptions.
- **Review:** Start a fresh, independent sub-agent without conversation history when the runtime supports it.
  Give it only the complete `proposal.md` and the fixed criteria below.
  Do not pass prior conversation, author reasoning, intended answers, or extra explanations.
  The reviewer does not edit the file or redesign the proposal.
  Return findings to the author and human as advisory feedback.
  If a fresh isolated sub-agent is unavailable, report that independent review could not be performed; do not present a self-review as independent.
- **Revise:** Update the same file from human feedback, Grill results, new research, or review findings.
  Resolve supported issues, preserve still-valid decisions, and leave unresolved material choices explicit.
  When a finding or gap can only be closed by choosing externally observable behavior, such as what a user sees, when, or who may act, ask the human instead of choosing; record the question as open until answered.
  A substantive change to an Approved proposal returns it to Draft until the human approves the changed version.
- **Compare:** Investigate a small set of realistic alternatives in the current proposal.
  Explain how each meets the goal, its meaningful trade-offs, evidence, and limitations.
  Recommend a direction when one is clearly stronger.
  Ask the human to choose only when the remaining options differ materially in product, security, compatibility, cost, or operations.
- **Finalize:** Remove stale alternatives and resolved questions from the main recommendation, check that the proposed behavior and feasibility claims are coherent and sourced, and mark the document Ready for Approval.
  Do this before the final human decision.
  Mark Approved only after the human explicitly approves that version; approval of an earlier version does not transfer to a substantively changed one.
  Choosing the numbered next step that approves the current version counts as explicit approval of that version.

Operations are entry points, not a required sequence.
Create may include comparison or revision when useful.
Reviewer feedback is advisory, and the human has final authority over approval.

## Mockup

A mockup is an optional illustration at `docs/proposals/<topic>/mockup.html`.
It is never required to finalize or approve a proposal.
This skill does not create or edit the mockup; it suggests the `impeccable` command that does.
When a mockup exists and a later revision substantively changes the flows, screens, or states it shows, say the mockup is stale and suggest regenerating it.

## Research and questions

Investigate uncertainty that affects feasibility or the recommendation, including available solutions, third-party limits, platform constraints, and simpler approaches.
Use current primary sources when external facts may have changed.
Record consequential findings with source links or repository paths, relevant versions or dates, and distinguish evidence from inference.
Do not imply a library, service, or approach is feasible solely because it exists.
Do not research or compare options that would not change the decision.

Ask focused questions in one batch only after available evidence has narrowed the choices.
Present the recommended option and the concrete trade-offs when the human must decide.
Do not ask the human to supply a full requirement document before beginning.
If a blocking decision remains unanswered, keep the proposal Draft and state the open decision; do not invent approval.

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

End every reply with numbered next steps and mark exactly one with ★ as the recommendation.
The human picks a step by its number.
Offer only steps that fit the current state.
A step marked "always listed" must appear whenever its state applies, even when another step carries the ★:

| State | Step to offer |
| --- | --- |
| Draft with two or more open decisions | Grill them with `brainstorm-partner` (always listed); answering them directly may also be listed |
| Draft with one open decision | Answer it directly |
| Realistic alternatives not yet compared | Compare |
| The proposal describes a user interface or flow and has no mockup | Create a mockup with `impeccable` |
| The mockup is stale | Regenerate the mockup with `impeccable` |
| Consequential proposal with no open decision whose current version has not been independently reviewed, including after a substantive revision | Independent review, offered before Finalize |
| Review findings exist | Revise from the findings |
| Draft with no open decision | Finalize |
| Ready for Approval | Approve this version; request changes |
| Approved | Record lasting rules in `docs/DECISIONS.md`; plan or implement through the normal workflow; stop |

Never load or invoke another skill yourself.
For a step that belongs to another skill, print a ready-to-copy command with the proposal path filled in, for example:

- `/brainstorm-partner grill docs/proposals/<topic>/proposal.md`
- `/impeccable mockup for docs/proposals/<topic>/proposal.md, save to docs/proposals/<topic>/mockup.html`

When the human picks such a step by number, print the command again instead of running it.
If that skill does not appear to be installed, still print the command and add how to install it: `brainstorm-partner` through the `global-skills/README.md` of the ai-workflow-init kit, and `impeccable` with `npx impeccable install --scope=global --no-hooks`.
