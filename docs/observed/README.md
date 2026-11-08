# Observed Knowledge

Current-state facts the agent inferred from code, tests, history, or runtime behavior: how the system behaves now, not how it should behave.
Observed knowledge is context, never product, decision, or pattern authority; a fact may describe a defect and never justifies keeping that behavior.
Verified operational procedures belong in `../runbooks/`.
Shared rules: `../WORKFLOW.md` (Namespace contracts).

## Admission

Record only a fact future work needs and cannot cheaply rediscover from the code.
Every fact must cite repository evidence such as a path, stable symbol, commit, or test.
Do not restate facts an authority namespace already holds.

## Document format

```md
# <Observed topic>

Scope: <affected modules, systems, or domain boundary>

## Facts

- <One current-state fact per bullet.> Evidence: <path, symbol, commit, or test>

## Open questions

- <Behavior whose intent is unclear, such as a possible defect. Conditional.>

## References

- <Related authority artifact. Conditional.>
```

`Scope` and `Facts` are required.

## Lifecycle

When code changes a recorded fact, correct or remove it in the same task.
When a human explicitly states that a fact is intended behavior, move it to the matching authority namespace and remove it here.
Delete an artifact that has no remaining facts.

## Writing rules

Describe observable behavior and boundaries, not code walkthroughs, without normative terms.
Do not guess rationale or intent; record the uncertainty under `Open questions`.
