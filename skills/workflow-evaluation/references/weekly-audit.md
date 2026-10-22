# Weekly session audit (experimental)

Use this mode when the human starts a dedicated session to audit the recent sessions of the projects they name.
It reuses [project-audit.md](project-audit.md) for discovery, isolation, and evidence checks, and `docs/evaluation/STANDARD.md` for attribution and calibration.

## Experimental status

This mode is experimental and is not proven by runtime evidence.

- Problem: `record-workflow-friction` runs only on an explicit mid-task request, so `docs/evaluation/observations/` stays empty and skill changes lack evidence.
- Hypothesis: a manual weekly audit of all recent sessions finds recurring workflow friction with no effort during coding sessions.
- Success criteria, reviewed after four audits:
  - every audit finishes inside one dedicated session with per-project coverage visible;
  - the human confirms at least half of the main findings they give a verdict on;
  - at least one confirmed finding leads to an experiment whose next audit shows `resolved` or a measured lower recurrence.
- Rollback: the mode is additive; the full HTML evaluation, `--list`, and `record-workflow-friction` are unchanged and remain the comparison baseline.

## Boundaries

- Trigger: manual only, in the session the human started for the audit; never add a schedule, cron job, or hook.
- Sources: local Claude Code and Paseo sessions (Paseo resolved to its provider transcript); no cloud, remote daemon, or standalone Codex/Opencode sessions.
- Projects: only the folder paths the human supplies; ask once if none were given.
- Read-only toward audited projects and their agents: never prompt, resume, or modify a source agent, and never write into an audited checkout.
- All outputs go to the audit workspace's `docs/evaluation/`; extracted traces stay git-ignored under `session-traces/`.
- Implementing suggested experiments is a separate task.

## 1. Inventory and triage

```bash
python3 <skill-root>/extract_session_trace.py --triage --project /path/a --project /path/b [--since 2026-10-15] [--until 2026-10-22] [--top 5] [--exclude-session <id>]
```

`--triage` prints JSON and writes no files.
The default window is the 7 days before `--until` (default now); naive dates are local time.
Sessions are kept when their actual transcript timestamps overlap the window; file mtime only rules sessions out.
Paseo wrappers are merged into their provider transcript (`paseo_agents`); subagent transcripts are listed under `subagents` and excluded from the denominator.
The running audit session is excluded automatically from `CLAUDE_CODE_SESSION_ID` and `PASEO_AGENT_ID`; pass `--exclude-session` when those are absent.
Unavailable Paseo transcripts appear under `evidence_gaps`, and unreadable files under `issues`.

Each session gets `triage` signals: `#friction` notes, human messages, interrupts, human messages after a "done" claim, tool errors, repeated commands, revert commands, compactions, duration, events, and skills used.
The ranked `triage` list puts sessions with a `#friction` note first, then orders by `score`, and marks the top N as `deep_dive`.
Signals and `#friction` notes are leads, not findings.

## 2. Deep dive (top N only)

Extract each `deep_dive` session into the audit workspace:

```bash
python3 <skill-root>/extract_session_trace.py --runtime <runtime> --input <transcript_path> --output-dir docs/evaluation/session-traces/<runtime>/<session-id>
```

When the runtime supports it, give each session to an isolated read-only sub-agent with the trace path, the triage signals, and the finding contract below; it returns findings and writes nothing.
Run the blind behavioral pass of the `Diagnose` phase before reading workflow rules.

Each finding carries:

- event references (zero-based trace `index` values);
- the first divergence, or `unknown`;
- a rebuttal pass that looks for reasons the suspicion is wrong (changed human intent, expected exploration, environment or tool failure, missing context in the trace) and its result;
- a class: `confirmed mistake`, `improvement opportunity`, or `insufficient data`;
- the attribution categories from the skill's `Decide` phase.

## 3. Findings ledger

Keep one ledger at `docs/evaluation/reports/findings-ledger.md`; create it on the first audit.
Match each new finding to an existing entry by failure mechanism, not wording; a match appends an occurrence to the existing ID instead of creating a duplicate.

```markdown
## WSA-001: <short mechanism title>

- Status: new
- Mechanism: <failure mechanism in one sentence>
- Class: <confirmed mistake | improvement opportunity | insufficient data>
- Attribution: <category>
- Rung: <applied or suggested rung, or none>
- Human verdict: pending
- Experiment: none

| Week | Project | Session | Events | Note |
| --- | --- | --- | --- | --- |
| 2026-10-22 | <project> | <runtime>/<session-id> | 12, 40 | <one line> |
```

Statuses:

- `new`: recorded, no human verdict yet.
- `confirmed`: the human confirmed it.
- `rejected`: the human rejected it; later matches are appended and reported but do not reopen it unless the human says so.
- `experimenting`: a targeted change is in place; the next audit checks it for recurrence.
- `resolved`: an audit after `experimenting` saw comparable sessions without recurrence; with no comparable sessions it stays `experimenting`.
- `recurred`: it occurred again after `experimenting` or `resolved`.

When the human confirms or rejects a finding, record `confirmed|rejected YYYY-MM-DD: <reason>` under `Human verdict` and update the status.
These verdicts are human reference review for evaluator calibration in `docs/evaluation/STANDARD.md`; report `evaluation_quality_status` from them and show `Chưa đo` for unmeasured metrics.

## 4. Response ladder

Every suggested experiment names the lowest rung that plausibly prevents recurrence:

0. No change (one-off or model-execution).
1. Add project context (product rules, decisions, patterns, runbooks).
2. Edit an existing skill.
3. Remove or merge a rule, step, or skill.
4. Replace guidance with a deterministic script or check.
5. Hard enforcement (permission or hook) for high-risk boundaries.
6. A new skill for a new recurring task type.
7. A new agent when isolation, context size, permissions, parallelism, or cost requires it.

A suggestion above rung 2 states why each lower rung is insufficient.
A finding escalates one rung above its previous fix only when the ledger shows it `recurred` after that lower-rung fix.
List skills with no `skills_used` occurrence in the audited sessions, and rules with no observed use in the deep-dived traces, as rung-3 candidates; absence of use is a lead, not proof of no value.

## 5. Report

Write one Vietnamese Markdown report per audit to `docs/evaluation/reports/weekly-audit-YYYY-MM-DD.md`, dated by the window end.
Do not use the HTML template for this mode.

```markdown
# Audit session hằng tuần YYYY-MM-DD (thử nghiệm)

Cửa sổ: <since> → <until> · Top N: <n> · evaluation_quality_status: <status>

## Độ phủ theo project
| Project | Session tìm thấy | Đã triage | Deep dive | Subagent (không tính) | Loại trừ | Thiếu evidence / lỗi |

## Phát hiện chính
<At most 5: ledger ID, class, event references, first divergence or `unknown`, rebuttal result, attribution, recurrence as numerator/denominator.>

## Lặp lại so với ledger
<Ledger IDs seen this week with status before and after, and `experimenting` entries checked for recurrence.>

## Thử nghiệm đề xuất
<At most 3: ledger ID, rung, hypothesis, smallest change, success threshold, why lower rungs are insufficient for rung 3+, and the `recurred` entry for any escalation.>

## Ứng viên rung 3 (không thấy được sử dụng)

## Chờ human xác nhận

## Giới hạn
```

Omit secrets and unnecessary raw transcript content, and keep measured counts only.
