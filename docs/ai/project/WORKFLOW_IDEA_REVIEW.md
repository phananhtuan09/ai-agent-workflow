---
phase: project
title: Workflow Idea Review
description: Lightweight workflow for deciding whether a rough idea should become a spec, be reused, deferred, researched, or rejected
---

# Workflow Idea Review

## Purpose

`Idea Review` is the pre-spec decision workflow for rough or uncertain ideas.

Its goal is not to turn every idea into a spec. Its goal is to decide:

- whether the idea is worth doing
- whether the scope is appropriate for the real need
- whether to build, reuse, integrate, defer, research more, or reject
- whether the next step should be `/create-spec`

Use this workflow to keep speculative ideas from entering the implementation workflow too early.

## When To Use

Use `Idea Review` when the human says or implies:

- they have a rough product, workflow, or system idea
- they are not sure whether the idea is worth doing
- they want to decide the right scope before writing a spec
- they want to compare build versus existing/open-source/SaaS options
- they want a lightweight evaluation before `/create-spec`

Example triggers:

```text
/idea-review "I want to add real-time chat between buyers and sellers"
/idea-review "Should we build our own email marketing automation?"
Evaluate this idea before creating a spec
Should this become a feature?
```

## When Not To Use

Do not use this workflow when:

- the human already approved a clear feature and wants a spec now
- a durable spec already exists
- the task is a small local update suitable for `/execute-task`
- the human wants open-ended thinking only; use `brainstorm-partner`
- the work is a workflow design review; use the workflow evaluation standard

## Inputs

Required input:

- raw idea from the human

Optional inputs:

- known target users
- existing pain point
- desired outcome
- constraints, budget, deadline, or preferred tool choices
- links or names of external options to compare

If critical context is missing, ask 1-3 focused questions. Do not ask a long questionnaire upfront.

## Process

Run the workflow as a lightweight decision pass.

### 1. Normalize the idea

Restate the raw idea in clearer terms.

Output:

```md
## Raw Idea
...

## Interpreted Goal
...

## Assumptions
- ...
```

If assumptions are safe enough, continue. If they change the decision materially, ask focused questions before continuing.

### 2. Value check

Answer:

```text
Does this solve a real problem for a real user?
```

Evaluate:

- target user
- pain point
- frequency or urgency
- expected business/user value
- cost of doing nothing
- existing workaround

Output:

```md
## Value Check
Problem: ...
User affected: ...
Value: ...
Urgency: low | medium | high
Verdict: weak | moderate | strong
```

### 3. Fit and feasibility check

Answer:

```text
Does this fit the product and implementation context?
```

Evaluate lightly:

- product fit
- technical fit
- likely complexity
- security, privacy, abuse, data, or operational risks
- dependencies on existing systems

Use codebase recon only when repository context affects the decision.

Output:

```md
## Fit & Feasibility
Product fit: low | medium | high
Technical fit: low | medium | high
Complexity: low | medium | high
Risks:
- ...
```

### 4. Build vs reuse check

Answer:

```text
Is building from scratch the right move?
```

Check options in this order:

1. existing codebase capability
2. simpler workflow using existing features
3. open-source library or base project
4. SaaS or external tool
5. custom build

Use web research when current external options, licenses, maturity, or provider fit materially affect the decision.

Output:

```md
## Build vs Reuse
Existing codebase options:
- ...

Open-source options:
- ...

SaaS/tool options:
- ...

Recommendation: build | reuse | integrate | research more
```

### 5. Scope recommendation

Answer:

```text
If this is worth doing, what is the smallest useful scope?
```

Split scope into three sizes:

```md
## Scope Recommendation

### Small
- ...

### Medium
- ...

### Large
- ...

Recommended scope: small | medium | large
```

Prefer the smallest version that still solves the real pain. Do not recommend a large version unless the value and need are already clear.

### 6. Decision

End with one clear verdict.

Allowed verdicts:

- `do-now`
- `defer`
- `reject`
- `reuse-or-integrate`
- `research-more`

Output:

```md
## Decision
Verdict: do-now | defer | reject | reuse-or-integrate | research-more
Reason: ...
Next action: ...
```

## Decision Rules

### Do now

Use when:

- value is strong or clearly moderate
- scope can be kept small or medium
- fit is acceptable
- no better reuse/integration path exists

Next action:

```text
Create a spec for the recommended scope.
```

### Reuse or integrate

Use when:

- the need is valid
- an existing feature, open-source project, library, or SaaS solves most of it
- the idea is not a core product differentiator
- integration cost is lower than custom build

Next action:

```text
Create an integration spec or run focused option research.
```

### Research more

Use when:

- the decision depends on external options, licensing, maturity, security, or cost
- codebase context is not enough to choose
- the idea may be valuable but evidence is insufficient

Next action:

```text
Run a focused spike or compare a short list of options.
```

### Defer

Use when:

- value is plausible but not urgent
- the scope is larger than the current need
- other work is more important
- there is an acceptable workaround

Next action:

```text
Add to backlog with the missing validation question.
```

### Reject

Use when:

- value is weak
- target user or pain is unclear
- cost or risk is high relative to evidence
- the idea mainly exists because it sounds nice

Next action:

```text
Stop. Do not create a spec.
```

## Standard Output

A normal `Idea Review` response should be concise:

```md
# Idea Review: [Name]

## Verdict
...

## Why
...

## Build vs Reuse
...

## Recommended Scope
...

## Not In Scope
...

## Next Step
...
```

Create a durable artifact only when the review needs to be preserved or handed off. If persisted, use:

```text
docs/ai/ideas/YYYY-MM-DD-{slug}-evaluation.md
```

Do not create this artifact for every quick discussion.

## Human-Owned Decisions

The human owns:

- accepting business value and priority
- accepting product risk
- choosing between options when trade-offs depend on business preference
- approving transition to `/create-spec`

## Agent-Owned Checks

The agent owns:

- making assumptions explicit
- checking fit, complexity, and risks at a lightweight level
- checking build versus reuse options when relevant
- recommending the smallest useful scope
- refusing to force weak ideas into specs

## Relationship To Other Workflows

`Idea Review` sits before the standard coding workflow:

```text
raw idea
  -> idea-review
      -> reject
      -> defer
      -> research-more
      -> reuse-or-integrate
      -> do-now
  -> /create-spec
  -> /execute-spec
  -> /sync-spec
  -> /verify-feature
```

It differs from `brainstorm-partner`:

- `brainstorm-partner` is open-ended thinking and may not produce a decision.
- `Idea Review` is a bounded decision workflow with a final verdict.

It differs from `/create-spec`:

- `/create-spec` writes the implementation contract after the idea is approved.
- `Idea Review` decides whether the idea should become a spec at all.

## Related Files

- `docs/ai/project/AI_WORKFLOW_RULES.md`
- `docs/ai/project/WORKFLOW_CODING_STANDARD.md`
- `docs/ai/workflows/idea-review.json`
