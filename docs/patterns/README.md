# Technical Patterns

Accepted recurring technical patterns, conventions, and implementation invariants: how the repository normally solves a class of technical problem.
Shared rules: `../WORKFLOW.md` (Namespace contracts).

## Admission

Create a pattern only when guidance is accepted, recurring, and useful across more than one implementation.
A convention inferred from code but never confirmed by a human is not a pattern; follow it from the code.

## Document format

```md
# <Pattern name>

Status: Active | Superseded
Applies to: <modules, layers, languages, or situations>

## Problem

<The recurring technical problem.>

## Applicability

<When to use the pattern and when not to.>

## Pattern

<The accepted approach and the minimum structure needed to apply it.>

## Invariants

- <Property every conforming implementation must preserve. Required when the pattern establishes constraints.>

## Example

<Small example or links to representative implementations. Conditional.>

## Trade-offs

- <Cost or limitation introduced. Required when the pattern accepts meaningful costs.>

## References

- <Related decision or stable symbol. Conditional.>
```

`Status`, `Applies to`, `Problem`, `Applicability`, and `Pattern` are required.

## Writing rules

Write reusable guidance rather than narrating one implementation, and define applicability narrowly enough that the pattern does not become a universal default by accident.
Prefer stable symbols and repository-relative links over copied source code.
An example does not establish a rule on its own.
