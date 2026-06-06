## Problem
After the first review workflow is available, users may still need stronger process guidance for larger or more complex work packets, including earlier plan quality checks, bounded automatic review support, and concise execution-focus summaries before implementation starts.

## Solution
Extend the review workflow with additional support for earlier plan validation, optional per-command automatic review behavior at key phase boundaries, and concise in-session follow-up output for teams that want stronger guidance without introducing durable review artifacts. This second phase should build on the initial workflow without changing the spec-driven nature of the process.

## Acceptance Criteria
- [ ] AC1: A user can run a plan review before plan enrichment and receive concise feedback about plan contract issues and obvious coverage concerns.
- [ ] AC2: A user can choose workflows where review steps are run automatically only when explicitly enabled for defined phase boundaries.
- [ ] AC3: A user can receive a short readiness brief that summarizes the most important review focus areas before implementation starts.
- [ ] AC4: Review results remain ephemeral, path-scoped, and available in-session without creating durable review files by default or via the added automatic review options.
- [ ] AC5: Added review support keeps the workflow centered on artifact quality and phase alignment rather than broad autonomous task execution.

## Out of Scope
- A generic multi-agent platform for arbitrary delegation.
- Autonomous implementation agents that modify the codebase independently.
- Replacing human judgment for scope, product value, or final execution decisions.
- Broad technical domain review at the business-spec stage.
- Durable review files, appended review notes, or persistent review history in v2.

## Open Questions
- None. Resolved for v2 scope: automatic review is opt-in per command, and review output remains ephemeral.
