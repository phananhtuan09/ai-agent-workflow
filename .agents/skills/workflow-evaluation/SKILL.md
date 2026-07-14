---
name: workflow-evaluation
description: Use when the user asks to evaluate, compare, promote, reject, or review an AI workflow itself rather than perform the underlying work that workflow guides. Reads the workflow under review, normalizes it, audits it, exercises it against realistic scenarios and available session traces, and writes an evaluation artifact to docs/ai/workflow-evals/.
---

# Workflow Evaluation

Evaluate an AI workflow as a review subject, not as an implementation plan.

## Required Source Of Truth

Always read:
- `docs/ai/project/WORKFLOW_EVALUATION_STANDARD.md`

Read when relevant:
- `docs/ai/project/AI_WORKFLOW_RULES.md`
- the workflow artifact under review
- existing artifacts in `docs/ai/workflow-evals/`

Do not re-invent the evaluation flow from memory when the standard is available.

## Use This For

- evaluating whether a workflow should be adopted, kept experimental, constrained, or rejected
- comparing two workflow variants
- reviewing a workflow after changes to commands, skills, phase boundaries, or artifact contracts
- checking whether a workflow is portable enough for its intended scope

Do not use this skill for:
- performing the underlying work that another workflow is meant to guide
- implementing product features
- fixing application code
- operating the workflow under review as if it were the work itself
- replacing the normal execution or verification steps inside the workflow being evaluated

## Input

Minimum required input:
- workflow name
- workflow artifact paths or a clearly identified workflow subject
- claimed purpose
- claimed task classes
- evaluation goal

Optional:
- comparison target
- runtime context
- known constraints
- session traces, when available:
  - chat history
  - command transcript
  - tool-call trace
  - artifact trail
  - handoff notes
  - decision log
  - failure or retry log

If the workflow subject is spread across multiple files, reconstruct it explicitly before judging it.
If session traces are unavailable, record them as unavailable instead of inventing runtime behavior.

## Output

Write to:
- `docs/ai/workflow-evals/{name}.md`

If the user asks only for a partial phase such as `Audit`, you may produce that phase alone in the response, but a full workflow evaluation should still end in the durable artifact above.

## Execution Flow

1. Read `WORKFLOW_EVALUATION_STANDARD.md`.
2. Define the evaluation input contract explicitly.
3. Run `Intake`.
4. Run `Normalize`.
5. Run `Audit`.
6. Run `Exercise` when realistic evidence or session traces can be gathered.
7. Include `Session Trace Evidence` when real session history is available, or explicitly mark it unavailable.
8. Run `Verdict`.
9. Write the evaluation artifact.

## Phase Requirements

### `Intake`
- Identify the workflow artifact set under review.
- State the workflow's claimed purpose in plain language.
- State intended task classes and evaluation goal.

### `Normalize`
- Rewrite the workflow into a comparable model:
  - entry points
  - ordered phases
  - phase inputs
  - phase outputs
  - durable artifacts
  - human responsibilities
  - agent responsibilities
  - runtime dependencies
  - required assumptions
- Keep verified facts separate from inferred structure.

### `Audit`
- Perform static review before scenario execution.
- Record findings with:
  - severity
  - area
  - evidence
  - rationale
  - recommended action
- Check especially for:
  - unclear phase boundaries
  - artifacts with no regular reader
  - hidden runtime dependence
  - reliance on undocumented conventions
  - blurred lines between human judgment and verified facts

### `Exercise`
- Use realistic scenarios when the user wants a real evaluation rather than a paper review.
- Cover at least one scenario per claimed task class when feasible.
- Record:
  - scenario class
  - expected behavior
  - observed behavior
  - ambiguity resolution
  - artifact consumption
  - breakdowns
  - visible cost notes

### `Verdict`
- Choose exactly one:
  - `Adopt`
  - `Adopt with constraints`
  - `Keep experimental`
  - `Reject`
- State supported scope, unsupported scope, evidence summary, and blocking issues.

## Required Artifact Sections

The final file must include:
- `## Workflow Under Test`
- `## Scope`
- `## Input Contract`
- `## Claimed Purpose`
- `## Evaluation Goal`
- `## Normalized Model`
- `## Audit Findings`
- `## Exercise Scenarios`
- `## Evidence`
- `## Verdict`
- `## Promotion Decision`

## Rules

- Treat the workflow under review as the subject being evaluated
- Do not silently convert workflow design work into workflow adoption
- Do not present a paper review as if runtime exercise had happened
- If evidence is thin, prefer `Keep experimental` or recommend more `Exercise`
- If a field is unknown, mark it unknown instead of assuming it
- Keep the evaluation artifact concise and reviewable
- Use direct evidence from workflow docs, commands, skills, and existing artifacts when available
- When reading old workflow artifacts, separate static evidence used in `Audit` from scenario evidence used in `Exercise`

## Done When

- the workflow subject is explicitly defined
- normalized structure is written
- audit findings are evidence-backed
- exercise evidence is recorded or clearly marked as limited
- verdict matches the standard's heuristics
- `docs/ai/workflow-evals/{name}.md` is written
