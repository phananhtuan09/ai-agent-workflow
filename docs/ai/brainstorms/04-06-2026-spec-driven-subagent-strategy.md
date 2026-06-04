---
title: Spec-Driven Sub-Agent Strategy Brainstorm
date: 2026-06-04
status: draft
owner: ai-agent-workflow
---

# Spec-Driven Sub-Agent Strategy Brainstorm

## Why this document exists
This document captures the current decisions, constraints, reasoning, and open implementation directions for introducing sub-agents into the repository workflow.

It is intentionally written as a **brainstorm / design handoff artifact** so a future session can implement the sub-agent layer without needing to reconstruct the full conversation.

The goal is **not** to design a generic multi-agent platform.
The goal is to add the **smallest useful sub-agent layer** that fits the repository's existing **spec-driven development workflow**.

---

# 1. Core Workflow Context

The current workflow is built around these command stages:

1. `/create-spec`
2. `/create-plan`
3. `/enrich-plan`
4. `/execute-plan`
5. `/verify-feature`

The most important architectural constraint is:

> **The workflow is spec-driven. The spec is the primary artifact.**

This has major implications for sub-agent design.

---

## 1.1 Meaning of each stage

### `/create-spec`
Purpose:
- create a **business-logic-only** requirements artifact
- define the problem, solution intent, acceptance criteria, out of scope, and open questions

Important constraints from the command:
- no tech details
- no framework details
- no implementation details
- no file paths
- no project context duplication
- ACs must be human-verifiable

### `/create-plan`
Purpose:
- derive a technical implementation plan from the spec
- define approach and intent-based tasks
- still remain above file-level mapping

Important constraints:
- no file paths in tasks
- no `[DISCOVER]` tasks
- one plan file only
- tasks should describe intent, not implementation details
- file mapping is intentionally postponed

### `/enrich-plan`
Purpose:
- explore the codebase for each phase of the plan
- find which files will be modified or created
- identify relevant functions/constants/modules
- append a summary back to the plan

Important observation:
- this stage already conceptually contains a delegated worker model
- the command explicitly says to **spawn an Explore sub-agent**

### `/execute-plan`
Purpose:
- implement the work according to plan and phase details

### `/verify-feature`
Purpose:
- verify implementation against intended behavior/spec

---

# 2. Main Correction to Earlier Thinking

A previous line of thinking assumed sub-agents should focus on:
- security review
- performance review
- domain-technical review
- codebase scouting before plan

That direction is **not aligned** with the repository workflow.

Why it is wrong for this repository:
- the spec is intentionally **business-only**
- technical review too early would distort the purpose of the spec stage
- codebase-driven planning should not replace spec-driven planning
- `/enrich-plan` already owns file discovery and mapping

So the sub-agent strategy must follow this principle:

> **Sub-agents should reinforce artifact quality and cross-artifact alignment, not replace the spec-driven workflow with a codebase-driven workflow.**

---

# 3. Final Strategic Position

The sub-agent layer should not be framed as:
- autonomous implementation workers
- generic multi-agent orchestration
- parallel domain reviewers everywhere

Instead, it should be framed as:

> **artifact-focused delegated reviewers and mappers that strengthen phase transitions in a spec-driven workflow**

This leads to three primary sub-agent roles:

1. `review-spec`
2. `review-plan` or lightweight `plan-lint`
3. `explore`

And a likely fourth role later:

4. `review-alignment` and/or `readiness-brief`

---

# 4. Sub-Agent Roles That Fit the Workflow

## 4.1 `review-spec`

### Purpose
Review the generated spec before planning.

### What it should NOT do
It should **not**:
- review implementation strategy
- review architecture
- review security/performance as technical domains
- suggest file paths
- suggest framework-specific design

### What it SHOULD do
It should review the spec for:
- structural correctness
- verifiable acceptance criteria
- ambiguity
- missing edge cases
- contradiction between sections
- readiness for planning

### Why this role exists
Human reviewers are stronger at:
- product correctness
- business value
- scope judgment
- whether the feature is worth doing

Agent reviewers are stronger at:
- systematic artifact linting
- spotting ambiguity patterns
- spotting section contradictions
- detecting vague or untestable ACs
- identifying where downstream planning would be forced to guess

### Best framing
`review-spec` is not a product reviewer.
It is a **spec quality gate**.

---

