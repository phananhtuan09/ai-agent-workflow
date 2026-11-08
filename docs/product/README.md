# Product Knowledge

Accepted product behavior, business rules, domain language, and externally observable requirements: what the system should do.
Shared rules: `../WORKFLOW.md` (Namespace contracts).

## Admission

Add only accepted intent that should outlive one implementation task; behavior inferred from code or tests belongs in `../observed/`.

## Document format

```md
# <Product rule or domain topic>

Status: Active | Superseded
Scope: <affected users, systems, or domain boundary>

## Purpose

<Why this behavior exists and what outcome it protects.>

## Definitions

<Repository-specific terms needed to interpret the rules. Conditional.>

## Rules

- <One externally observable rule per bullet.>

## Examples

<Concrete boundary examples that create no new rules. Conditional.>

## Exceptions

<Accepted exceptions and their exact boundaries. Conditional.>

## References

- <Accepting request or decision; related schema, contract, or artifact.>
```

`Status`, `Scope`, `Purpose`, `Rules`, and `References` are required.

## Writing rules

Write behavior from the consumer or domain perspective, not implementation.
Make boundaries, precedence, failure behavior, and exceptions explicit when they affect observable behavior.
Link to decisions for rationale and constraints.
Do not include implementation plans, speculative behavior, source-code walkthroughs, or unaccepted proposals.
