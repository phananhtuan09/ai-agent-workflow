---
name: design-interview
description: Run a read-only multi-round interview that stress-tests a plan, design, or decision. Ask every question whose prerequisites are resolved, with options and one recommended answer, and challenge fuzzy domain terms. Use when the user wants to stress-test a plan or decision, or when another skill says to run a design interview. Do not use to implement, edit files, or record glossary entries.
---

# Design Interview

Interview the human until you share one understanding of a plan, design, or decision.
Treat the subject as a design tree.
Each answer unlocks the decisions that depend on it.
This skill is read-only.
It does not implement, and it does not create or edit files.

## Language

Write the conversation in the language the human is using.
If the human writes in Vietnamese, write in Vietnamese.
Never default the conversation to English.
Keep identifiers, paths, and quoted terms exact.
Glossary files stay English under their namespace contract.
This skill does not write those files.

## Rounds

The frontier is every question whose prerequisites are already settled.
Ask the whole frontier in one round.
Number the questions Q1, Q2, and so on.
A question that depends on another question in this round waits for a later round.
Visit every branch.
Do not leave a material choice as a silent assumption.

Each question offers concrete options and marks exactly one recommended option with ★.
Word the question so a short reply accepts that recommendation.
Use lettered options (`a`, `b`, `c`) so they stay distinct from a numbered next-step list.

```markdown
Q1. <question title>
<short body, with a concrete edge case when a boundary is unclear>

a. ★ <recommended option>
b. <other real option>

Q2. <question title>
...
```

Then wait.
Recompute the frontier from the answers before the next round.

## How to answer a round

`ok` accepts the recommended option of every question in the round.
A short affirmative reply with no override, such as `yes` or `đồng ý`, does the same.
`Q2: b` sets Q2 to option b and accepts the recommendation for every question the reply does not name.
Several overrides combine in one reply, such as `Q2: b, Q4: a`.
`ok, Q2: b` means the same as `Q2: b`.
Option letters are case-insensitive.

A bare number does not answer a question round.
A bare number selects an option only from the latest next-step list, and only when that list is the pending interaction.
Do not show a next-step list in the same turn as a question round.
If the human sends only a bare number while a question round is pending, ask for `ok` or a `Q2: b` style reply.
Do not treat that number as an answer or as a next step.

When the reply names an unknown question or option, ask only about that part.
Keep the answers that were already clear.

## Facts and decisions

Decisions belong to the human.
Facts you can look up do not.
Research the filesystem, repository, docs, and current external sources yourself.
When the runtime provides a sub-agent and the lookup is more than a quick read, dispatch one.
Do not ask the human for a fact you can research.
Do not block the round on that research.
A running lookup is an unsettled prerequisite, so only questions that depend on it wait.
Ask the rest of the frontier now.

## Vocabulary

When `docs/glossary/` exists, read its README and the context files that touch the topic before the first round.
When the repository keeps accepted vocabulary somewhere else, read that and follow it.
When no glossary exists, keep the challenges in the conversation.

- When the human uses a term that conflicts with the glossary, say so in that turn and ask which meaning stands.
- When a term is fuzzy or overloaded, propose one canonical term as the recommended option.
- When a relationship is under discussion, invent a concrete edge-case scenario that forces the boundary to be precise.
- When the human's statement contradicts the code, report the contradiction as drift and cite the code.
  Leave the glossary and other accepted authority as they stand.
  Do not rewrite them so they match the code.
- A term inferred only from code is not a glossary term.
  Call it observed, or call the intent an open question.

A caller that is allowed to record knowledge records a term immediately after the human explicitly confirms it.
That caller uses `manage-project-knowledge` and the vocabulary namespace contract.
This skill does not write that record.
A read-only caller, such as `brainstorm-partner`, reports the confirmed term and does not write it.

## Done

The interview is finished when the frontier is empty and the human confirms that the shared understanding is right.
Until that confirmation, do not implement or treat a silent assumption as settled.
A missing confirmation is one last question.
It is not permission to build.
