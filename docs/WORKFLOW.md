# Repository-driven Workflow

## Purpose

The repository-driven protocol is the default operating model.
It starts from the requested outcome and repository authority instead of requiring a fixed artifact or execution chain.
There is no fixed design, specification, execution, verification, or orchestration chain.

## Authority

Use the smallest relevant authoritative surface.
Apply this precedence:

1. Approved product and domain rules describe intended externally observable behavior.
2. Approved architecture and compatibility decisions constrain implementation choices.
3. Code, tests, schemas, configuration, and runtime evidence describe current implemented behavior.
4. Active plans describe work state but never override approved product or architecture authority.
5. Evaluation and learning standards govern only their explicitly selected kits.

Newly accepted durable knowledge belongs in the following locations:

| --- | --- |
| Product and domain rules | `docs/product/` |
| Architecture and compatibility decisions | `docs/decisions/` |
| Active durable plans | `docs/plans/active/` |
| Completed durable plans | `docs/plans/completed/` |
| Recurring technical patterns | `docs/patterns/` |
| Verified operating procedures | `docs/runbooks/` |

Evaluation and learning artifacts are optional kit-owned namespaces:

- `docs/evaluation/` contains workflow evaluation standards, observations, traces, and reports.
- `docs/learning/` contains learning standards and durable learning state.

These namespaces are independent of repository product authority and must not be silently merged into it.

## Work shapes

### Read-only work

Use this shape for explanation, investigation, review, diagnosis, or human-requested planning.
Inspect the smallest relevant surface and answer with evidence.
Do not create durable workflow artifacts by default.

### Bounded change

Use this shape for a localized feature, bug fix, validation change, UI change, or isolated refactor with a clear outcome.
Inspect the affected authority and current behavior, implement the smallest coherent change, run behavior-appropriate proof, and report the result.
Do not create a durable plan, feature artifact, or coordinator state for bounded work.

### Durable change

Create or resume `docs/plans/active/<plan>.md` only when at least one durable-memory condition applies:

- The work is likely to span sessions.
- Multiple contributors or agents need shared resumable state.
- Meaningful dependencies require coordinated sequencing.
- Recovery or rollback context must survive the current session.
- The task cannot be resumed safely from the repository and diff alone.

Keep only goals, current state, material decisions, dependencies, and validation evidence needed for safe resumption.
After the work and proof are complete, move a still-useful plan to `docs/plans/completed/`.
A plan is working memory and never product authority.

### Decision-blocked work

A task is decision-blocked when materially different product, security, compatibility, or operational choices remain open.
Stop before externally observable mutation and ask the smallest question that resolves the missing authority.
Choose ordinary implementation details directly when they do not create material policy.

## Execution rules

Inspect only files relevant to the requested outcome and affected behavior.
Reuse established repository patterns instead of creating parallel conventions.
Prefer the simplest mechanism that preserves correctness, safety, recoverability, and durable repository understanding.
Do not add a command, skill, workflow step, or artifact type without demonstrated recurring use.
Implement the smallest coherent end-to-end change rather than suppressing a symptom.
Preserve unrelated local changes.
Treat specialized skills as optional capabilities and load one only when it materially improves the work.
Do not make normal repository-driven execution depend on feature artifacts or coordinator state.
Do not add a fixed execution chain or require workflow artifacts for ordinary work.
Do not fabricate product rules, decisions, plans, runbooks, proof, or execution state.

## Durable knowledge threshold

Write to `docs/product/` only for accepted behavior that should outlive one implementation task.
Write to `docs/decisions/` only for meaningful decisions and rationale future work must respect.
Write to `docs/patterns/` only for accepted recurring technical guidance.
Write to `docs/runbooks/` only for verified operational procedures.
Do not create durable files merely to record that ordinary work occurred.

## Proof selection

Choose the cheapest reliable proof that observes the changed behavior.
Use focused unit proof for pure local logic, integration proof for boundaries, runtime or browser proof for visible behavior, and measurement for performance claims.
For a regression bug, reproduce the failure before the fix and confirm the same scenario after the fix when feasible.
For migration or recovery-sensitive behavior, exercise a dry run or recovery scenario.
Repository-wide checks supplement focused proof but do not replace it.

## Completion

Complete every requested end-to-end behavior and named acceptance criterion.
Update durable knowledge only when the change alters durable truth.
Remove temporary proof fixtures and scaffolding before completion.
Report changed behavior and direct automated evidence separately from checks that still require human judgment.
Do not claim evidence that was not observed.