## 4.2 `plan-lint` or `review-plan` (immediately after `/create-plan`)

### Purpose
Perform a lightweight validation of the plan artifact **before enrich-plan**.

### What it should NOT do
It should **not** try to deeply validate implementation realism at the file level.
That comes later after enrich-plan.

### What it SHOULD do
It should check:
- no `[DISCOVER]` tasks
- no file paths in tasks
- spec reference exists and is valid
- ACs appear to be covered at a task/phase level
- tasks are small and intent-based

### Why this role exists
This review exists to ensure the plan stage remains faithful to its contract.

Without it, the plan can drift into:
- file-level detail too early
- discovery work in the wrong phase
- oversized tasks that will become hard to enrich or execute

### Best framing
This is best understood as **plan contract lint**, not as final plan review.

---

## 4.3 `explore` (inside `/enrich-plan`)

### Purpose
Map plan phase intent into actual files/functions/constants/modules.

### What it should NOT do
It should **not**:
- review the business validity of the spec
- rewrite the plan
- perform implementation
- expand into broad architectural critique

### What it SHOULD do
It should:
- inspect the codebase for each phase
- identify files to modify
- identify files to create
- identify relevant existing symbols
- note any critical ordering or dependency constraints

### Why this role exists
This is the first phase where codebase discovery is supposed to happen.
Therefore the sub-agent here is not an optional concept invented later — it is already part of the intended workflow model.

### Best framing
`explore` is an **implementation-mapping worker**, not a reviewer.

---

## 4.4 `review-alignment` (preferred after `/enrich-plan`)

### Purpose
Compare the full artifact set:
- spec
- plan
- plan-details

and determine whether they still align and whether the overall packet is ready for execution.

### Why this role is important
This is where the workflow starts to produce enough files that human review becomes cognitively expensive.

A spec may look good alone.
A plan may look good alone.
A phase detail file may look good alone.

But the true risk now becomes:
- drift between artifacts
- missing traceability
- hidden assumptions
- enrichment that expands scope silently
- phases that cannot actually be executed smoothly

### Best framing
This should be treated as the **main cross-artifact review**.

---

## 4.5 `readiness-brief` (recommended, maybe not v1)

### Purpose
Reduce human overload after review passes.

### Problem it solves
After spec, plan, and phase-details exist, the human reviewer can feel overwhelmed:
- too many files
- too many mappings
- hard to verify traceability manually
- hard to know what to inspect most carefully

### What this worker should do
Instead of reviewing for pass/fail, it should synthesize a briefing for the human that answers:
- what matters most
- which ACs are easiest to miss
- which phases/files are highest leverage to inspect
- where ambiguity still exists
- whether execution appears safe to start

### Best framing
This is not another reviewer.
It is a **human cognitive-load reduction tool**.

---

# 5. Recommended Sub-Agent Topology

The current best-fit topology for the workflow is:

## Minimum viable topology
1. `review-spec`
2. `plan-lint`
3. `explore`
4. `review-alignment`

## More minimal alternative
If implementation needs to start smaller:
1. `review-spec`
2. `review-alignment`
3. `explore`

In that smaller model:
- `plan-lint` can be skipped initially
- `review-alignment` becomes the main downstream artifact review

---

# 6. Where Each Sub-Agent Lives in the Workflow

## 6.1 After `/create-spec`
### Preferred delegated step
Run `review-spec`.

### Why here
Because the next phase (`/create-plan`) should not derive implementation intent from a weak or ambiguous spec.

### Decision
This is a strong candidate for an automatic or semi-automatic internal review step.

---

## 6.2 After `/create-plan`
### Preferred delegated step
Run `plan-lint` or a lightweight `review-plan`.

### Why here
Because this is the best place to enforce phase boundaries:
- no file paths yet
- no discover tasks yet
- plan remains intent-based

### Decision
This should stay lightweight and cheap.
Do not overload this step with deep semantic review that depends on enrich output.

---

## 6.3 During `/enrich-plan`
### Preferred delegated step
Run `explore` once per phase.

### Why here
Because this is explicitly the codebase exploration stage.

### Decision
This is not optional in spirit — it is already embedded in the command design.

---

## 6.4 After `/enrich-plan`
### Preferred delegated step
Run `review-alignment`.

