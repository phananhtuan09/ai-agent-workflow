# Decisions

Accepted product and domain rules, recurring technical conventions, and architecture, security, compatibility, or operational decisions, whose direction, constraints, and rationale future work must respect.
Shared rules: `../WORKFLOW.md` (Namespace contracts).

## Admission

Create a record only for accepted behavior or an accepted choice whose rules, rationale, or constraints future work must preserve, not for routine implementation choices or behavior merely inferred from code.
For a product or domain rule, state the externally observable rules from the consumer's perspective under `Decision`, one per bullet, with boundaries, precedence, failure behavior, and exceptions when they matter.
For a technical convention, state when it applies and when it does not under `Decision`, and the properties every conforming implementation must keep under `Constraints`; a convention inferred from code but never confirmed by a human is not recorded.
Filename: `YYYY-MM-DD-<lowercase-kebab-topic>.md`.

## Document format

```md
# <Decision title>

Status: Accepted | Superseded
Date: YYYY-MM-DD
Scope: <affected systems or boundary>

## Context

<The problem, forces, and constraints that made a decision necessary.>

## Decision

<The accepted direction stated precisely.>

## Constraints

- <Invariant or boundary future work must respect. Required when the decision imposes ongoing boundaries.>

## Consequences

- Positive: <benefit gained.>
- Negative: <cost, limitation, or burden accepted.>

## Alternatives considered

- <Alternative and the material reason it was not selected. Conditional.>

## References

- <Accepting request; related decision, code boundary, or source.>
```

`Status`, `Date`, `Scope`, `Context`, `Decision`, `Consequences`, and `References` are required.

## Writing rules

Describe the decision and its rationale, not the work used to apply it.
State only rationale and alternatives supported by the accepted decision or available evidence; do not present inference as historical intent.
Record meaningful drawbacks as well as benefits.
Do not use a decision record as a task log, brainstorm, or substitute for product behavior documentation.
