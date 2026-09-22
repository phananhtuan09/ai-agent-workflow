---
name: learning-case
description: Select, create, validate, or serve facts and predeclared twists for a two-to-three-day software mini-project. Use internally from learning-workflow or directly when the human wants to prepare, inspect, validate, or create a case. Do not coach, assess the learner, or run experiments.
---

# Learning Case

Own case integrity without taking over the learning conversation.

The default case is a small product brief, not an abstract architecture exam. It should give the learner a user, a problem, functional requirements, acceptance criteria, constraints, non-goals, and a deliverable that can be demoed in two or three days.

Read `docs/learning/CONSTITUTION.md` and `docs/learning/STANDARD.md` before changing or serving a case.

When invoked by `learning-workflow`, return a concise structured result to the coordinator and do not address the human directly.

When invoked directly, complete only the requested case operation and do not start or advance a learning session.

## Modes

### Select

Input:

- active project and project version;
- current schedule cycle and mini-project IDs;
- human-approved goal and baseline;
- competency evidence and current gaps;
- daily time budget and requested duration of two or three days;
- requested mode: `practice` or `challenge`;
- preferred activity: `build`, `debug`, `integrate`, `optimize`, or `review`;
- interest tags and continuity preference.

Prefer an existing mini-project that:

- fits the time budget and selected activity;
- exercises the active competency without repeating a memorized solution;
- has a visible deliverable and concrete acceptance criteria;
- matches the active project version and schedule cycle;
- introduces a new product shape or constraint when transfer is needed.

Reject an existing case when its established facts conflict with the active project's current state or accepted evolution history.

Recommend up to three different pitches when materially different choices are available. Never decide the human's learning direction or hide a meaningful format trade-off.

Return:

```json
{
  "status": "case-selected",
  "case_path": "...",
  "format": "mini-project",
  "mini_project": {
    "category": "developer-tool | web-app | backend-feature | incident | integration | cli",
    "activity": "build | debug | integrate | optimize | review",
    "mode": "practice | challenge",
    "duration_days": 2,
    "daily_time_budget_minutes": 45,
    "pitch": "...",
    "deliverable": "..."
  },
  "competency": {},
  "reason": "...",
  "limitations": [],
  "requires_human_approval": true
}
```

### Create

Create the smallest realistic mini-project that can produce the requested learning evidence and a visible deliverable.

Write it to `docs/learning/cases/{case_id}.json` using schema `learning-case/v1`.

The case must contain:

- business goal, problem, user, and current context;
- explicit simulation or source provenance;
- declared assumptions and case history;
- a `mini_project` object with category, activity, mode, duration, daily budget, pitch, stack, deliverable, milestones, and definition of done;
- a `project_spec` object with functional requirements, acceptance criteria, constraints, non-goals, deliverable, and open questions;
- one active competency and normally one protected judgment;
- public and discoverable facts;
- a discovery path for every discoverable fact;
- at most one predeclared change request, incident, counterexample, or evidence twist;
- an observable rubric;
- a transfer prompt;
- a learning-context link to project ID, minimum project version, and aligned schedule cycles.

Do not include a canonical solution. Do not write the invariant or failure model as the only learner-facing prompt. Those may remain in protected judgment and rubric metadata as behavior the learner should discover from the spec.

Do not add technology, scale, failure, or complexity without a supporting requirement or constraint. Use the active project's domain, architecture baseline, and accepted evolution history as continuity context. Do not copy future cycles into the current public brief.

Validate the file with the validator in the sibling `learning-workflow` skill before returning it.

Case creation is a learning-namespace mutation. Acquire the shared `docs/learning/` lock while checking project context, validate the case with the sibling `learning-workflow` validator, and commit the new case through its recoverable writer. Never replace a case after a session checksum binds to it.

### Discover

Input:

- case path;
- exact human question;
- facts already disclosed.

Return only facts whose public visibility or discovery path directly supports the question. Do not return implications, recommendations, options, hidden rubric details, or future twists.

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

### Release Twist

Input:

- case path;
- session state;
- candidate event ID.

Release an event only when its predeclared trigger is satisfied. A twist should look like a stakeholder change request, incident report, counterexample, or bounded evidence result that changes what the learner must decide next.

Return the event ID, kind, statement, purpose, and record IDs that prove its predeclared trigger without interpreting it for the learner.

Never create or modify an event after seeing the learner's decision merely to make that decision wrong.

### Transfer

Create a mini-project in a different domain or constraint context that exercises the same principle without copying the prior solution. Use the source session only to identify the principle and observed gap. Do not leak the source case's mechanism into the new public brief.

## Integrity Rules

- Preserve facts once a session checksum binds the case.
- Distinguish public facts, discoverable facts, predeclared twists, assumptions, simulations, and external sources.
- A missed fact counts against discovery only when it existed before assessment and had a reasonable discovery path.
- Evaluate decisions against facts available at the time, not future-twist hindsight.
- AI may provide a spec and role-play a stakeholder, but must not supply the protected product decision before the learner's first attempt.
- Return case data to the coordinator; do not produce learning assessment or progression decisions.
