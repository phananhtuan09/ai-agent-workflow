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
Operational workflows answer questions such as:
- how an agent should perform a task
- how a human and agent should coordinate
- what artifacts should be produced, consumed, or reviewed
- when a workflow should stop, escalate, retry, or hand off

This evaluation workflow answers a different question:
- whether a workflow design is worth using, keeping, comparing, or promoting

Without a separate evaluation path, workflow changes tend to be judged by intuition, isolated success cases, prompt elegance, or local familiarity instead of repeated evidence across the workflow's claimed scope.

## Core Rule
Treat the workflow under review as the subject being evaluated.

Do not mix:
- building a workflow
- using a workflow to complete the underlying work it is meant to guide
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
- performing the underlying work that another workflow is meant to guide
- implementing a product feature
- fixing product code
- operating a support, research, planning, design, security, DevOps, documentation, or coding workflow as the work itself
- replacing normal execution or verification steps inside the workflow being evaluated

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
- `session_traces`, when available
  - chat history
  - command transcript
  - tool-call trace
  - artifact trail
  - handoff notes
  - decision log
  - failure or retry log

Required:
- do not start evaluation until these fields are explicit
- if a field is unknown, record it as unknown instead of assuming it
- if session traces are unavailable, record `session_traces: unavailable` instead of inventing runtime behavior

Recommended:
- keep the input contract short enough to fit near the top of the evaluation artifact
- when evaluating a workflow already used in real work, include at least one representative session trace before making a promotion decision

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
  - small bounded execution tasks
  - ambiguous planning or decision tasks
  - research and synthesis tasks
  - review, audit, or verification tasks
  - incident, support, or triage tasks
  - feature delivery or bug-fix tasks
  - design, documentation, or migration tasks
  - coordination or handoff-heavy tasks
  - portability across projects, teams, tools, or runtimes
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
- if session traces exist, inspect whether the workflow's declared behavior matches the actual conversation, tool use, and handoff pattern
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
- at minimum, cover the task classes and operating contexts the workflow claims to support
- if real session traces exist, include them as primary evidence alongside synthetic scenarios
- include both success-path and stress-path scenarios when the workflow makes safety, reliability, or portability claims
- capture evidence such as:
  - where ambiguity was resolved
  - where assumptions stayed implicit
  - whether artifacts were actually consumed by later steps or later actors
  - whether the real chat history showed the same decision pattern the workflow claims to use
  - where human judgment, agent judgment, tool output, or external system state affected the result
  - where the workflow broke down, looped, escalated, or stopped correctly
  - relative cost in time, tokens, handoffs, tools, or complexity when visible
- do not treat a single successful run as proof of general usefulness

Recommended baseline scenario classes:
- one small bounded task in the workflow's claimed domain
- one ambiguous, incomplete, or conflict-prone task
- one medium task requiring handoff, review, persistence, or later verification
- one failure-path task where an input is missing, a tool/runtime is unavailable, or a decision cannot be made safely

Workflow-type scenario guidance:
- coding or spec-driven workflow:
  - cover a small change, an ambiguous change, and a medium change requiring durable handoff or verification
  - if session traces exist, compare the declared flow against the actual chat and tool history
- research or synthesis workflow:
  - cover a narrow fact-finding task, an ambiguous source-quality task, and a synthesis task with conflicting evidence
  - if session traces exist, inspect whether source selection and synthesis steps were actually followed
- review, audit, or security workflow:
  - cover a clean case, a clear issue case, and a subtle or ambiguous issue case
  - if session traces exist, inspect whether findings were grounded in evidence rather than inference alone
- planning or product workflow:
  - cover a well-scoped request, an unclear request, and a request requiring prioritization or trade-off decisions
  - if session traces exist, inspect whether decision points were explicit and recorded
- support, incident, or triage workflow:
  - cover a routine case, an urgent/escalation case, and a case with missing or contradictory signals
  - if session traces exist, inspect whether escalation and stop conditions were followed
