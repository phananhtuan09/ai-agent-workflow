---
title: Sample Trace-first Workflow Evaluation
description: Illustrative structure for behavioral workflow evaluation
status: sample
---

# Sample Trace-first Workflow Evaluation

This file illustrates the internal evidence model. A real full evaluation must render the self-contained Vietnamese HTML report required by `WORKFLOW_EVALUATION_STANDARD.md`.

All counts below are illustrative and must not be reused as real evidence.

## Frame

### Evaluation Brief

- `workflow_name`: `Example Coding Workflow`
- `workflow_artifacts`:
  - `docs/ai/project/WORKFLOW_CODING_STANDARD.md`
- `workflow_version`: `example-v1`
- `workflow_type`: `end-to-end operating model`
- `claimed_purpose`: guide scoped coding work from request to verification
- `claimed_task_classes`:
  - small update
  - ambiguous bug fix
- `evaluation_goal`: `workflow improvement`
- `evaluation_strategy`: `trace-first`
- `expected_behavior`: Given a scoped coding request, the agent should resolve material ambiguity before mutation, verify the result, and leave evidence supporting its conclusion.
- `prohibited_behavior`: repeated execution without a new hypothesis, unsupported completion claims, or hidden assumptions affecting business behavior.
- `runtime_context`: repository-local coding agent
- `behavior_questions`:
  - where does the agent begin rework
  - which retries produce no new evidence
  - where does the human need to redirect execution
- `evaluation_quality_plan`: audit all main claims against direct evidence; calibration metrics remain `Chưa đo` without human reference review

### Session Corpus

- `selection_rule`: completed sessions using `example-v1` for the two claimed task classes
- `included`: 3 illustrative sessions
- `excluded`: sessions missing tool results or final outcome
- `denominator`: 3
- `cohort_keys`:
  - same workflow version
  - same repository
  - same runtime and model family

## Diagnose

### Blind Behavioral Pass

The workflow artifact is not read during this pass.

#### Outcome Reconstruction

| Session | Intent | Outcome | Human intervention | Evidence |
|---|---|---|---|---|
| S-01 | Small validation update | Completed | None | Diff and focused test |
| S-02 | Ambiguous bug fix | Completed after rework | Human corrected assumption | Chat, two edit cycles, tests |
| S-03 | Ambiguous bug fix | Blocked after repeated tool failure | Human stopped retries | Command and tool results |

#### Behavioral Episodes

| Session | Episode | Observable behavior | Work classification |
|---|---|---|---|
| S-02 | Scope decision | Agent assumed business behavior without confirmation | `coordination-cost` |
| S-02 | First implementation | Mutation followed the unsupported assumption | `rework` |
| S-02 | Human correction | Human supplied the missing business rule | `coordination-cost` |
| S-03 | Failure recovery | Same command was retried with the same failure signature | `avoidable-repetition` |

### Behavioral Findings

#### BEH-01: Material ambiguity was resolved after mutation

- `severity`: `Medium`
- `evidence_status`: `trace-observed`
- `cohort`: ambiguous bug fixes, `1/2`
- `observed_pattern`: agent selected business behavior without confirming an unknown that changed the implementation
- `first_divergence`: decision immediately before the first mutation
- `impact`: one discarded edit cycle and human redirection
- `work_classification`: `rework`, `coordination-cost`
- `human_intervention`: correction required
- `cause_attribution`: pending blind-pass completion
- `alternative_explanation`: the task request may have implicitly supplied the rule

#### BEH-02: Retry repeated without a new hypothesis

- `severity`: `Medium`
- `evidence_status`: `trace-observed`
- `cohort`: sessions with tool failure, `1/1`
- `observed_pattern`: identical command and failure signature repeated without new evidence
- `first_divergence`: second retry
- `impact`: avoidable tool calls and delayed safe stop
- `work_classification`: `avoidable-repetition`, `recovery`
- `human_intervention`: human stopped execution
- `cause_attribution`: pending blind-pass completion
- `alternative_explanation`: the runtime may have documented transient retry behavior

### Cause Attribution

Only after the behavioral findings above are frozen does the evaluator read the workflow artifact.

| Finding | Attribution | Workflow mapping | Confidence |
|---|---|---|---|
| BEH-01 | `workflow-exacerbated` | Input contract does not identify material unknowns before mutation | Medium |
| BEH-02 | `runtime-tool` | Workflow already requires classification before retry; agent did not follow it | Medium |

BEH-02 must not create a new workflow rule until evidence shows the existing rule is insufficient or consistently ignored because it is unusable.

## Decide

### Improvement Contract

#### IC-01: Resolve material unknowns before mutation

- `finding`: BEH-01
- `hypothesis`: If the workflow requires recording material unknowns before the first mutation, rework caused by hidden business assumptions will decrease.
- `targeted_change`: add a pre-mutation decision check only for unknowns capable of changing acceptance criteria.
- `success_threshold`: regression and neighbor scenarios perform no mutation before resolving the material unknown.
- `regression_protection`: clearly scoped small updates must not gain an unnecessary approval step.
- `re-evaluation_set`:
  - regression: original ambiguous bug fix
  - neighbor: different feature with the same decision rule
  - control: fully specified small update

### Improvement Decision

- prioritize IC-01 for a controlled change and replay
- do not change the workflow for BEH-02 yet
- gather more tool-failure sessions before deciding whether retry guidance is unusable

An adoption verdict is intentionally omitted because the evaluation goal is workflow improvement, not promotion.

## Validate

### Evaluator Quality Validation

- `evaluation_quality_status`: `uncalibrated`
- `evidence_support_rate`: all illustrative main claims reference evidence, but this sample is not a real audit
- `first_divergence_agreement`: `Chưa đo`
- `attribution_agreement`: `Chưa đo`
- `unsupported_workflow_attribution`: `Chưa đo`
- `limitation`: no human reference review or calibration set exists for this illustrative sample

### Workflow Change Validation

- no changed workflow version exists yet
- IC-01 remains a targeted experiment, not a proven improvement
- regression, neighbor, and control replay are still required before any improvement claim