### Why here
This is the first point where all relevant planning artifacts exist together.
Only now can the workflow check:
- spec coverage
- plan-to-detail coverage
- details traceability
- readiness for execution

### Decision
This should become the **primary planning review gate**.

---

## 6.5 Before `/execute-plan`
### Preferred delegated step
Optionally run `readiness-brief`.

### Why here
This is the best place to reduce human overload before committing to implementation.

### Decision
Not required for v1, but highly aligned with the pain point described in this brainstorm.

---

# 7. Why These Review Criteria Were Chosen

This section is critical. The criteria below were chosen **not** to make review comprehensive in theory, but to make review useful in practice for this workflow.

---

## 7.1 `review-spec` criteria and reasoning

### Criterion A — structural compliance
Checks:
- correct sections present
- no tech details
- no file paths / implementation leakage
- open questions in the right section
- line limit respected or warned on

Why chosen:
- the spec command defines a strict artifact contract
- downstream planning depends on that contract remaining clean
- humans tend to focus on business meaning, not structural discipline
- agents are strong at deterministic format checking

### Criterion B — verifiability of ACs
Checks:
- ACs are testable by a human
- avoids vague language
- states user-observable behavior

Why chosen:
- acceptance criteria are the anchor for both plan coverage and final verification
- vague ACs create downstream guesswork
- agent detection of vague language patterns is high-value and cheap

### Criterion C — ambiguity / underspecification
Checks:
- missing error/edge cases
- missing boundary conditions
- unresolved behavior left implicit

Why chosen:
- this is one of the biggest causes of plan drift
- humans often auto-fill missing logic mentally
- agents can systematically ask: “what is not specified?”

### Criterion D — contradiction / overlap
Checks:
- Out of Scope conflicts with ACs
- Open Questions are already silently assumed in Solution
- sections contradict each other

Why chosen:
- contradiction is dangerous because it hides inside otherwise “reasonable” documents
- agents are good at section-to-section consistency checks

### Criterion E — planning readiness
Checks:
- is the spec sufficiently precise to derive a plan without significant guessing?

Why chosen:
- `review-spec` is not only linting; it is a phase gate
- the most practical question is whether planning should proceed

---

## 7.2 `plan-lint` criteria and reasoning

### Criterion A — no `[DISCOVER]`
Why chosen:
- plan and enrich are deliberately separate phases
- if discovery leaks into plan, the workflow loses its artifact boundaries

### Criterion B — no file paths in tasks
Why chosen:
- file mapping belongs to enrich-plan
- if paths appear early, the plan is skipping ahead into implementation mapping

### Criterion C — AC coverage at intent level
Why chosen:
- even before enrich, the plan should visibly cover the spec
- otherwise later enrichment just expands an already incomplete plan

### Criterion D — one intent per task
Why chosen:
- tasks that bundle too much are hard to enrich, execute, and verify
- this criterion keeps the plan decomposable

### Criterion E — valid spec reference
Why chosen:
- the plan must remain traceable back to its source spec

---

## 7.3 `review-alignment` criteria and reasoning

This is the most important review stage.

### Criterion A — spec -> plan coverage
Checks:
- every AC has task coverage

Why chosen:
- spec-driven workflows fail if requirements disappear during planning

### Criterion B — plan -> details coverage
Checks:
- every relevant phase/task is concretized by enrichment
- no major plan item remains unmapped

Why chosen:
- enrich-plan is supposed to make the plan implementation-ready
- unmapped tasks indicate abstraction or incomplete enrichment

### Criterion C — details -> spec traceability
Checks:
- mapped files and symbols still serve the intended requirements
- no obvious scope creep in details

Why chosen:
- enrichment can drift outward into extra files or unrelated surfaces
- this criterion protects spec ownership over implementation scope

### Criterion D — ordering / dependency sanity
Checks:
- phase order makes sense
- create/modify ordering is feasible
- cross-phase dependencies are not obviously broken

Why chosen:
- this only becomes visible after file mapping exists
- catching ordering issues now saves execution churn later

### Criterion E — test adequacy sanity
Checks:
- test checklist seems proportionate to actual enriched scope
- critical ACs appear verifiable through some test/manual path

Why chosen:
- after enrichment, the workflow can estimate whether validation is too thin
- this is not full test strategy review; it is readiness sanity-checking

### Criterion F — residual ambiguity
Checks:
- are there still unresolved assumptions that would force the implementer to guess?

