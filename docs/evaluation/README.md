# Workflow Evaluation

Observations, session traces, and evaluation reports belong in this group.

Existing evaluation paths remain supported while skills migrate to this taxonomy.

- `observations/`: human-requested friction notes from `record-workflow-friction`.
- `session-traces/`: normalized, git-ignored session traces.
- `reports/`: HTML evaluation reports, plus the experimental weekly session audit's Markdown reports and findings ledger.

The weekly session audit is an experimental, manually started mode of `workflow-evaluation`.
It inventories the local Claude Code and Paseo sessions of the projects the human names within a time window (default 7 days), triages every session, deep-dives the top N, and records findings in `reports/findings-ledger.md` across audits.
A human message containing `#friction <note>` in any coding session ranks that session first in the next audit, so no mid-task skill call is needed.
Its hypothesis and success criteria are in the skill's `references/weekly-audit.md`.
