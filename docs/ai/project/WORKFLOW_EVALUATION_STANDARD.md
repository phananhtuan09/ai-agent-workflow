---
phase: project
title: Workflow Evaluation Standard
description: Standard workflow for evaluating any AI agent workflow before adoption, promotion, or replacement
---

# Workflow Evaluation Standard

## Purpose
This document defines a separate workflow for evaluating AI agent workflows as review subjects.

It is not the standard coding workflow.
It exists to evaluate whether a workflow is:
- useful
- clear
- portable enough for its intended scope
- safe to adopt or promote

The workflow applies to any AI agent workflow, not only the coding workflow used in this repository.

## Why This Exists
The standard coding workflow answers:
- how an agent should shape, spec, execute, sync, and verify code changes

This evaluation workflow answers a different question:
- whether a workflow design is worth using, keeping, comparing, or promoting

Without a separate evaluation path, workflow changes tend to be judged by intuition, isolated success cases, or prompt elegance instead of repeated evidence.

## Core Rule
Treat the workflow under review as the subject being evaluated.

Do not mix:
- building a workflow
- using a workflow to complete product work
- evaluating whether that workflow is good enough to keep

These are different tasks and should remain separate.

## When To Use This Workflow

| Evaluation case | Use this workflow |
|---|---|
| New workflow proposal | `Intake` → `Normalize` → `Audit` → `Exercise` → `Verdict` |
| Compare two workflow variants | `Intake` → `Normalize` → `Audit` → `Exercise` → `Verdict` |
| Decide whether to promote an experimental pattern | `Intake` → `Normalize` → `Audit` → `Exercise` → `Verdict` |
| Review whether an existing workflow should stay standard | `Intake` → `Normalize` → `Audit` → `Exercise` → `Verdict` |

Do not use this workflow for:
- implementing a feature
- fixing product code
- replacing `/spec`, `/execute-spec`, or verification steps for normal development work

## Standard Flow

```text
Workflow candidate or workflow variant
  ↓
Intake
  ↓
Normalize
  ↓
Audit
  ↓
Exercise
  ↓
Verdict
```

## Evaluation Input Contract
Before `Intake`, define the minimum evaluation input:
- `workflow_name`
- `workflow_artifacts`
- `workflow_type`
  - document
  - command set
  - prompt wrapper
  - skill
  - runtime binding
  - end-to-end operating model
- `claimed_purpose`
- `claimed_task_classes`
- `evaluation_goal`
  - adoption review
  - comparison
  - regression review
  - promotion decision
- `comparison_target`, when evaluating two variants
- `runtime_context`
- `known_constraints`

Required:
- do not start evaluation until these fields are explicit
- if a field is unknown, record it as unknown instead of assuming it

Recommended:
- keep the input contract short enough to fit near the top of the evaluation artifact

## Evaluation Phases

### 1. `Intake`
Purpose:
- define exactly what workflow is under evaluation

Rules:
- identify the workflow artifact set under review:
  - document
  - command set
  - prompt wrapper
  - skill
  - runtime binding
  - end-to-end operating model
- state the workflow's claimed purpose in plain language
- define the intended task classes, such as:
  - small updates
  - bug fixes
  - feature delivery
  - workflow review
  - portability across runtimes
- state the evaluation goal explicitly:
  - adoption review
  - comparison
  - regression review
  - promotion decision

Expected output:
- `Evaluation Target Definition` containing:
  - workflow name
  - artifact set under review
  - claimed purpose
  - intended task classes
  - evaluation goal
  - comparison target, if applicable

### 2. `Normalize`
Purpose:
- force different workflows into a comparable structure

Rules:
- rewrite the workflow into a normalized model with these fields:
  - entry points
  - ordered phases
  - input for each phase
  - output for each phase
  - durable artifacts
  - human responsibilities
  - agent responsibilities
  - runtime or tool dependencies
  - assumptions that must hold for the workflow to work
- do not evaluate yet
- reduce ambiguity first so later judgments are comparable

Expected output:
- `Normalized Workflow Model` containing:
  - entry points
  - ordered phases
  - phase inputs
  - phase outputs
  - durable artifacts
  - human responsibilities
  - agent responsibilities
  - runtime dependencies
  - required assumptions

