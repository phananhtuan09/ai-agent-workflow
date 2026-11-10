# Nightly Paseo friction sweep

Use this mode only when a schedule the human installed starts a dedicated sweep agent.
It scans the local Paseo sessions active on the run day and records the friction they show as observations, so friction is captured without a mid-task request.

## Boundaries

- Trigger: a schedule the human created, such as a Paseo schedule; never create, change, or remove a schedule, cron job, or hook from this mode.
- Sources: local Paseo-backed sessions, resolved to their provider transcript; no cloud, remote daemon, or standalone Claude Code, Codex, or Opencode sessions.
- Window: from 00:00 local time on the run day until the sweep starts; activity after the sweep starts is out of scope.
- Read-only toward audited projects and their agents: never prompt, resume, interrupt, or modify a source agent, and never write into an audited checkout.
- Requires `workflow-evaluation` installed next to this skill for `extract_session_trace.py`; when it is missing, stop and report that.
- Outputs are observation files in the sweep workspace's `docs/evaluation/observations/`; extracted traces stay git-ignored under `docs/evaluation/session-traces/`.
- Do not diagnose root cause, write a report or ledger, commit, or change any skill or instruction file.

## 1. Discover projects

List the distinct working directories of every Paseo agent, including archived and worktree agents:

```bash
paseo ls -a -g --json
```

Expand a leading `~` in each `cwd` and pass every distinct path as a `--project`.

## 2. Triage the run day

```bash
python3 <workflow-evaluation-root>/extract_session_trace.py --triage --since "$(date +%F)" --project /path/a --project /path/b
```

In the ranked `triage` list, keep only entries with a non-empty `paseo_agent_ids` list.
Skip sessions whose task is a friction sweep or a workflow evaluation.
The sweep's own agent is excluded automatically through `PASEO_AGENT_ID`.

## 3. Deep dive

Extract the first 5 remaining entries of the ranked list, plus any remaining entry with a `#friction` note.
Always re-extract and read every selected session, even when observations already cite it; existing observations never exclude a session from the deep dive.

```bash
python3 <workflow-evaluation-root>/extract_session_trace.py --runtime <runtime> --input <transcript_path> --output-dir docs/evaluation/session-traces/<runtime>/<session-id>
```

Read the trace for observable friction from the `Categories` list in `SKILL.md`.
Before recording a friction, look for reasons it is not friction: changed human intent, expected exploration, or context missing from the trace.
Triage signals are leads, not findings; record only friction with direct trace evidence.

## 4. Record

Write one observation per distinct friction, using the `SKILL.md` artifact format with these differences:

- `status: audit-detected-observation`
- `session_reference: paseo/<agent-id> (<runtime>/<session-id>)`
- `runtime` and `model` from the trace, or `unknown`
- `## Evidence References` lists the trace path and the zero-based event `index` values
- `subject` is the audited project folder name

Before writing, search `docs/evaluation/observations/` for the same `session_reference` and category; skip only a friction that is already recorded there, and still record the session's other frictions.
When no friction is found, write nothing.

## 5. Finish

End with a short summary: projects scanned, Paseo sessions in the window, sessions deep-dived, observations written, and any `evidence_gaps`, `unknown_activity`, or `issues` from triage.
