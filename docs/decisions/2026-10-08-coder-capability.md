# Experimental coder capability for Claude Code

Status: Accepted
Date: 2026-10-08
Scope: Optional `coder` skill, `coder-agent` bundle, and the Claude Code project hooks the installer derives for it

## Context

The repository-driven protocol keeps skills optional and has no required handoff, and `manage-project-knowledge` never mutates artifacts automatically.
In practice the human still had to prompt the agent to pick a fitting skill, run validation and review, propose artifact updates, and say what comes next.
The coding constitution assigns Implement and Validate to the AI and keeps intent, material decisions, and Sign Off with the human, so this prompting is human effort the workflow should remove.
Prompt guidance alone can be forgotten mid-session, and the constitution reserves hard enforcement for boundaries that matter.

Claude Code's `agent` setting and `--agent` flag replace the default Claude Code system prompt with the agent's prompt, which would drop the runtime's built-in coding guidance.
SessionStart hooks can add context without replacing that prompt and re-run on resume and compaction; Stop hooks can block a turn from ending.

## Decision

1. Add the canonical skill `skills/coder/` as an experimental coder contract: plan gate, skill routing, validation with the project's own checks (no automatic review subagent), knowledge proposals, git restraint, and a default handoff whose first line is `Status: HANDOFF | DECISION NEEDED | BLOCKED`, replaced by the report format the assigning prompt specifies (for example a Foreman worker prompt); the Stop gate also accepts a JSON report and skips Herdr workers.
2. Enable it by default per project through `.claude/settings.json` hooks, not the `agent` setting:
   - a SessionStart hook injects the contract body and records the starting working tree;
   - a Stop hook blocks once when the working tree changed since the last accepted stop and the final message lacks the status line.
3. Durable knowledge follows proposal-then-approval: the coder proposes product, decision, pattern, or runbook updates in its handoff and applies them with `manage-project-knowledge` only after the human approves.
   Active plans for durable work are maintained by the coder directly, as `docs/WORKFLOW.md` already allows.
4. The coder never commits, pushes, or changes branches unless the human asks in the current conversation.
5. Distribute it only through explicit selection of the `coder-agent` bundle (or the `coder` skill) in the `coding-standard` kit; the installer derives the hooked settings from the canonical `.claude/settings.json` instead of keeping a second settings source.

## Constraints

- Experimental: keep it out of every default kit and bundle until the A/B evaluation shows fewer non-decision human prompts without lower output quality.
- Claude Code only; other runtimes receive the skill text without enforcement.
- Existing project `.claude/settings.json` files are never modified; the installer prints the hooks to merge instead.
- Hooks fail open: missing git, malformed input, or state errors never block a session, and `stop_hook_active` prevents repeated blocking.
- The contract must not override `AGENTS.md`, `docs/WORKFLOW.md`, or `manage-project-knowledge` authority rules.

## Consequences

- Positive: skill choice, validation, review, knowledge proposals, and next-step suggestions no longer depend on the human prompting for them.
- Positive: the contract survives long sessions because it is re-injected after compaction.
- Negative: every session in an opted-in project pays the contract's context cost.
- Negative: the Stop gate checks only that a handoff was given, not that its evidence is true; human Sign Off still judges correctness.
- Negative: projects with their own settings must merge the hooks manually to activate the capability.

## Alternatives considered

- `agent` setting with a `coder` subagent as the main thread: rejected because it replaces Claude Code's default system prompt.
- A user-invoked `/coder` skill only: rejected because invoking it each session is the kind of human prompting this capability removes.
- Rewriting existing skill descriptions to be situation-triggered: deferred; the coder's routing table covers selection without changing other skills' behavior.

## References

- [Coding workflow constitution](../other/WORKFLOW_CODING_CONSTITUTION.md)
- [Canonical skill source decision](2026-09-19-canonical-skill-source.md)
- [Coder A/B benchmark protocol](../braintorm/2026-10-08-coder-ab-benchmark.md)
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/hooks
