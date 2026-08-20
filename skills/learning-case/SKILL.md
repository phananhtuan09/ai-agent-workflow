---
name: learning-case
description: Select, create, validate, or serve facts and predeclared consequences for a software-engineering learning case. Use internally from learning-workflow or directly when the human wants to prepare, inspect, validate, or create a case. Do not coach, assess the learner, or run experiments.
---

# Learning Case

Own case integrity without taking over the learning conversation.

Read `docs/ai/project/WORKFLOW_LEARNING_CONSTITUTION.md` and `docs/ai/project/WORKFLOW_LEARNING_STANDARD.md` before changing or serving a case.

When invoked by `learning-workflow`, return a concise structured result to the coordinator and do not address the human directly.

When invoked directly, complete only the requested case operation and do not start or advance a learning session.

## Modes

### Select

Input:

- human-approved goal;
- competency evidence and current gaps;
- requested difficulty or `unknown`;
- continuity preference or `unknown`.

Prefer an existing case that exercises the active competency without repeating a memorized solution.

Recommend a competency or case but never decide the human's learning direction.

Return:

```json
{
  "status": "case-selected",
  "case_path": "...",
  "competency": {},
  "reason": "...",
  "limitations": [],
  "requires_human_approval": true
}
```

### Create

Create the smallest realistic case that can produce the requested learning evidence.

Write it to `docs/ai/learning/cases/{case_id}.json` using schema `learning-case/v1`.

The case must contain:

- business goal and current context;
- explicit simulation or source provenance;
- declared assumptions and case history;
- one active competency;
- explicit protected judgments;
- public and discoverable facts;
- a discovery path for every discoverable fact;
- future events declared before assessment;
- an observable rubric;
- a transfer prompt.

Do not include a canonical solution.

Do not add technology, scale, failure, or complexity without a supporting constraint.

Validate the file with the validator in the sibling `learning-workflow` skill before returning it.

### Discover

Input:

- case path;
- exact human question;
- facts already disclosed.

Return only facts whose public visibility or discovery path directly supports the question.

Do not return implications, recommendations, options, hidden rubric details, or future events.

Return:

```json
{
  "status": "fact-found",
  "facts": [{"id": "F-001", "statement": "..."}],
  "question": "...",
  "matched_discovery_path": "...",
  "material_assistance": false
}
```

If the case has no grounded answer, return `status: unknown-in-case`.

### Release Consequence

Input:

- case path;
- session state;
- candidate event ID.

Release an event only when its predeclared trigger is satisfied.

Return the event ID, statement, purpose and record IDs that prove its predeclared trigger is satisfied without interpreting it for the human.

Never create or modify an event after seeing the human's decision in order to make that decision wrong.

### Transfer

Create a case in a different domain or constraint context that exercises the same principle without copying the prior solution.

Use the source session only to identify the principle and observed gap.

Do not leak the source case's mechanism into the new public brief.

## Integrity Rules

- Preserve facts once a session checksum binds the case.
- Distinguish public facts, discoverable facts, future events, assumptions, simulations, and external sources.
- A missed fact counts against discovery only when it existed before assessment and had a reasonable discovery path.
- Evaluate decisions against facts available at the time, not future-event hindsight.
- Return case data to the coordinator; do not produce learning assessment or progression decisions.