Why chosen:
- the whole point of planning is to reduce execution ambiguity
- this criterion measures whether that objective was actually met

---

## 7.4 `readiness-brief` criteria and reasoning

This worker is not mainly a reviewer.
It is a synthesizer for human consumption.

### The human problem
After enough artifacts exist, the human can no longer comfortably inspect everything in detail.

### The agent advantage
The agent can:
- compress multiple artifacts
- rank what matters most
- point out where the human should focus
- make review tractable again

### Suggested outputs
- top ACs most likely to be missed
- top phases/files to inspect manually
- unresolved assumptions still worth human attention
- one short execution-readiness summary

Why chosen:
- this directly addresses cognitive overload rather than artifact correctness only

---

# 8. Automatic vs Manual Invocation

## 8.1 `review-spec`
Recommended mode:
- automatic or semi-automatic after `/create-spec`

Reasoning:
- very low token cost
- narrow artifact
- strong gate value

## 8.2 `plan-lint`
Recommended mode:
- automatic after `/create-plan`

Reasoning:
- cheap
- contract enforcement
- catches drift before enrich

## 8.3 `explore`
Recommended mode:
- internal to `/enrich-plan`

Reasoning:
- this is part of the command's actual purpose

## 8.4 `review-alignment`
Recommended mode:
- automatic after `/enrich-plan`
- or at least strongly recommended before `/execute-plan`

Reasoning:
- highest-value cross-artifact review point

## 8.5 `readiness-brief`
Recommended mode:
- optional/manual at first
- maybe automatic later for large plans

Reasoning:
- useful but not always necessary for small work packets

---

# 9. Strict vs Advisory Review Behavior

Not all review agents need the same enforcement level.

## 9.1 `review-spec`
Recommended behavior:
- mostly strict

Reason:
- a weak spec should not silently flow into planning

## 9.2 `plan-lint`
Recommended behavior:
- strict for boundary violations
- advisory for mild quality concerns

Strict examples:
- file paths in tasks
- `[DISCOVER]` tasks
- missing spec reference

Advisory examples:
- one task slightly too broad
- line count slightly high

## 9.3 `review-alignment`
Recommended behavior:
- mixed

Strict examples:
- AC completely uncovered
- major task not enriched
- details clearly out of scope

Advisory examples:
- test coverage looks slightly thin
- one phase ordering note is unclear

---

# 10. Token Efficiency Guidance

Sub-agents in this workflow should remain cheap.

## Principles
- keep each worker single-purpose
- avoid long narrative reasoning
- avoid passing the whole repository when only artifacts are needed
- prefer structured outputs over prose
- cap findings and recommendations

## `review-spec`
Input size:
- very small
Output should be capped to:
- pass/fail/warn
- a short issues list
- readiness status

## `plan-lint`
Input size:
- small
Output should be capped to:
- contract violations only
- minimal commentary

## `explore`
Input size:
- phase name + phase tasks
Output should be capped to:
- files to modify
- files to create
- max 3 notes

## `review-alignment`
Input size:
- spec + plan + detail files
This is the heaviest worker in the model.
To keep it efficient:
- return grouped findings rather than long prose
- return only mismatches, gaps, unresolved ambiguity, and human focus items

## `readiness-brief`
Output should be aggressively compressed.
Its value comes from shortness.

---

# 11. Recommended Output Shapes

## 11.1 `review-spec`
Suggested shape:

```md
Verdict: pass | fail | warn
Ready for planning: yes | no

Issues:
- [line X] ...

Ambiguities:
- ...

Missing cases:
- ...
```

---

## 11.2 `plan-lint`
Suggested shape:

```md
Verdict: pass | fail | warn
Ready for enrich-plan: yes | no

Contract violations:
- ...

Coverage concerns:
- AC2 not obviously covered by tasks

Warnings:
- ...
```

---

## 11.3 `review-alignment`
Suggested shape:

```md
Verdict: pass | fail | warn
Ready for execute-plan: yes | no

Spec -> Plan gaps:
- ...

Plan -> Details gaps:
- ...

Out-of-scope or weakly justified details:
- ...

Ordering / dependency concerns:
- ...

Test sanity concerns:
- ...

Residual ambiguity:
- ...

Human review focus:
- Read AC2 against Phase 2 details
- Recheck file X and file Y for scope creep
- Confirm unresolved assumption about ...
```

