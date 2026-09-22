---
name: learning-review
description: Assess a completed or blocked mini-project from its product spec, first attempt, shipped behavior, revisions, assistance, twists, and bounded evidence; classify gaps and recommend one next mini-project action. Do not coach, reveal an open solution, or rewrite the learner's answer.
---

# Learning Review

Produce an evidence-bound assessment without reopening coaching.

Review the product behavior and the learner's judgment separately. A working artifact proves observed system behavior; it does not automatically prove that the learner independently understands the design.

Read `docs/learning/CONSTITUTION.md` and `docs/learning/STANDARD.md` before assessing a session.

When invoked by `learning-workflow`, return a structured assessment proposal to the coordinator.

When invoked directly, assess only the requested closed or frozen scope and do not start a new session.

## Input Contract

Required:

- case path and checksum-bound session;
- mini-project spec and definition of done when the case is project-based;
- project snapshot and schedule-cycle context recorded in the session;
- assessment scope and selected mode;
- protected-judgment states;
- first attempts and revisions;
- disclosed facts and released twists;
- assistance records;
- delivery record, artifact references, completed criteria, and limitations;
- system evidence and human interpretations;
- case rubric.

Optional:

- existing assessment;
- human dispute;
- requested reassessment scope.

Do not assess an open judgment. Do not provide a full solution merely to make assessment easier.

## Assessment

For each rubric dimension:

1. Identify observable learning evidence from clarification, design, implementation decisions, delivered behavior, revision, assistance, or evidence interpretation.
2. Separate behavior observed before and after material assistance.
3. Rate it as `demonstrated`, `partial`, `not-demonstrated`, or `inconclusive`.
4. Mark independence as `independent`, `assisted`, or `not-observed`.
5. State a concrete limitation.
6. Reference exact attempt, revision, assistance, delivery, evidence, interpretation, or twist record IDs supporting the rating.

Check the deliverable against the product spec:

- Which functional requirements were implemented?
- Which acceptance criteria were demonstrated directly?
- Which definition-of-done items remain unobserved?
- Did the learner keep claims within the tested method and environment?
- Did the twist produce a meaningful revision or a justified decision to keep the design?

Classify important gaps when supported:

- `knowledge-gap`;
- `reasoning-gap`;
- `design-failure`;
- `implementation-failure`;
- `system-evidence-gap`;
- `learning-evidence-gap`.

Do not infer competency from completion, confidence, implementation output, passing tests, or system evidence alone. Do not infer competency from reaching or completing a schedule cycle.

## Outcome

Use exactly one:

- `independent-success`;
- `assisted-success`;
- `needs-revisit`;
- `inconclusive`.

`independent-success` requires every required judgment to be independently closed, every required rubric dimension to be demonstrated independently, and no material assistance affecting that evidence. A shipped artifact is compatible with `assisted-success` or `inconclusive`; it is not a shortcut to independent success.

Recommend exactly one next action:

- `revisit-prerequisite`;
- `retry-similar`;
- `transfer-context`;
- `increase-difficulty`;
- `change-competency`.

Summarize the observable result in exactly three groups:

- `independent`: behavior demonstrated without material assistance;
- `assisted`: behavior demonstrated after material assistance;
- `not_demonstrated`: behavior still missing or contradicted by available learning evidence.

Return no more than three current gaps. Each gap must be supported by learning evidence and useful for choosing the next mini-project.

## Output Contract

```json
{
  "status": "assessment-ready",
  "dimensions": [
    {
      "id": "RUB-001",
      "rating": "demonstrated",
      "independence": "independent",
      "evidence": ["AT-001", "DL-001"],
      "limitation": "..."
    }
  ],
  "gaps": [],
  "result_summary": {
    "independent": [],
    "assisted": [],
    "not_demonstrated": []
  },
  "outcome": "needs-revisit",
  "reason": "...",
  "next_action": {
    "type": "retry-similar",
    "reason": "..."
  },
  "uncertainties": []
}
```

## Disputes

- Check whether the dispute concerns facts, rubric mapping, attribution, delivery evidence, or interpretation.
- Resolve it only with existing evidence.
- If evidence cannot resolve it, mark the affected dimension or overall outcome `inconclusive`.
- Never use an unresolved assessment as progression-pass evidence.

## Boundaries

- Do not improve or rewrite the learner's reasoning.
- Do not introduce facts that were unavailable at decision time.
- Do not grade by similarity to a canonical solution.
- Do not treat a polished UI, passing test, or completed ticket as proof of understanding.
- Do not update the profile directly when invoked by the coordinator; return the proposal so `learning-workflow` can present it and handle human disagreement first.
