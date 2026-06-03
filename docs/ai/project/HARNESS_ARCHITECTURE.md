---
phase: project
title: Agent Harness Architecture
description: Agent-agnostic target architecture for a multi-tool coding-agent harness
---

# Agent Harness Architecture

## Purpose
This document defines the **target harness architecture** for this repository's AI workflow system.

It is intentionally **agent-agnostic**:
- it does not assume Claude Code, Codex, Pi, or any single runtime
- it focuses on architectural layers, responsibilities, contracts, and evolution paths
- it acts as a stable blueprint for future implementation across different coding-agent tools

This is **not** an implementation guide.
It defines the structure we want the workflow system to grow toward.

---

## Goals
The harness should allow multiple coding agents to operate against the same workflow model with consistent behavior.

Core goals:
- keep workflow logic portable across tools
- separate workflow content from runtime-specific bindings
- make execution safer, more observable, and easier to review
- support both single-agent and multi-agent/task-delegation patterns
- preserve simple usage for small tasks while scaling to larger feature workflows

---

## Design Principles

### 1. Agent-agnostic first
Workflow definitions should not depend on one vendor's command format, tool names, or UI assumptions.

### 2. Files as durable workflow artifacts
Important workflow state should live in files where possible, not only in transient chat history.

### 3. Clear phase boundaries
Each major phase should have explicit inputs, outputs, and exit criteria.

### 4. Safety before autonomy
The harness should prefer scoped execution, approvals, and bounded permissions over unrestricted automation.

### 5. Parallelize analysis, serialize mutation
Discovery and review can be parallelized more freely than code mutation. Final writes should remain controlled.

### 6. Humans stay in control of ambiguity and risk
The harness should escalate when scope, risk, or intent is unclear.

### 7. Evolve by contracts
The system should grow by adding contracts between layers rather than by embedding more prompt-only behavior.

---

## High-Level Architecture
The target harness is organized into the following layers:

1. `Workflow Content Layer`
2. `Orchestration Layer`
3. `Artifact Contract Layer`
4. `Capability and Tooling Layer`
5. `Runtime Policy Layer`
6. `Approval and Escalation Layer`
7. `State and Memory Layer`
8. `Observability Layer`
9. `Concurrency and Delegation Layer`
10. `Runtime Adapter Layer`

These layers are logical boundaries. A concrete tool may implement several layers together, but they should remain conceptually separate.

---

## 1. Workflow Content Layer
## Responsibility
Defines what the workflow means.

## Contains
- workflow commands and entrypoints
- reusable task patterns
- skills, roles, prompts, and review patterns
- project guidance and conventions
- response styles and task-specific playbooks

## Why this layer exists
Without this layer, the system has no shared operating model.
It captures the team's process knowledge in a reusable form.

## Desired property
Content should be reusable across runtimes with minimal rewriting.

---

## 2. Orchestration Layer
## Responsibility
Defines how work moves through phases.

## Contains
- phase model
- allowed transitions
- handoff rules between phases
- routing rules by task type
- stop/retry/rework conditions

## Why this layer exists
Good prompts alone do not guarantee consistent execution order.
This layer turns a collection of commands into a coherent workflow system.

## Desired property
A task should follow a predictable path from request to verification.

---

## 3. Artifact Contract Layer
## Responsibility
Defines the durable inputs and outputs exchanged between phases.

## Contains
- spec structure
- plan structure
- review output structure
- verification structure
- decision and handoff record formats

## Why this layer exists
If artifacts are inconsistent, downstream phases become fragile and hard to automate.
This layer makes workflow artifacts reviewable, comparable, and machine-friendly.

## Desired property
Every phase should consume and produce artifacts with clear expectations.

---

## 4. Capability and Tooling Layer
## Responsibility
Defines what actions the harness can perform.

## Contains
- read/search/edit/execute capabilities
- test and validation capabilities
- domain-specific tools
- optional delegation and analysis helpers
- capability boundaries for each workflow mode

## Why this layer exists
Workflow intent must map to actual executable capabilities.
This layer prevents ambiguity about what the system can and cannot do.

## Desired property
Capabilities should be explicit, composable, and scoped to the current task.

---

## 5. Runtime Policy Layer
## Responsibility
Enforces execution safety and scope.

## Contains
- command safety rules
- path and file protection rules
- environment and secret handling rules
- network access policy
- scope boundaries for edits and commands
- mutation constraints

## Why this layer exists
Instructions alone are not enough to guarantee safe behavior.
This layer reduces accidental damage and keeps automation aligned with repository boundaries.

## Desired property
Unsafe actions should be constrained by policy, not only by prompt wording.

---

## 6. Approval and Escalation Layer
## Responsibility
Determines when the harness can proceed automatically and when human approval is required.

## Contains
- approval thresholds
- risk categories
- escalation rules for ambiguity
- human checkpoints for destructive or high-impact changes
- exception handling paths

## Why this layer exists
Not all tasks carry the same level of risk.
This layer allows the harness to remain efficient for small tasks while staying controlled for sensitive work.

## Desired property
Low-risk work should flow quickly; high-risk work should pause for review.

