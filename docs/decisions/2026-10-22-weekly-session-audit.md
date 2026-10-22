# Experimental manual weekly session audit

Status: Accepted
Date: 2026-10-22
Scope: `skills/workflow-evaluation/`, `docs/evaluation/reports/`, and the session extractor's `--triage` inventory

## Context

`record-workflow-friction` runs only when the human asks for it in the middle of a task, so it is not used and `docs/evaluation/observations/` stays empty.
Without observations there is no evidence for deciding which workflow skill to improve or split.
The existing retrospective audit handles one project per call, produces a full HTML evaluation, and keeps no memory across audits.

## Decision

1. Add an experimental weekly session audit mode to `workflow-evaluation`, defined in `skills/workflow-evaluation/references/weekly-audit.md`.
2. The human starts it manually in a dedicated session and supplies the project folder paths; nothing else is scanned.
3. Sources are local Claude Code and Paseo sessions, with Paseo resolved to its provider transcript.
4. The extractor's `--triage` option inventories several projects, filters by actual transcript timestamps (default 7 days), and ranks sessions by observable signals, with `#friction` notes first; only the top N (default 5) are deep-dived.
5. Each audit writes a Vietnamese Markdown report and updates one findings ledger under `docs/evaluation/reports/`, with the statuses, response ladder, and escalation rule from issue #31.

## Constraints

- No schedule, cron job, or hook is installed for the audit.
- The audit is read-only toward audited projects and their agents and never writes into audited checkouts.
- The mode stays labeled experimental, with its hypothesis and success criteria visible, until audits provide runtime evidence.
- The full HTML evaluation and `record-workflow-friction` remain unchanged.

## Consequences

- Positive: workflow friction evidence is collected without effort during coding sessions, and findings accumulate across weeks.
- Positive: the ledger's human verdicts provide calibration evidence for the evaluator.
- Negative: triage signals are heuristics and can miss sessions outside the top N.
- Negative: the human must start the audit each week; a missed week leaves a gap.

## References

- Human request, 2026-10-22: implement issue #31, "Add a manual weekly session audit with a findings ledger".
- `docs/other/WORKFLOW_CODING_CONSTITUTION.md` (experimental mechanisms)
- `docs/evaluation/STANDARD.md`
- `skills/workflow-evaluation/references/project-audit.md`
