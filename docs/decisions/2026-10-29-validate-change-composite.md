# Opt-in validate-change composite

Status: Accepted
Date: 2026-10-29
Scope: Optional `validate-change` skill, `validate` bundle, and the handoff contracts it adds to `review-pr` and `runtime-e2e-test`

## Context

After a change, the human prompted the agent to run `quality-code-check`, `review-pr`, and `runtime-e2e-test` in turn and reconciled three outputs.
Each skill derived intent on its own, so the derived intents could disagree, and nothing carried review's affected flows and unproven suspicions into the runtime step.
`AGENTS.md` says specialized skills never form a required execution chain, so a composite must not become one.

The constitution's five questions for a new mechanism:

1. Problem: intent was derived twice and could disagree, review findings did not reach runtime testing, and the human did the reconciliation.
2. Why simpler is not enough: calling the three skills by hand keeps the human as the integrator, and each skill keeps re-deriving intent from the implementer's account; adding fields to one skill would not give the others the same list.
3. How it reduces risk and human work: one expectation list with human-stated sources, one risk-based confirmation instead of one per skill, a structured handoff from review to runtime, an independent audit for high-risk changes, and a status computed by code.
4. Who consumes the output: the human accepting the change, through `report.md`, `status.json`, and the runtime `report.html`; Implement, for the failures it must fix.
5. How improvement is measured: on the same testbed scenarios, the manual three-skill flow against `/validate-change`, k=2 each, comparing recall of planted defects and false alarms on a low-risk change, kept separate; the number of human interventions per accepted change; and how often a reported item was acted on, demoting any signal type above 10% "not useful".

## Decision

1. Add `skills/validate-change/`, distributed through the `validate` bundle with the three skills it calls, as an opt-in command started only by `/validate-change`. Claude Code keeps it manual with `disable-model-invocation: true`, Codex with `allow_implicit_invocation: false`.
2. The composite performs no checks. It writes one expectation list, K1..Kn, tagged `prompt`, `spec`, `assumption`, or `agent-intent`; `review-pr` and `runtime-e2e-test` consume it instead of deriving intent. A PR description is never an intent source.
3. Whether the human confirms the list before checks run is decided by deterministic, project-editable rules in `references/risk-rules.md`: money, data, and permission signals, weakened tests, size, shared files, configuration, intent with no human source, and recorded conflicts. High-risk changes also get one independent audit in a fresh context that sees only the expectations and the runtime evidence. A headless run that needs the gate ends with `NEEDS_HUMAN`.
4. Steps pass state as JSON files in one run directory. `scripts/validate_change.py` validates enums, IDs, references, counts, and the head commit, recomputes the risk from the diff, verifies the runtime bundle with the runtime tool, and computes the overall status worst first. It never parses prose.
5. `review-pr` writes its handoff only when the composite calls it; its standalone output is unchanged.

## Constraints

- Each specialist skill stays independently usable, and no workflow step requires the composite.
- The composite and its steps never modify application code.
- Security, performance, and accessibility signals are reported only under `Cần test riêng` as prompts for a human decision, never as defects, and never change the status.
- New results go into generated files; the agent does not copy computed values into prose fields.

## Consequences

- Positive: intent is fixed once and traceable to its source; the human answers at most one confirmation per run.
- Positive: the status and the gate can be recomputed without an LLM, and a stale or edited `risk.json` is refused.
- Negative: the risk thresholds are starting values, not calibrated ones, and the path and token rules will miss or over-flag some projects until edited.
- Negative: the composite depends on all three specialist skills being installed and on a runtime that can start a fresh-context subagent for the audit; without one the audit is reported missing.
- Negative: other runtimes rely on the skill description to keep it manual.

## Alternatives considered

- A required chain run after every change: rejected by the no-required-chain principle and because small changes do not need it.
- Letting each skill keep deriving intent and reconciling afterwards: rejected because disagreements would still reach the human.
- An LLM-judged risk score for the gate: rejected because it cannot be re-run deterministically; risk judgment stays in ordering the flows.

## References

- Human request, 2026-10-29: implement issue #51 (validate-change composite), adopting the research ideas that fit the repository.
- [Repository-driven workflow](../WORKFLOW.md)
- [Workflow coding constitution](../other/WORKFLOW_CODING_CONSTITUTION.md)
- [Manual planner mode](2026-10-16-planner-capability.md), the earlier opt-in precedent