Required:
- write this as a structured artifact, not loose prose
- keep verified workflow behavior separate from inferred structure

### 3. `Audit`
Purpose:
- perform static review before running the workflow

Rules:
- check whether each step is human-readable
- check whether each phase has a clear input, output, and next decision
- flag artifacts that duplicate existing information or have no regular reader
- flag steps that add ceremony without improving quality, safety, or execution efficiency
- separate verified workflow properties from inferred ones
- identify whether the workflow depends too heavily on:
  - hidden chat memory
  - one specific runtime
  - informal operator judgment
  - undocumented conventions
- record known risks, blind spots, and likely failure modes

Expected output:
- `Audit Findings` where each finding includes:
  - `severity`: `High`, `Medium`, or `Low`
  - `area`: clarity, artifact usefulness, portability, safety, cost, or failure visibility
  - `evidence`
  - `rationale`
  - `recommended action`

Audit rule mapping:
- `AI_WORKFLOW_RULES.md` rule 1, optimize for real value:
  - flag steps or artifacts that add ceremony without visible quality, safety, or efficiency gain
- rule 2, keep every step human-readable:
  - flag phases without clear input, output, or next decision
- rule 3, add only patterns proven by real usage:
  - flag promotion claims that rely on elegance, completeness, or one-off wins instead of repeated evidence
- rule 4, separate human judgment from agent verification:
  - flag places where assumptions or human review are presented like verified workflow facts

Severity guidance:
- `High`: blocks safe adoption, hides major uncertainty, or breaks reviewability
- `Medium`: workable with constraints, but portability or consistency is reduced
- `Low`: useful improvement, wording issue, or local ambiguity without major decision impact

### 4. `Exercise`
Purpose:
- test the workflow on realistic scenarios instead of judging it only on paper

Rules:
- run the workflow against a small set of representative scenarios
- prefer stable scenario classes over one-off examples
- at minimum, cover the task classes the workflow claims to support
- capture evidence such as:
  - where ambiguity was resolved
  - where assumptions stayed implicit
  - whether artifacts were actually consumed by later steps
  - where the workflow broke down
  - relative cost in time, tokens, or complexity when visible
- do not treat a single successful run as proof of general usefulness

Recommended baseline scenarios (coding workflow):
- one small bounded task
- one ambiguous or conflict-prone task
- one medium task that requires durable handoff or verification

Recommended baseline scenarios (workflow base):
When the workflow under evaluation is a reusable base applied to multiple projects:
- apply base to a new project: record where it breaks and what needs customizing
- compare two versions of the same phase: run both on the same task, measure output quality and cost
- update one rule or phase in the base: then apply to a project already using the base and check compatibility

Incremental re-evaluation:
When the workflow is updated frequently, a full 5-phase run is not always needed. Choose the lightest path:
- artifact path or naming change → re-run `Audit` on the changed artifact only
- command or skill behavior change → re-run `Exercise` using existing scenarios
- phase boundary change → re-run `Normalize` then `Audit`
- new command, skill, or phase → full `Intake` → `Normalize` → `Audit` → `Exercise` → `Verdict`

Downstream evidence:
When the workflow has been applied to real projects, capture:
- which parts stayed unchanged and which were overridden per project
- which artifacts were skipped and which were added per project
- this is the strongest signal for whether the workflow is portable and reusable

Expected output:
- `Scenario Evidence Set` tied to concrete scenarios

Minimum exercise protocol:
- cover at least one scenario for each claimed task class
- if the workflow claims runtime or project portability, test across at least two contexts or record portability as unverified
- for each scenario, record:
  - scenario name
  - scenario class
  - expected workflow behavior
  - observed workflow behavior
  - where ambiguity was resolved
  - which artifacts were consumed by later steps
  - where the workflow broke down
  - cost notes when visible

Recommended:
- reuse the same baseline scenarios across workflow variants when comparing them
- prefer evidence tables over long narrative writeups

### 5. `Verdict`
Purpose:
- make a promotion or rejection decision explicit

