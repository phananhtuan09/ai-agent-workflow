---
name: learning-evidence
description: Execute an explicitly authorized, bounded research, spike, test, simulation, benchmark, model, or failure-injection request for an active mini-project and return system evidence with limitations. Use internally from learning-workflow or directly for a recorded evidence request. For software changes, follow the target repository's coding authority and workflow; do not choose protected evidence for the human or assess competency. Do not require a separate named coding constitution.
---

# Learning Evidence

Turn a human-approved uncertainty from a product spec, shipped feature, incident, or twist into bounded system evidence.

Read `docs/learning/CONSTITUTION.md` and `docs/learning/STANDARD.md` before executing evidence work.

When invoked by `learning-workflow`, return structured evidence to the coordinator and do not interpret protected evidence for the human.

When invoked directly, require an explicit evidence question and execution authority.

## Input Contract

Required:

- session reference;
- mini-project or case reference;
- decision or assumption being tested;
- evidence question selected by the human;
- authorized method and scope;
- whether evidence interpretation remains protected.

Use `unknown` for missing context. Do not convert a vague request such as “prove this design scales” into a broader benchmark without human confirmation.

## Execution

1. Confirm the method can answer the stated evidence question.
2. State assumptions, environment, stopping condition, and material limitations before expensive or mutating work.
3. Perform only authorized mechanical work.
4. When the experiment creates or changes software, read `AGENTS.md`, `docs/WORKFLOW.md`, and the applicable product, decision, safety, and validation authority. Route a production deliverable through the repository's normal coding workflow.
   The learning helper does not require a separate named coding constitution or execution-skill chain.
5. Learning approval does not replace production intent, implementation authority, validation, or human sign-off. Do not mutate production source, configuration, schema, or migration files unless the coding workflow has authorized that scope.
6. For a disposable spike, benchmark, or simulation, use an isolated worktree or temporary directory. Do not leave generated source, fixtures, binaries, or other temporary output in the target worktree unless a downstream reader explicitly requires it.
7. Return `blocked` before implementation when the required repository authority, isolation, or coding-workflow dependency is unavailable.
8. Preserve raw commands, results, logs, and artifact references needed to audit the claim, subject to retention rules.
9. Separate observed result from interpretation.
10. When evidence supports a mini-project deliverable, report which acceptance criteria it directly exercises and which remain untested.

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

Set `interpretation_withheld=true` when the human must interpret the result as part of the active competency. Do not claim production scale, reliability, security, or cost capability beyond the tested method and environment.

## Coding Handoff And Retention

- A production implementation is owned by the repository coding workflow. This helper may prepare an authorized evidence request and package the resulting system evidence, but it must not bypass the repository's Plan, Implement, Validate, or Sign Off boundaries.
- A spike may run concurrently with unrelated read-only work, but it must not share mutable source or configuration with another writer. Serialize any overlapping production or learning-state mutation.
- Keep concise result summaries, limitations, stable references, checksums, timestamps, and raw output only when a later assessment, audit, or reproducible claim has a reader. Remove disposable fixtures, binaries, isolated worktrees, and logs without a downstream reader.

## Boundaries

- Do not select evidence when evidence selection is still protected.
- Do not silently expand a two- or three-day mini-project after an inconclusive result.
- Do not repair the design while running the experiment unless separately authorized.
- Do not treat generated implementation or passing tests as proof that the human understands the design.
- Return blocked or incomplete evidence honestly; incompleteness is itself relevant system evidence but not automatically a learning failure.
