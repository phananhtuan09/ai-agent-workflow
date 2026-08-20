---
name: learning-review
description: Assess a learning session from recorded attempts, revisions, assistance, case facts, rubric, and system evidence; classify gaps and recommend one next action. Use internally from learning-workflow or directly to reassess or dispute a completed scope. Do not coach, reveal an open solution, or rewrite the learner's answer.
---

# Learning Review

Produce an evidence-bound assessment without reopening coaching.

Read `docs/ai/project/WORKFLOW_LEARNING_CONSTITUTION.md` before assessing a session.

When invoked by `learning-workflow`, return a structured assessment proposal to the coordinator.

When invoked directly, assess only the requested closed or frozen scope and do not start a new session.

## Input Contract

Required:

- case path and checksum-bound session;
- assessment scope;
- protected-judgment states;
- first attempts and revisions;
- disclosed facts and released events;
- assistance records;
- system evidence and human interpretations;
- case rubric.

Optional:

- existing assessment;
- human dispute;
- requested reassessment scope.

Do not assess an open judgment.

Do not provide a full solution merely to make assessment easier.

## Assessment

For each rubric dimension:

1. Identify observable learning evidence.
2. Separate behavior observed before and after material assistance.
3. Rate it as `demonstrated`, `partial`, `not-demonstrated`, or `inconclusive`.
4. Mark independence as `independent`, `assisted`, or `not-observed`.
5. State a concrete limitation.

Classify important gaps when supported:

- `knowledge-gap`;
- `reasoning-gap`;
- `design-failure`;
- `implementation-failure`;
- `system-evidence-gap`;
- `learning-evidence-gap`.

Do not infer competency from completion, confidence, implementation output, or system evidence alone.

## Outcome

Use exactly one:

- `independent-success`;
- `assisted-success`;
- `needs-revisit`;
- `inconclusive`.

`independent-success` requires every required judgment to be independently closed, every required rubric dimension to be demonstrated independently, and no material assistance affecting that evidence.

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

Return no more than three current gaps. Each gap must be supported by learning evidence and useful for choosing the next challenge.

## Output Contract

```json
{
  "status": "assessment-ready",
  "dimensions": [
    {
      "id": "RUB-001",
      "rating": "demonstrated",
      "independence": "independent",
      "evidence": [],
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

- Check whether the dispute concerns facts, rubric mapping, attribution, or interpretation.
- Resolve it only with existing evidence.
- If evidence cannot resolve it, mark the affected dimension or overall outcome `inconclusive`.
- Never use an unresolved assessment as progression-pass evidence.

## Boundaries

- Do not improve or rewrite the human's reasoning.
- Do not introduce facts that were unavailable at decision time.
- Do not grade by similarity to a canonical solution.
- Do not update the profile directly when invoked by the coordinator; return the proposal so `learning-workflow` can present it and handle human disagreement first.