Rules:
- choose one final status:
  - `Adopt`
  - `Adopt with constraints`
  - `Keep experimental`
  - `Reject`
- state where the workflow works well
- state where it should not be used
- state what would need to change before promotion if it is not ready
- do not promote a workflow pattern based only on elegance, completeness, or theoretical coverage

Expected output:
- `Decision Record` containing:
  - final status
  - supported scope
  - unsupported scope
  - evidence summary
  - blocking issues
  - required changes before promotion, if not ready

Verdict heuristics:
- `Adopt`:
  - no unresolved `High` findings
  - exercise evidence covers the claimed core task classes
  - artifacts and phase boundaries are reviewable in regular use
- `Adopt with constraints`:
  - workflow is useful, but only within explicit runtime, team, or task limits
  - unresolved issues do not block safe use inside those limits
- `Keep experimental`:
  - workflow shows promise, but evidence coverage is still thin or too narrow
  - portability, repeatability, or artifact usefulness is not proven enough for standard promotion
- `Reject`:
  - unresolved `High` issues remain
  - complexity, ambiguity, or hidden dependency outweighs demonstrated value
  - repeated exercise results show the workflow breaks in its claimed scope

## Evaluation Criteria
Judge the workflow against these dimensions when relevant:
- clarity of phase boundaries
- artifact usefulness
- human reviewability
- separation of assumptions from verified facts
- runtime portability
- cost relative to value
- failure visibility
- suitability for claimed task sizes

No workflow needs to maximize every dimension.
The evaluation should judge whether the workflow is good enough for its intended scope.

## Evaluation Artifact
Write evaluation results to:
- `docs/ai/workflow-evals/{name}.md`

Required sections:
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

Recommended sections:
- `## Constraints`
- `## Follow-up Required`

Recommended structure:
- `## Workflow Under Test`
  - identify the workflow name, type, and artifacts under review
- `## Scope`
  - state what is in scope and out of scope for this evaluation run
- `## Input Contract`
  - record the required evaluation input fields
- `## Claimed Purpose`
  - state the workflow's intended value in plain language
- `## Evaluation Goal`
  - state adoption, comparison, regression, or promotion decision
- `## Normalized Model`
  - rewrite the workflow in normalized form
- `## Audit Findings`
  - list findings with severity, evidence, rationale, and action
- `## Exercise Scenarios`
  - list scenario setup and expected behavior
- `## Evidence`
  - record observed results and downstream artifact use
- `## Verdict`
  - state final status, supported scope, and unsupported scope
- `## Promotion Decision`
  - state whether the workflow is ready for standard use, constrained use, or continued experimentation

## Human-Controlled Use
This workflow is also human-controlled.

The human decides when to run a workflow evaluation, for example:
- before adding a new standard command
- before promoting an experimental pattern
- when comparing two alternative workflow designs
- when a workflow seems to work but lacks reviewable evidence

Agent behavior rules:
- do not silently convert workflow design work into workflow evaluation work
- do not silently convert workflow evaluation into workflow adoption
- if the evidence is too thin, recommend more `Exercise` instead of overstating confidence

## Decision Guidance
Use these interpretations:
- `Adopt`: evidence is strong enough for the intended scope and regular use
- `Adopt with constraints`: useful, but only under explicit limits
- `Keep experimental`: promising, but not proven enough for standard promotion
- `Reject`: complexity, ambiguity, or weak evidence outweighs value

## Relationship To Other Documents
- `docs/ai/project/AI_WORKFLOW_RULES.md` defines the mandatory rules that the evaluation should enforce
- `docs/ai/project/WORKFLOW_CODING_STANDARD.md` defines the standard coding workflow that may itself be evaluated by this document
- `docs/ai/workflow-evals/` stores evaluation artifacts produced by this workflow

## Ready-To-Implement Standard
This document is implementation-ready when used as an evaluation operating spec only if:
- the evaluation input contract is explicitly filled
- each phase writes its required output section
- audit findings use declared severity and evidence
- exercise scenarios cover the workflow's claimed scope or clearly mark gaps
- the verdict follows the documented heuristics instead of personal preference
