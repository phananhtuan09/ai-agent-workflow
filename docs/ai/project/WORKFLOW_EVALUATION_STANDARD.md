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
- a short evaluation target definition

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
- one normalized workflow model

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
- a concise audit finding set with severity and rationale

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

Recommended baseline scenarios:
- one small bounded task
- one ambiguous or conflict-prone task
- one medium task that requires durable handoff or verification

Expected output:
- exercise evidence tied to concrete scenarios

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
- an explicit decision with evidence-backed reasoning

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

Recommended sections:
- `## Workflow Under Test`
- `## Claimed Purpose`
- `## Evaluation Goal`
- `## Normalized Model`
- `## Audit Findings`
- `## Exercise Scenarios`
- `## Evidence`
- `## Verdict`
- `## Promotion Decision`

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
- `docs/ai/project/HARNESS_ARCHITECTURE.md` defines broader architectural boundaries such as observability, delegation, and portability that may become part of the evaluation
