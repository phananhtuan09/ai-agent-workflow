---
name: planner
description: Session-long navigation mode for the repository workflow, started only when the human invokes /planner. For every later prompt, pick the fitting workflow step or skill, do it, and end with two or three numbered next steps the human can choose by replying with a number.
disable-model-invocation: true
---

# Planner

The human wants to steer by choosing, not by writing the next prompt.
For each prompt, work out where the task sits in the repository workflow, do the fitting step, then offer the next steps as numbered choices.

Follow the repository's `AGENTS.md` or `CLAUDE.md` and `docs/WORKFLOW.md`; this mode adds navigation and never overrides their authority, work-shape, or proof rules.

## Activation

When invoked, confirm in two or three lines, in the human's language, that planner mode is on for this conversation: you pick and run steps, end each turn with numbered choices, and ask first before git, outward actions, or unresolved product decisions.
Do not inspect the repository on activation.
If the invocation carries a request, handle it in the same turn.

The mode lasts for the whole conversation until the human asks to stop it.
Nothing re-injects it after context compaction, so if the choices stop appearing, the human re-invokes `/planner`.
When the assigning prompt specifies a report format, such as an orchestrator worker prompt, follow Assigned report format instead of the human-facing rules below.

## Each turn

1. Read the prompt.
   A bare number answers the latest choice list: do exactly that option as written.
   With no pending list, treat a number as an ordinary prompt.
   A new request replaces pending choices; do not repeat them.
2. Resolve ambiguity from evidence before guessing or asking: the conversation, the working-tree diff, `docs/plans/active/`, `docs/product/`, and `docs/decisions/`.
   For a prompt such as "continue" or "keep going", inspect active plans, `git status`, and recent commits read-only, then offer choices without acting.
3. Weigh what a wrong guess would cost.
   - Cheap: internal, reversible code, or a visible UI change that does not change logic or data.
     Pick the most likely reading, do it, and state the guess on the first line as an assumption.
   - Expensive: a product, security, compatibility, or data rule, irreversible effects, or large effort.
     Do not act; offer two or three concrete readings drawn from the repository as numbered choices, with the recommended one marked.
   - Unclear target, such as "fix that form" with several candidates: offer the candidates as choices.
4. Locate the task on the workflow map, do the fitting step, and prove it as `docs/WORKFLOW.md` requires.
5. End with the choices described in Output, except where Activation or Output omits them.

## Assigned report format

When the assigning prompt specifies how to report, such as a Foreman worker prompt, no human reads your turns and the format is the only output channel.
In that case:

- Skip the activation confirmation and the next-step block; the final message is exactly what the format asks for, with nothing before or after it.
- Never end with a question.
  Where this skill would ask first or offer readings, stop and report in the format's blocked status (or its nearest equivalent) with the options as the format's own list.
- Add no numbered list beyond the one the format allows.
- Resources, mode, and limits in the assigning prompt, such as a read-only round, override the workflow map and skill routing.
- Everything else, including evidence-first ambiguity handling, skill routing, and proof, still applies.

## Workflow map

```text
Idea → Proposal → Approval → Plan (if durable) → Implement → Prove → Knowledge (if a rule changed) → Commit → Review → PR
```

| Work | Usual path |
| --- | --- |
| Bug or regression | Reproduce → fix → prove → check similar code → commit |
| Vague feature idea | Proposal → approval → plan → one plan step per turn |
| Small change | Change → visual or focused check → commit |
| Question | Answer with evidence → optional pattern, runbook, or test |
| Technical decision | Brainstorm → record the decision → spike |
| Finished work | Commit → review → PR |

Do one plan step per turn for durable work, keep the plan current, and suggest the next step instead of running the whole plan.

## Skill routing

Pick the skill yourself and load it with the Skill tool before doing that kind of work; following its steps from memory does not count.
If a skill is not installed, apply `docs/WORKFLOW.md` directly and say the skill is missing.
`brainstorm-partner` and `smart-commits` are machine-wide global skills, not installed by any bundle.

| Situation | Skill |
| --- | --- |
| Reported or discovered bug | None; reproduce the failure first |
| Lint, type, build, or CI failures | `quality-code-check` |
| Vague product idea that needs framing | `proposal-designer` |
| Multi-case user flow or API acceptance, proved now (light) or kept re-runnable (durable) | `runtime-e2e-test` |
| Hard bug, unclear logic, or technical trade-off to think through | `brainstorm-partner` |
| Review a PR, branch, or diff | `review-pr` |
| The human invokes `/validate-change` to accept a change just made | `validate-change`; never start it yourself |
| The human invokes `/security-performance-check` for a targeted security or performance check | `security-performance-check`; never start it yourself |
| Task accepted, changed, or invalidated durable knowledge | `manage-project-knowledge` |
| Commit or push the human asked for | `smart-commits` |
| The human asks to log agent friction | `record-workflow-friction` |
| The human asks to evaluate the workflow | `workflow-evaluation` |

Which command fits what the human wants:

| The human wants to… | Command |
| --- | --- |
| Accept a PR or a change just made | `/validate-change` |
| Targeted security check on a change | `/security-performance-check` |
| Re-test existing features or build a durable suite | `/runtime-e2e-test` (durable) |
| Only runtime E2E on a change | `/runtime-e2e-test` (light) |
| Only lint, type check, or build | `/quality-code-check` |
| Review someone else's PR or a diff | `/review-pr` |

When the human asks to accept a change without naming a command, offer `/validate-change` as a choice instead of running it.

Keep each skill's own stop points, such as plan or proposal approval, and offer that approval as a choice.
When a skill puts the session in read-only mode, always include a choice that leaves it.
When the human complains about agent behavior without asking to log it, offer `record-workflow-friction` as a choice instead of running it.

## Ask first

Ask before:

- git actions: commit, push, branch create or switch, stash, reset, or history rewrite;
- outward actions: PR or issue comments, messages, deploys, or publishing;
- unresolved product, security, compatibility, or operational decisions.

An explicit request in the current prompt, or choosing a numbered option that names that exact action, approves that action only.
A commit request does not cover push.

## Durable knowledge

Maintain durable knowledge yourself with `manage-project-knowledge` before reporting a step; do not offer it as a choice or wait for approval.
An answered decision question, or a picked option that states lasting behavior or a decision, is accepted knowledge; picking a next step such as testing or committing accepts nothing.
List knowledge files you changed in the main answer so the human can see them.

## Output

Write the main answer freely and briefly, in the human's language: result in behavior terms, evidence actually observed, and anything not verified.
Never present a check as passed unless you observed it pass.
When you guessed, start with one assumption line.

End with the next-step block, its heading in the human's language:

```markdown
Next:
1. ★ Add an E2E test for plus-sign email login (`runtime-e2e-test`)
2. Search for other unencoded emails in URLs
3. Commit the fix (`smart-commits`)
```

- Two or three options, each about fifteen words or fewer and concrete enough to run without another question.
- Mark exactly one option with ★, ranked by: unresolved risk such as unproven changes, red CI, or open decisions; then finishing the current goal; then shipping through commit, push, or PR.
- Name the skill when an option uses one.
- Rank lower the options the human has skipped repeatedly in this conversation.
- Decision questions use the same numbered format, with ★ on the recommendation.
- Omit the block when no next step is worth doing.
