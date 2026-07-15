# Session Traces

Normalized session trace artifacts for workflow evaluation.

## Directory Convention

Store extracted traces under:

```text
docs/ai/session-traces/{runtime}/{session-id}/
```

Examples:
- `docs/ai/session-traces/claude/01bbffaa-86ff-46ae-b1ad-467fc7707fd4/`
- `docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/`

## Source Transcripts

Common local transcript sources:
- Claude Code: `~/.claude/projects/<project>/<session>.jsonl`
- Codex: `~/.codex/sessions/YYYY/MM/DD/<session>.jsonl`

## Extractor

Use the extractor shipped inside the `workflow-evaluation` skill:

```bash
python3 .claude/skills/workflow-evaluation/extract_session_trace.py --runtime claude --latest
python3 .agents/skills/workflow-evaluation/extract_session_trace.py --runtime codex --latest
```

Or provide a direct transcript path:

```bash
python3 .claude/skills/workflow-evaluation/extract_session_trace.py \
  --input ~/.claude/projects/<project>/<session>.jsonl \
  --runtime claude
```

## Artifact Set

Each extracted session directory contains:
- `session-trace.json`: full normalized artifact
- `metadata.json`: session metadata, counts, and extraction notes
- `chat-history.ndjson`: normalized chat messages
- `command-transcript.ndjson`: command-oriented tool activity
- `tool-call-trace.ndjson`: normalized tool call and result events
- `artifact-trail.ndjson`: snapshots, hooks, runtime state, and other non-chat artifacts
- `handoff-notes.json`: handoff or phase-transition evidence when visible
- `decision-log.json`: explicit reasoning/decision evidence when visible
- `failure-retry-log.json`: error, retry, or blocked-step evidence when visible

## Schema Notes

`session-trace.json` uses:
- `schema_version`
- `runtime`
- `source`
- `session`
- `session_trace`
  - `chat_history`
  - `command_transcript`
  - `tool_call_trace`
  - `artifact_trail`
  - `handoff_notes`
  - `decision_log`
  - `failure_retry_log`
- `normalized_events`
- `stats`
- `extraction_notes`
