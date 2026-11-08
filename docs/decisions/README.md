# Decisions

Accepted architecture, security, compatibility, operational, or product decisions whose direction, constraints, and rationale future work must respect.
Shared rules: `../WORKFLOW.md` (Namespace contracts).

## Admission

Create a record only for an accepted choice whose rationale or constraints future work must preserve, not for routine implementation choices.
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

- <Accepting request; related product rule, pattern, runbook, code boundary, or source.>
```

`Status`, `Date`, `Scope`, `Context`, `Decision`, `Consequences`, and `References` are required.

## Writing rules

Describe the decision and its rationale, not the work used to apply it.
State only rationale and alternatives supported by the accepted decision or available evidence; do not present inference as historical intent.
Record meaningful drawbacks as well as benefits.
Do not use a decision record as a task log, brainstorm, or substitute for product behavior documentation.
