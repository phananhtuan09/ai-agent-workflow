# Agent-maintained durable knowledge

Status: Accepted
Date: 2026-10-19
Scope: `docs/WORKFLOW.md`, `AGENTS.md`, durable knowledge namespaces, `manage-project-knowledge`, and `planner`

## Context

Durable knowledge under `docs/` changed only when a human explicitly asked for it, and the planner offered every knowledge update as a numbered choice.
In practice the namespaces stay empty or stale because recording knowledge is a separate human chore, while the authority rules, the planner, and reviews all depend on that knowledge.
Letting the agent write knowledge it infers from code into authority namespaces would let an existing defect become a rule that later work defends.

## Decision

1. The agent maintains durable knowledge itself before reporting a task; no separate human request, approval, or edit is needed.
2. Knowledge is accepted when a human states or confirms it in the conversation, such as a requested behavior change, a chosen option, or an answered decision question.
   Accepted knowledge goes to its authority namespace and cites the accepting request in `References`.
3. Knowledge inferred from code, tests, history, or runtime behavior is observed knowledge.
   It is recorded only in the new `docs/observed/` namespace, is never intent authority, and is corrected or removed when the code it describes changes.
4. A human request that confirms an observed fact as intended behavior moves it to the matching authority namespace.
5. When code changes that no human request authorized disagree with authority, the agent reports the drift and keeps the authority unchanged.
6. The agent keeps knowledge tidy while working: superseding, merging duplicates, fixing links, and moving finished plans.
7. The agent asks the human only when intended-behavior sources conflict and the conversation does not resolve the conflict.

## Constraints

- Inferred knowledge must never be written to `docs/product/`, `docs/decisions/`, or `docs/patterns/`.
- The existing admission thresholds still apply: record only knowledge that should outlive the task.
- Knowledge changes must appear in the task report so they stay visible in the diff.

## Consequences

- Positive: the human no longer requests, approves, or edits documentation, and knowledge stays current with the work.
- Positive: new projects gain current-state context in `docs/observed/` without promoting possible defects to rules.
- Negative: errors in what the agent treats as accepted reach the repository without a review step; correction relies on the human noticing them in the report or diff.
- Negative: documentation can grow noisy if agents apply the admission thresholds loosely.

## Alternatives considered

- Keep human-requested knowledge updates: rejected because the recording chore is the reason knowledge stays empty or stale.
- Let the agent write inferred knowledge directly into authority namespaces: rejected because a current defect would become intended behavior.
- Mark inferred entries with a status inside each authority namespace: rejected because mixing them makes it easy to read an inferred entry as authority.

## References

- Human request, 2026-10-19: let the AI agent manage documentation instead of the human, with accepted and observed knowledge kept separate.
- [Manual planner mode](2026-10-16-planner-capability.md), whose item 5 this decision replaces
- [Repository-driven workflow](../WORKFLOW.md)
- [Observed knowledge contract](../observed/README.md)
