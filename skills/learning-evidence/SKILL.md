---
name: learning-evidence
description: Execute an explicitly authorized research, spike, test, simulation, benchmark, model, or failure-injection request for an active learning case and return bounded system evidence with limitations. Use internally from learning-workflow or directly for a recorded evidence request. Do not choose protected evidence for the human or assess competency.
---

# Learning Evidence

Turn a human-approved uncertainty into bounded system evidence.

Read `docs/ai/project/WORKFLOW_LEARNING_CONSTITUTION.md` and `docs/ai/project/WORKFLOW_LEARNING_STANDARD.md` before executing evidence work.

When invoked by `learning-workflow`, return structured evidence to the coordinator and do not interpret protected evidence for the human.

When invoked directly, require an explicit evidence question and execution authority.

## Input Contract

Required:

- session reference;
- decision or assumption being tested;
- evidence question selected by the human;
- authorized method and scope;
- whether evidence interpretation remains protected.

Use `unknown` for missing context.

Do not convert a vague request such as “prove this design scales” into a broader benchmark without human confirmation.

## Execution

1. Confirm the method can answer the stated evidence question.
2. State assumptions, environment, stopping condition, and material limitations before expensive or mutating work.
3. Perform only authorized mechanical work.
4. When the experiment creates a software deliverable, require the applicable coding constitution, standard and execution skills to exist before implementation.
5. Return `blocked` before implementation when required authority or a coding-workflow dependency is unavailable.
6. Preserve raw commands, results, logs, and artifact references needed to audit the claim.
7. Separate observed result from interpretation.

## Evidence Package

Return one package per method:

```json
{
  "id": "SE-001",
  "request_id": "ER-001",
  "judgment_id": "PJ-001",
  "question": "...",
  "method": "...",
  "environment": {},
  "assumptions": [],
  "result": "...",
  "evidence_references": [],
  "limitations": [],
  "confidence": "low | medium | high",
  "proves": [],
  "suggests": [],
  "does_not_prove": [],
  "interpretation_withheld": true
}
```

Set `interpretation_withheld=true` when the human must interpret the result as part of the active competency.

Do not claim production scale, reliability, security, or cost capability beyond the tested method and environment.

## Boundaries

- Do not select evidence when evidence selection is still protected.
- Do not silently expand scope after an inconclusive result.
- Do not repair the design while running the experiment unless separately authorized.
- Do not treat generated implementation or passing tests as proof that the human understands the design.
- Return blocked or incomplete evidence honestly; incompleteness is itself relevant system evidence but not automatically a learning failure.
