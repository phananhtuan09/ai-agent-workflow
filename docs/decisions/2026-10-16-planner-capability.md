# Manual planner mode

Status: Accepted
Date: 2026-10-16
Scope: Optional `planner` skill, `planner-mode` bundle, and removal of the `coder` capability

## Context

The `coder` capability made every session in an opted-in project a manager-and-coder contract with a plan gate, a mandatory `Status:` handoff, and SessionStart and Stop hooks.
The need behind it is narrower: the human spends effort working out the next prompt for the agent inside the repository workflow.
The coder enforcement was heavier than that need, was limited to Claude Code, and its A/B benchmark never ran, so no measured result depends on it.

## Decision

1. Replace `coder` with the canonical skill `skills/planner/`, distributed through the `planner-mode` bundle with `quality-code-check`, `smart-commits`, and `manage-project-knowledge`.
2. The human turns planner on with `/planner`; it then applies for the rest of the conversation and is never invoked automatically.
3. For each prompt the planner places the task on the repository workflow map, picks and runs the fitting step or skill, and ends with two or three numbered next steps, one of them marked as recommended.
4. The planner asks first before git actions, outward actions, and unresolved product, security, compatibility, or operational decisions.
   An explicit request, or choosing a numbered option that names that exact action, approves that action only.
5. Choosing an option that names a durable knowledge target and a one-line summary of the change is the explicit request `manage-project-knowledge` requires; a vague request to write docs is not.
6. For ambiguous prompts the planner resolves what it can from repository evidence first, acts on cheap reversible guesses while stating them, and offers concrete readings as choices when a wrong guess would be expensive.
7. Remove the `coder` skill, its hook scripts, the `coder-agent` bundle, the installer's derived hook settings, and their tests.

## Constraints

- The skill is plain instructions with no hooks and installs for Claude Code, Codex, and Antigravity.
- It must not override `AGENTS.md`, `docs/WORKFLOW.md`, or the authority and stop points of the skills it routes to.
- A report format set by the assigning prompt, such as an orchestrator worker prompt, replaces the next-step choices.

## Consequences

- Positive: the human can continue a task by choosing a number instead of writing the next prompt, and skill selection no longer depends on the human naming the skill.
- Positive: no project settings or hooks are installed, and `update` retires previously installed coder files and hooks.
- Negative: nothing enforces the mode; it can fade in very long sessions or after compaction because no hook re-injects it.
- Negative: `disable-model-invocation` is a Claude Code field; other runtimes rely on the description to keep the skill manual.
- Negative: suggestion quality depends on recorded product rules and decisions; where intent is not recorded, the planner must ask.

## Alternatives considered

- Keep `coder` and add numbered next steps: rejected because the plan gate, handoff template, and hooks are the weight the change removes.
- Suggest skills without running them: rejected because the human would still spend a turn on every routine step.

## References

- Supersedes [Experimental coder capability for Claude Code](2026-10-08-coder-capability.md)
- [Planner brainstorm](../braintorm/2026-10-13-planner-skill.md)
- [Repository-driven workflow](../WORKFLOW.md)
- Item 5 of the Decision is replaced by [Agent-maintained durable knowledge](2026-10-19-agent-maintained-knowledge.md)