- design or documentation workflow:
  - cover a simple artifact update, a cross-document consistency case, and a case requiring audience or scope decisions
  - if session traces exist, inspect whether artifact consumers actually used the produced output
- DevOps, release, or migration workflow:
  - cover a routine path, a rollback/failure path, and an environment-specific constraint case
  - if session traces exist, inspect whether operational risk was surfaced early enough
- reusable workflow base:
  - apply the base to a new context and record what breaks or needs customizing
  - compare two versions of the same phase on the same scenario and record output quality and cost
  - update one rule or phase in the base, then apply it to a context already using the base and check compatibility

Incremental re-evaluation:
When the workflow is updated frequently, a full 5-phase run is not always needed. Choose the lightest path:
- artifact path or naming change → re-run `Audit` on the changed artifact only
- command or skill behavior change → re-run `Exercise` using existing scenarios
- phase boundary change → re-run `Normalize` then `Audit`
- new command, skill, or phase → full `Intake` → `Normalize` → `Audit` → `Exercise` → `Verdict`

Session trace evidence:
When real chat/session history is available, capture:
- user request or trigger that started the session
- workflow phase transitions that were explicit in the session
- workflow phase transitions that were inferred, skipped, or blurred
- questions asked by the agent and whether they were necessary
- decisions made by the human, agent, or tools
- tool calls, commands, artifacts, and handoffs produced during the session
- where the agent relied on hidden context, memory, or unstated assumptions
- where the workflow prevented or failed to prevent an error, loop, premature execution, or unsafe action
- whether later steps consumed earlier outputs
- where the actual session diverged from the declared workflow

Use session traces to identify real failure modes, not to prove general usefulness from one success case.

Downstream evidence:
When the workflow has been applied to real projects or repeated sessions, capture:
- which parts stayed unchanged and which were overridden per project or session
- which artifacts were skipped and which were added per project or session
- which session-trace failure modes repeated across contexts
- this is the strongest signal for whether the workflow is portable and reusable

Expected output:
- `Scenario Evidence Set` tied to concrete scenarios
- `Session Trace Evidence Set` tied to real sessions when traces are available

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
- clarity of entry and exit conditions
- artifact usefulness
- human reviewability
- separation of assumptions, human judgment, agent judgment, and verified facts
- portability across the claimed projects, teams, tools, runtimes, or domains
- dependency on hidden memory, undocumented conventions, or local operator knowledge
- cost relative to value
- failure visibility and safe stop/escalation behavior
- suitability for claimed task sizes and risk levels
- repeatability across representative scenarios and real session traces
- compatibility with downstream consumers or later workflow phases
- traceability from session history to declared workflow behavior

No workflow needs to maximize every dimension.
The evaluation should judge whether the workflow is good enough for its intended scope and risk level.

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
- `## Session Trace Evidence`
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
- `## Session Trace Evidence`
  - record available chat history, command transcript, tool-call trace, artifact trail, handoff notes, decision log, and failure or retry log
  - if unavailable, state `session traces unavailable` and avoid inferring runtime behavior from documents alone
- `## Evidence`
  - record observed results, session-trace observations, and downstream artifact use
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
- `docs/ai/project/WORKFLOW_CODING_STANDARD.md` defines one possible workflow type that may itself be evaluated by this document
- other workflow documents, command sets, skills, prompt wrappers, runtime bindings, or operating models may also be evaluated by this document when they satisfy the input contract
- `docs/ai/workflow-evals/` stores evaluation artifacts produced by this workflow

## Ready-To-Implement Standard
This document is implementation-ready when used as an evaluation operating spec only if:
- the evaluation input contract is explicitly filled
- each phase writes its required output section
- audit findings use declared severity and evidence
- exercise scenarios cover the workflow's claimed scope or clearly mark gaps
- session traces are included when available, or explicitly marked unavailable
- the verdict follows the documented heuristics instead of personal preference