---

## 11.4 `readiness-brief`
Suggested shape:

```md
Execution readiness: high | medium | low

What this feature changes:
- ...

Most important ACs to verify:
- AC1 ...
- AC3 ...

Highest-impact phases/files:
- Phase 2 -> files A, B, C

Open points worth human attention:
- ...

Recommended next step:
- proceed to execute-plan
- or fix alignment issue X first
```

---

# 12. Most Likely v1 Implementation Shape

The most practical first version is probably:

## Version A — lean and realistic
1. `review-spec`
2. `explore`
3. `review-alignment`

This skips `plan-lint` initially if implementation bandwidth is limited.

Why this might be enough:
- `review-spec` protects spec quality
- `explore` is already part of enrich-plan intent
- `review-alignment` catches the highest-value downstream mismatches

## Version B — fuller but still controlled
1. `review-spec`
2. `plan-lint`
3. `explore`
4. `review-alignment`

This is probably the best long-term shape.

---

# 13. Strongly Rejected Directions

The following directions were discussed implicitly and should be considered out of scope for this sub-agent layer:

## Rejected A — generic domain-tech reviewers at spec stage
Examples:
- security reviewer for business-only spec
- performance reviewer for business-only spec

Why rejected:
- misaligned with artifact purpose
- introduces tech concerns too early

## Rejected B — codebase scouting before spec/plan by default
Why rejected:
- undermines the spec-first workflow
- shifts decision-making from requirements to implementation discovery too early

## Rejected C — autonomous write-capable sub-agents
Why rejected:
- unnecessary complexity
- too risky for current workflow needs
- not needed to solve the real pain point

## Rejected D — making `/enrich-plan` a large multi-review phase
Why rejected:
- enrich-plan should stay focused on file mapping
- additional review belongs after enrich, not inside it by default

---

# 14. Implementation-Oriented Open Questions

These are good next-session implementation questions.

## Q1. Should `review-spec` and `plan-lint` be internal command steps or user-facing commands?
Current leaning:
- internal or semi-internal steps
- visible result, but not necessarily separate user workflow burden

## Q2. Should `review-alignment` be a separate command or auto-run after `/enrich-plan`?
Current leaning:
- auto-run or strongly suggested immediately after enrich

## Q3. Should `readiness-brief` be a separate worker or just a section in `review-alignment`?
Current leaning:
- start as a section inside `review-alignment`
- split into a separate worker only if needed later

## Q4. Should review verdicts block progression automatically?
Current leaning:
- `review-spec`: mostly yes
- `plan-lint`: yes for contract violations, not for mild warnings
- `review-alignment`: yes for major alignment failures, not for advisory concerns

## Q5. Where should review outputs be stored?
Options:
- ephemeral output only
- append sections to existing artifact files
- write dedicated review result files

Current leaning:
- not decided here
- but durable outputs may help later auditability

---

# 15. Recommended Next Session Goals

A future implementation session should probably do the following in order:

1. Define the exact sub-agent set for v1
2. Decide whether `plan-lint` exists in v1 or is skipped
3. Define the output schema for:
   - `review-spec`
   - `review-alignment`
4. Decide auto vs manual invocation behavior for each worker
5. Decide whether review outputs are persisted
6. Implement the minimal extension/tooling layer to support those workers

---

# 16. Final Summary

The most important decisions captured in this brainstorm are:

1. The workflow is **spec-driven**, not codebase-driven.
2. Spec is **business-only**, so technical-domain reviewers are not appropriate at spec stage.
3. The most appropriate sub-agent roles are:
   - `review-spec`
   - `plan-lint` / lightweight `review-plan`
   - `explore`
   - `review-alignment`
4. `explore` belongs inside `/enrich-plan` and is already implied by the command design.
5. The most valuable deep review point is **after enrich-plan**, when spec, plan, and phase-details all exist.
6. Human overload after artifact expansion is a real problem; a later `readiness-brief` or `human_review_focus` output is highly valuable.
7. Sub-agents should strengthen artifact quality, traceability, and execution readiness — not introduce generic autonomous complexity.

---

# 17. Suggested One-Line Principle

If a single sentence should guide implementation, it is this:

> **Use sub-agents to validate and align workflow artifacts at the right phase boundaries, not to replace the spec-driven workflow with broad autonomous orchestration.**