---

## 7. State and Memory Layer
## Responsibility
Tracks workflow progress beyond the current chat turn.

## Contains
- active phase state
- progress markers
- assumptions and open questions
- decision log
- handoff notes
- branch/fork context where needed

## Why this layer exists
Long-running work cannot depend only on ephemeral conversation context.
This layer supports resume, branching, continuity, and collaboration.

## Desired property
Important workflow state should survive tool changes, restarts, and long task durations.

---

## 8. Observability Layer
## Responsibility
Makes harness behavior inspectable.

## Contains
- phase transition logs
- task summaries
- execution checkpoints
- review findings
- verification results
- risk and blocker reporting
- optionally usage/time/cost reporting

## Why this layer exists
A workflow system cannot improve if its behavior is opaque.
This layer supports trust, debugging, review, and optimization.

## Desired property
A human should be able to understand what happened, why it happened, and what remains unresolved.

---

## 9. Concurrency and Delegation Layer
## Responsibility
Defines how the harness handles multiple tasks, workers, or delegated analysis.

## Contains
- rules for parallel discovery and review
- serialization rules for file mutation
- worker role boundaries
- delegation contracts
- merge/integration expectations for findings

## Why this layer exists
As workflows grow, analysis often benefits from parallelism, but uncontrolled writes create conflicts and risk.
This layer enables safe delegation without losing control of final outcomes.

## Desired property
The harness should support delegated work while preserving a clear final authority for code changes.

---

## 10. Runtime Adapter Layer
## Responsibility
Connects the architecture to concrete coding-agent tools.

## Contains
- tool-specific bindings
- runtime-specific command mappings
- agent-specific prompt wrappers
- environment-specific integration points
- packaging/distribution strategy per runtime

## Why this layer exists
Different coding agents expose different extension points, commands, and tool APIs.
This layer isolates those differences so that core workflow content remains portable.

## Desired property
Changing runtimes should require adapting bindings, not rewriting the full workflow model.

---

## Relationship Between Layers
At a high level:

- `Workflow Content Layer` defines intent
- `Orchestration Layer` defines flow
- `Artifact Contract Layer` defines durable exchange points
- `Capability and Tooling Layer` defines executable actions
- `Runtime Policy Layer` constrains behavior
- `Approval and Escalation Layer` controls risk
- `State and Memory Layer` preserves continuity
- `Observability Layer` exposes behavior
- `Concurrency and Delegation Layer` scales execution patterns
- `Runtime Adapter Layer` makes the system portable across tools

No single layer should absorb the responsibilities of all others.
Prompt content should not be the only place where orchestration, safety, and state are encoded.

---

## Recommended Separation of Concerns
To keep the harness portable, separate assets into three broad groups:

### A. Core workflow assets
Stable, runtime-independent definitions:
- task phases
- artifact schemas
- review criteria
- routing rules
- project conventions

### B. Runtime bindings
Tool-specific mappings:
- command registration
- extension hooks
- UI integrations
- tool adapters
- packaging conventions

### C. Execution artifacts
Generated or evolving task data:
- specs
- plans
- verification docs
- decision logs
- handoff summaries

This separation should be preserved as the repository evolves.

---

## Maturity Model
The harness is expected to evolve through stages.

### Stage 1 — Prompted workflow
- reusable commands and guidance exist
- execution depends heavily on model behavior

### Stage 2 — Structured workflow
- commands map to artifacts and phases more consistently
- project standards and task types are clearer

### Stage 3 — Controlled harness
- policies, approvals, and artifact contracts become explicit
- workflow becomes safer and more predictable

### Stage 4 — Observable portable harness
- multiple runtimes can use the same workflow model
- state, logs, and handoffs are durable
- delegation patterns are controlled and inspectable

This document targets **Stage 3 → Stage 4** as the long-term direction.

---

## Non-Goals
This document does not define:
- vendor-specific implementation details
- exact command syntax for any runtime
- concrete extension APIs
- exact file schemas for every artifact
- exact UI behavior
- exact sub-agent implementation strategy

Those belong in runtime-specific design and implementation documents.

---

## Future Companion Documents
This architecture can later be supported by more detailed documents such as:
- `runtime-policies.md`
- `artifact-contracts.md`
- `task-orchestration.md`
- `approval-matrix.md`
- `delegation-model.md`
- `runtime-adapters/<tool>.md`

These should refine the architecture without changing its core separation of concerns.

---

## Success Criteria
The harness architecture is successful when:
- the same workflow model can be adapted to more than one coding-agent tool
- task behavior is more consistent across runs
- risky actions are bounded by policy and approvals
- important workflow state is not trapped in chat history
- humans can inspect and trust what the system did
- the system can grow from simple single-agent use to structured delegated workflows

---

## Summary
This harness architecture is intended to move the repository from a collection of useful agent workflows toward a **portable, controlled, observable, and extensible coding-agent operating model**.

The key architectural idea is simple:

> keep workflow knowledge portable, keep runtime bindings isolated, and add explicit layers for safety, state, contracts, and observability as the system matures.
