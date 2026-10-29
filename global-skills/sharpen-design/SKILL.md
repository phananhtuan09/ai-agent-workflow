---
name: sharpen-design
description: Human-invoked interview that stress-tests a plan or design and records confirmed project vocabulary and qualifying decisions. Use only when the user invokes this skill. Do not use to implement, to debug a bug, or to start the visual design kit.
disable-model-invocation: true
---

# Sharpen Design

## Status: experimental

- **Hypothesis**: an interview that records each confirmed term immediately, and records a decision only when it is hard to reverse, surprising without context, and a real trade-off, leaves fewer undefined terms and unexplained choices than an interview that only talks.
- **Success criteria**: across real runs, the human confirms the shared understanding, and the glossary entries and decision records from the session are kept more often than they are reverted as premature or wrong.
- It is not proven until real runs meet these criteria.
  Removing it leaves stress-testing to `design-interview` or `brainstorm-partner` without this recording session.

## Session

This skill runs only when the human invokes it.
Confirm, in the human's language, that the session interviews and records knowledge, and that it does not implement.
If the human writes in Vietnamese, the conversation is Vietnamese.
Never default the conversation to English.

Load `design-interview` and follow its rounds, reply syntax, fact research, and vocabulary checks.
If that skill cannot be loaded, stop and say so.
Do not invent a shorter interview.
Do not implement.

## What this skill may write

Durable writes go through `manage-project-knowledge` and the namespace contract the repository index declares.
Do not invent a file format when that contract is missing.
Report the gap and keep the term or decision in the conversation.

When the human explicitly confirms a project-specific term, record it before the next round.
When the index lists `docs/glossary/`, follow `docs/glossary/README.md`, including an update to its context list when that contract requires one.
A term inferred only from code goes to the observed namespace when it qualifies, or stays an open question.
It does not enter the glossary.

When the human accepts a decision, record it only when every admission test in the decisions contract passes.
Do not ask for a separate permission step before recording a decision that passes.
When any test fails, leave the decision unrecorded.

Glossary files are English.
The conversation stays in the human's language.

## Stop

The session is done when no question remains and the human confirms the shared understanding.
Do not implement after that confirmation unless the human makes a separate request.
Do not start a proposal, a plan, or a code change from this skill on your own.
