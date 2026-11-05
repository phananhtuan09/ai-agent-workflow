# Glossary and design interviews

Status: Accepted
Date: 2026-10-27
Scope: `docs/glossary/`, decision admission in `docs/decisions/`, and design questioning in `proposal-designer`, `planner`, `brainstorm-partner`, and the global skills `design-interview` and `sharpen-design`

## Context

Design discussions were leaving project vocabulary undefined, and they were asking the human for facts an agent can look up.
A single short batch of questions also hid choices that depended on answers not yet given.
This repository already records durable decisions in `docs/decisions/` and already has the agent write accepted knowledge without a separate permission step.
An external interview-and-docs skill pack uses a root glossary, a `docs/adr/` sequence, and an offer-to-write step.
Those mechanisms conflict with this repository's namespaces and with agent-maintained knowledge.

## Decision

1. Accepted project-specific vocabulary lives in `docs/glossary/`.
   The namespace README is the contract and lists contexts.
   A context file is created only when the human explicitly confirms the first term in that context.
   Each term states what it is, lists discouraged synonyms when they exist, and cites the confirming request.
   The agent writes that entry immediately, through `manage-project-knowledge`, before the next question round.
   A term inferred only from code is observed knowledge or an open question, and is not a glossary entry.
2. A decision record is created only when the human accepted the choice and all three admission tests hold: the choice is hard to reverse, a future reader would be surprised without the context, and the choice came from a real trade-off.
   The agent records that decision without asking for a separate permission step.
   This repository keeps `docs/decisions/` and its date-based filenames.
   It does not add a second decision tree.
3. A design interview asks every question whose prerequisites are resolved, in one numbered round, each with lettered options and one recommended answer.
   A short reply accepts every recommendation.
   `Q2: b` overrides one answer.
   Questions that depend on an open answer wait.
   The agent researches facts, using a sub-agent when the runtime provides one, and does not ask the human for those facts.
   The interview does not implement.
   It is finished when no questions remain and the human confirms the shared understanding.
4. `proposal-designer` uses those rounds on Create and Revise.
   Finalize checks proposal terms against the glossary.
   `brainstorm-partner` can use the same rounds and stays read-only, so it does not write glossary or decision files.
   `planner` routes a stress-test to the interview.
   A bare number still selects an option only from the latest next-step list.
5. The shared read-only procedure is the global skill `design-interview`.
   The human-invoked global skill `sharpen-design` runs that interview and records confirmed terms and qualifying decisions.
   It is experimental and is not invoked automatically.
   Project skills keep a fallback so an interview still runs when the global skill is not installed.

## Constraints

- Nothing in this repository installs, vendors, or requires the external skill pack the interview ideas were adapted from.
- Glossary files are English.
- Conversation follows the human's language.
- `brainstorm-partner` does not write glossary or decision files.
- Inferred knowledge stays out of `docs/glossary/`.
- Decision files stay in `docs/decisions/` under the existing filename rule.
- A design interview is not the default for ordinary decision-blocked work.
  That work still asks the smallest question.

## Consequences

- Positive: confirmed terms and qualifying decisions have one home each, and a design interview can proceed without asking the human for facts.
- Positive: future readers see why a hard-to-reverse choice was made, and routine choices stay out of `docs/decisions/`.
- Negative: `design-interview` and `sharpen-design` reach a machine only through the global-skill install, so a cloud session or a new contributor does not have them until that install is done.
- Negative: `sharpen-design` is unproven until real sessions meet the success criteria in that skill.
- Negative: project skills repeat a short fallback of the round rules so they still work before the global skill is installed.

## Alternatives considered

- Install or vendor the external skill pack.
  Rejected because the owner forbade that dependency and its glossary and decision layouts conflict with this repository.
- Store vocabulary only in the Definitions section of `docs/product/`.
  Rejected because a term needs its own confirmation rule and synonym list, separate from behavior rules.
- Add `docs/adr/` with sequential numbers.
  Rejected because `docs/decisions/` already records decisions.
- Ask permission before every decision record.
  Rejected because it conflicts with agent-maintained knowledge.
- Put the full interview only in global skills and leave `proposal-designer` unchanged.
  Rejected because Create and Revise are where proposal decisions are made, including in repositories that have not installed global skills.
- Make every decision-blocked task a design interview.
  Rejected because ordinary work stays on the smallest question, and the interview starts only when the human or the selected skill asks for it.

## References

- Human request, 2026-10-27: adapt design-interview, glossary, and three-part decision admission into this repository without installing an external skill pack.
- [Agent-maintained durable knowledge](2026-10-19-agent-maintained-knowledge.md)
- [Glossary contract](../glossary/README.md)
- [Decisions contract](README.md)
- Idea source, not a dependency: https://github.com/mattpocock/skills (`skills/engineering/grill-with-docs`, `skills/productivity/grilling`, `skills/engineering/domain-modeling`)
