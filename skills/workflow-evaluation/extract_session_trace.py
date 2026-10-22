#!/usr/bin/env python3

import argparse
import json
import os
import re
import sqlite3
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional


SCHEMA_VERSION = "ai-workflow/session-trace-v1"

OPENCODE_DB_DEFAULT = Path.home() / ".local" / "share" / "opencode" / "opencode.db"
OPENCODE_FILE_TOOLS = {"edit", "write", "apply_patch"}


def project_path_to_claude_key(project_path: str) -> str:
    return project_path.replace("/", "-")


def ms_to_iso(value):
    if not isinstance(value, (int, float)):
        return None
    return datetime.fromtimestamp(value / 1000, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def read_jsonl(file_path: Path):
    records = []
    with file_path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            stripped = line.strip()
            if not stripped:
                continue
            try:
                records.append(json.loads(stripped))
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"Failed to parse JSONL line {line_number} in {file_path}: {exc}"
                ) from exc
    return records


def list_jsonl_files(root_dir: Path):
    if not root_dir.exists():
        return []
    return [path for path in root_dir.rglob("*.jsonl") if path.is_file()]


def detect_runtime(input_path: Optional[Path]):
    if input_path is None:
        return None
    normalized = input_path.as_posix()
    if "/.claude/" in normalized:
        return "claude"
    if "/.codex/" in normalized:
        return "codex"
    if "/opencode/" in normalized or normalized.endswith(".db"):
        return "opencode"
    return None


def pick_latest_file(files):
    if not files:
        return None
    return max(files, key=lambda item: item.stat().st_mtime_ns)


def find_latest_transcript(runtime: str, project_path: Optional[str]):
    sessions, issues = discover_transcripts(runtime, project_path)
    for issue in issues:
        print(json.dumps(issue), file=sys.stderr)
    return pick_latest_file([Path(item["transcript_path"]) for item in sessions])


def local_root(variable, default):
    return Path(os.environ.get(variable) or default).expanduser().resolve()


def canonical_path(value):
    return str(Path(value).expanduser().resolve()) if value else None


def transcript_roots(runtime):
    if runtime == "claude":
        return [local_root("CLAUDE_CONFIG_DIR", "~/.claude") / "projects"]
    if runtime == "codex":
        root = local_root("CODEX_HOME", "~/.codex")
        return [root / "sessions", root / "archived_sessions"]
    raise ValueError(f"Unsupported transcript runtime: {runtime}")


def discover_transcripts(runtime, project_path=None):
    """Inventory metadata only; do not normalize or write session contents."""
    project = canonical_path(project_path)
    sessions, issues = [], []
    for root in transcript_roots(runtime):
        if not root.exists():
            issues.append({"path": str(root), "reason": "source_directory_missing"})
        for path in sorted(list_jsonl_files(root)):
            try:
                session_id, cwd, started_at = None, None, None
                subagent = "subagents" in path.relative_to(root).parts
                # Claude may start with queue metadata before the first message.
                with path.open(encoding="utf-8") as handle:
                    for line in handle:
                        if not line.strip():
                            continue
                        record = json.loads(line)
                        payload = record.get("payload") or {}
                        meta = payload if runtime == "codex" else record
                        source = meta.get("source")
                        subagent = subagent or bool(record.get("isSidechain")) or (
                            isinstance(source, dict) and "subagent" in source
                        )
                        if runtime == "claude":
                            session_id = session_id or meta.get("sessionId")
                        elif record.get("type") == "session_meta":
                            session_id = meta.get("session_id") or meta.get("id")
                        cwd = cwd or meta.get("cwd")
                        started_at = started_at or record.get("timestamp")
                        if cwd and session_id:
                            break
                if not cwd:
                    issues.append({"path": str(path), "reason": "project_metadata_missing"})
                    continue
                if project and canonical_path(cwd) != project:
                    continue
                sessions.append({
                    "runtime": runtime,
                    "session_id": session_id or path.stem,
                    "project": canonical_path(cwd),
                    "transcript_path": str(path),
                    "started_at": started_at,
                    "modified_at": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(),
                    "archived": root.name == "archived_sessions",
                    "subagent": subagent,
                    "status": "unknown",
                })
            except (OSError, ValueError, AttributeError, TypeError) as exc:
                issues.append({"path": str(path), "reason": type(exc).__name__})
    return sessions, issues


def discover_paseo(project_path):
    """Resolve local Paseo agent metadata to provider-owned transcripts."""
    root = local_root("PASEO_HOME", "~/.paseo") / "agents"
    sessions, issues, provider_sessions = [], [], {}
    if not root.exists():
        issues.append({"path": str(root), "reason": "source_directory_missing"})
    for path in sorted(root.rglob("*.json")):
        try:
            agent = json.loads(path.read_text(encoding="utf-8"))
            if canonical_path(agent.get("cwd")) != canonical_path(project_path):
                continue
            runtime = agent.get("provider")
            persistence = agent.get("persistence") or {}
            session_id = persistence.get("sessionId") or (agent.get("runtimeInfo") or {}).get("sessionId")
            if runtime in {"claude", "codex"} and runtime not in provider_sessions:
                found, errors = discover_transcripts(runtime, project_path)
                provider_sessions[runtime] = found
                issues.extend(errors)
            matches = [item for item in provider_sessions.get(runtime, [])
                       if item["session_id"] == session_id and not item.get("subagent")]
            entry = dict(matches[0]) if len(matches) == 1 else {
                "runtime": runtime, "session_id": session_id,
                "project": canonical_path(project_path), "transcript_path": None,
            }
            entry["paseo"] = {
                "agent_id": agent.get("id"), "metadata_path": str(path),
                "workspace_id": agent.get("workspaceId"),
                "status": agent.get("lastStatus", "unknown"),
                "archived_at": agent.get("archivedAt"),
                "last_activity_at": agent.get("lastActivityAt") or agent.get("updatedAt"),
            }
            entry["status"] = agent.get("lastStatus", "unknown")
            entry["available"] = len(matches) == 1
            if not entry["available"]:
                entry["unavailable_reason"] = "ambiguous_transcript" if matches else "provider_transcript_not_found"
            sessions.append(entry)
        except (OSError, ValueError, AttributeError, TypeError) as exc:
            issues.append({"path": str(path), "reason": type(exc).__name__})
    return sessions, issues


def ensure_dir(dir_path: Path):
    dir_path.mkdir(parents=True, exist_ok=True)


def write_json(file_path: Path, value):
    ensure_dir(file_path.parent)
    with file_path.open("w", encoding="utf-8") as handle:
        json.dump(value, handle, indent=2, ensure_ascii=True)
        handle.write("\n")


def write_ndjson(file_path: Path, items):
    ensure_dir(file_path.parent)
    with file_path.open("w", encoding="utf-8") as handle:
        for item in items:
            handle.write(json.dumps(item, ensure_ascii=True))
            handle.write("\n")


def safe_json_parse(value):
    if not isinstance(value, str):
        return value
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


def sanitize_file_name(value):
    return "".join(char if char.isalnum() or char in "._-" else "-" for char in str(value or "unknown"))


def increment_counter(counter, key):
    safe_key = key or "unknown"
    counter[safe_key] = counter.get(safe_key, 0) + 1


def build_base_artifact(runtime: str, transcript_path: Path):
    return {
        "schema_version": SCHEMA_VERSION,
        "runtime": runtime,
        "source": {
            "transcript_path": str(transcript_path),
            "transcript_format": "jsonl",
            "extracted_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
            "extractor": "workflow-evaluation/extract_session_trace.py",
        },
        "session": {
            "id": None,
            "cwd": None,
            "started_at": None,
            "ended_at": None,
            "cli_version": None,
            "model": None,
            "git_branch": None,
            "metadata": {},
        },
        "session_trace": {
            "chat_history": [],
            "command_transcript": [],
            "tool_call_trace": [],
            "artifact_trail": [],
            "handoff_notes": [],
            "decision_log": [],
            "failure_retry_log": [],
        },
        "normalized_events": [],
        "stats": {
            "raw_event_types": {},
            "normalized_event_types": {},
        },
        "extraction_notes": [],
    }


def push_normalized_event(artifact, event):
    artifact["normalized_events"].append(event)
    increment_counter(artifact["stats"]["normalized_event_types"], event.get("kind"))


def push_if_text(chat_history, entry):
    text = entry.get("text")
    if isinstance(text, str) and text.strip():
        chat_history.append(entry)


def extract_claude_local_command(content: str):
    if "<command-name>" not in content:
        return None

    def extract(tag):
        start = f"<{tag}>"
        end = f"</{tag}>"
        if start not in content or end not in content:
            return None
        return content.split(start, 1)[1].split(end, 1)[0].strip()

    return {
        "command_name": extract("command-name"),
        "command_message": extract("command-message"),
        "command_args": extract("command-args"),
    }


def normalize_claude_blocks(content):
    if isinstance(content, str):
        return [{"type": "text", "text": content}]
    if isinstance(content, list):
        return content
    return []


def parse_claude_transcript(records, transcript_path: Path):
    artifact = build_base_artifact("claude", transcript_path)
    tool_calls = {}

    for index, record in enumerate(records):
        increment_counter(artifact["stats"]["raw_event_types"], record.get("type"))
        timestamp = record.get("timestamp") or ((record.get("snapshot") or {}).get("timestamp"))

        if artifact["session"]["id"] is None and record.get("sessionId"):
            artifact["session"]["id"] = record.get("sessionId")
        if artifact["session"]["cwd"] is None and record.get("cwd"):
            artifact["session"]["cwd"] = record.get("cwd")
        if artifact["session"]["started_at"] is None and timestamp:
            artifact["session"]["started_at"] = timestamp
        if timestamp:
            artifact["session"]["ended_at"] = timestamp
        if artifact["session"]["cli_version"] is None and record.get("version"):
            artifact["session"]["cli_version"] = record.get("version")
        if artifact["session"]["git_branch"] is None and record.get("gitBranch"):
            artifact["session"]["git_branch"] = record.get("gitBranch")

        record_type = record.get("type")
        if record_type in {"user", "assistant"}:
            message = record.get("message") or {}
            if message.get("model"):
                artifact["session"]["model"] = message["model"]
            if message.get("usage"):
                artifact["session_trace"]["artifact_trail"].append({
                    "index": index, "timestamp": timestamp,
                    "type": "message_usage", "message_id": message.get("id"),
                    "usage": message["usage"],
                })
            role = message.get("role") or record_type
            content = message.get("content")

            if isinstance(content, str):
                local_command = extract_claude_local_command(content)
                if local_command:
                    artifact["session_trace"]["command_transcript"].append({
                        "index": index,
                        "timestamp": timestamp,
                        "runtime": "claude",
                        "source": "local_command",
                        "role": role,
                        **local_command,
                    })
                    push_normalized_event(artifact, {
                        "index": index,
                        "timestamp": timestamp,
                        "kind": "command",
                        "role": role,
                        "text": local_command.get("command_message"),
                        "command_name": local_command.get("command_name"),
                    })
                else:
                    push_if_text(artifact["session_trace"]["chat_history"], {
                        "index": index,
                        "timestamp": timestamp,
                        "runtime": "claude",
                        "role": role,
                        "text": content,
                    })
                    push_normalized_event(artifact, {
                        "index": index,
                        "timestamp": timestamp,
                        "kind": "chat",
                        "role": role,
                        "text": content,
                    })

            for block in normalize_claude_blocks(content):
                block_type = block.get("type")
                if block_type == "text":
                    push_if_text(artifact["session_trace"]["chat_history"], {
                        "index": index,
                        "timestamp": timestamp,
                        "runtime": "claude",
                        "role": role,
                        "text": block.get("text", ""),
                    })
                    push_normalized_event(artifact, {
                        "index": index,
                        "timestamp": timestamp,
                        "kind": "chat",
                        "role": role,
                        "text": block.get("text", ""),
                    })
                elif block_type == "tool_use":
                    call_id = block.get("id")
                    tool_name = block.get("name")
                    tool_input = block.get("input")
                    tool_call = {
                        "index": index,
                        "timestamp": timestamp,
                        "runtime": "claude",
                        "direction": "call",
                        "call_id": call_id,
                        "tool_name": tool_name,
                        "input": tool_input,
                    }
                    artifact["session_trace"]["tool_call_trace"].append(tool_call)
                    if call_id:
                        tool_calls[call_id] = tool_call

                    command_value = None
                    if isinstance(tool_input, dict):
                        command_value = tool_input.get("command") or tool_input.get("cmd")
                    if command_value:
                        artifact["session_trace"]["command_transcript"].append({
                            "index": index,
                            "timestamp": timestamp,
                            "runtime": "claude",
                            "source": "tool_use",
                            "call_id": call_id,
                            "tool_name": tool_name,
                            "command": command_value,
                            "description": tool_input.get("description"),
                        })

                    push_normalized_event(artifact, {
                        "index": index,
                        "timestamp": timestamp,
                        "kind": "tool_call",
                        "role": role,
                        "tool_name": tool_name,
                        "call_id": call_id,
                        "command": command_value,
                    })
                elif block_type == "tool_result":
                    call_id = block.get("tool_use_id")
                    prior_call = tool_calls.get(call_id, {})
                    tool_name = prior_call.get("tool_name")
                    is_error = bool(block.get("is_error"))
                    tool_result = {
                        "index": index,
                        "timestamp": timestamp,
                        "runtime": "claude",
                        "direction": "result",
                        "call_id": call_id,
                        "tool_name": tool_name,
                        "output": block.get("content"),
                        "is_error": is_error,
                    }
                    artifact["session_trace"]["tool_call_trace"].append(tool_result)
                    artifact["session_trace"]["command_transcript"].append({
                        "index": index,
                        "timestamp": timestamp,
                        "runtime": "claude",
                        "source": "tool_result",
                        "call_id": call_id,
                        "tool_name": tool_name,
                        "output": block.get("content"),
                        "is_error": is_error,
                    })
                    if is_error:
                        artifact["session_trace"]["failure_retry_log"].append({
                            "index": index,
                            "timestamp": timestamp,
                            "runtime": "claude",
                            "source": "tool_result",
                            "call_id": call_id,
                            "tool_name": tool_name,
                            "error": block.get("content") or "Tool returned an error.",
                        })
                    push_normalized_event(artifact, {
                        "index": index,
                        "timestamp": timestamp,
                        "kind": "tool_result",
                        "role": role,
                        "tool_name": tool_name,
                        "call_id": call_id,
                        "is_error": is_error,
                    })

        elif record_type == "attachment":
            attachment = record.get("attachment") or {}
            artifact["session_trace"]["artifact_trail"].append({
                "index": index,
                "timestamp": timestamp,
                "runtime": "claude",
                "type": attachment.get("type"),
                "tool_use_id": attachment.get("toolUseID"),
                "command": attachment.get("command"),
                "exit_code": attachment.get("exitCode"),
            })
            if attachment.get("type") == "hook_success":
                artifact["session_trace"]["handoff_notes"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "claude",
                    "hook_name": attachment.get("hookName"),
                    "hook_event": attachment.get("hookEvent"),
                    "tool_use_id": attachment.get("toolUseID"),
                })
            push_normalized_event(artifact, {
                "index": index,
                "timestamp": timestamp,
                "kind": "artifact",
                "role": None,
                "artifact_type": attachment.get("type"),
            })

        elif record_type == "file-history-snapshot":
            snapshot = record.get("snapshot") or {}
            tracked_files = list((snapshot.get("trackedFileBackups") or {}).keys())
            artifact["session_trace"]["artifact_trail"].append({
                "index": index,
                "timestamp": timestamp,
                "runtime": "claude",
                "type": "file-history-snapshot",
                "tracked_files": tracked_files,
                "is_snapshot_update": bool(record.get("isSnapshotUpdate")),
            })
            push_normalized_event(artifact, {
                "index": index,
                "timestamp": timestamp,
                "kind": "artifact",
                "role": None,
                "artifact_type": "file-history-snapshot",
            })

        elif record_type == "system":
            if record.get("subtype") == "stop_hook_summary":
                artifact["session_trace"]["handoff_notes"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "claude",
                    "type": "stop_hook_summary",
                    "prevented_continuation": bool(record.get("preventedContinuation")),
                    "stop_reason": record.get("stopReason") or "",
                })
            push_normalized_event(artifact, {
                "index": index,
                "timestamp": timestamp,
                "kind": "system",
                "role": None,
                "subtype": record.get("subtype"),
            })

    artifact["session"]["metadata"]["project_key"] = (
        project_path_to_claude_key(artifact["session"]["cwd"])
        if artifact["session"]["cwd"]
        else None
    )
    artifact["extraction_notes"].append(
        "Claude transcript combines chat messages, tool calls, tool results, attachments, and file-history snapshots in one JSONL stream."
    )
    return artifact


def extract_codex_text(content):
    if not isinstance(content, list):
        return []
    texts = []
    for part in content:
        if isinstance(part, dict) and part.get("type") in {"input_text", "output_text"}:
            text = str(part.get("text") or "")
            if text.strip():
                texts.append(text)
    return texts


def parse_codex_transcript(records, transcript_path: Path):
    artifact = build_base_artifact("codex", transcript_path)
    tool_calls = {}

    for index, record in enumerate(records):
        increment_counter(artifact["stats"]["raw_event_types"], record.get("type"))
        timestamp = record.get("timestamp")
        payload = record.get("payload") or {}
        record_type = record.get("type")

        if record_type == "session_meta":
            artifact["session"]["id"] = payload.get("session_id") or payload.get("id")
            artifact["session"]["cwd"] = payload.get("cwd")
            artifact["session"]["started_at"] = payload.get("timestamp")
            artifact["session"]["cli_version"] = payload.get("cli_version")
            artifact["session"]["metadata"]["originator"] = payload.get("originator")
            artifact["session"]["metadata"]["model_provider"] = payload.get("model_provider")
            artifact["session"]["metadata"]["source"] = payload.get("source")
            artifact["session"]["metadata"]["thread_source"] = payload.get("thread_source")
            artifact["session"]["metadata"]["history_mode"] = payload.get("history_mode")
            artifact["session"]["metadata"]["context_window"] = payload.get("context_window")

        elif record_type == "turn_context":
            artifact["session"]["cwd"] = payload.get("cwd") or artifact["session"]["cwd"]
            artifact["session"]["model"] = payload.get("model") or artifact["session"]["model"]
            artifact["session"]["metadata"]["timezone"] = payload.get("timezone")
            artifact["session"]["metadata"]["approval_policy"] = payload.get("approval_policy")
            artifact["session"]["metadata"]["personality"] = payload.get("personality")
            artifact["session"]["metadata"]["collaboration_mode"] = payload.get("collaboration_mode")

        if artifact["session"]["started_at"] is None and timestamp:
            artifact["session"]["started_at"] = timestamp
        if timestamp:
            artifact["session"]["ended_at"] = timestamp

        if record_type == "response_item":
            payload_type = payload.get("type")
            if payload_type == "message":
                for text in extract_codex_text(payload.get("content")):
                    push_if_text(artifact["session_trace"]["chat_history"], {
                        "index": index,
                        "timestamp": timestamp,
                        "runtime": "codex",
                        "role": payload.get("role"),
                        "phase": payload.get("phase"),
                        "text": text,
                    })
                    push_normalized_event(artifact, {
                        "index": index,
                        "timestamp": timestamp,
                        "kind": "chat",
                        "role": payload.get("role"),
                        "text": text,
                    })
            elif payload_type in {"function_call", "custom_tool_call"}:
                call_id = payload.get("call_id")
                input_value = (payload.get("input") if payload_type == "custom_tool_call"
                               else safe_json_parse(payload.get("arguments")))
                tool_call = {
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "codex",
                    "direction": "call",
                    "call_id": call_id,
                    "tool_name": payload.get("name"),
                    "source_type": payload_type,
                    "input": input_value,
                }
                artifact["session_trace"]["tool_call_trace"].append(tool_call)
                if call_id:
                    tool_calls[call_id] = tool_call

                command_value = None
                if isinstance(input_value, dict):
                    command_value = input_value.get("cmd") or input_value.get("command")
                if command_value:
                    artifact["session_trace"]["command_transcript"].append({
                        "index": index,
                        "timestamp": timestamp,
                        "runtime": "codex",
                        "source": payload_type,
                        "call_id": call_id,
                        "tool_name": payload.get("name"),
                        "command": command_value,
                    })

                push_normalized_event(artifact, {
                    "index": index,
                    "timestamp": timestamp,
                    "kind": "tool_call",
                    "role": None,
                    "tool_name": payload.get("name"),
                    "call_id": call_id,
                    "command": command_value,
                })
            elif payload_type in {"function_call_output", "custom_tool_call_output"}:
                call_id = payload.get("call_id")
                prior_call = tool_calls.get(call_id, {})
                tool_name = prior_call.get("tool_name")
                artifact["session_trace"]["tool_call_trace"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "codex",
                    "direction": "result",
                    "call_id": call_id,
                    "tool_name": tool_name,
                    "source_type": payload_type,
                    "output": payload.get("output"),
                })
                artifact["session_trace"]["command_transcript"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "codex",
                    "source": payload_type,
                    "call_id": call_id,
                    "tool_name": tool_name,
                    "output": payload.get("output"),
                })
                push_normalized_event(artifact, {
                    "index": index,
                    "timestamp": timestamp,
                    "kind": "tool_result",
                    "role": None,
                    "tool_name": tool_name,
                    "call_id": call_id,
                })
            if payload_type == "message" and payload.get("phase") == "final":
                artifact["session_trace"]["handoff_notes"].append({
                    "index": index, "timestamp": timestamp, "runtime": "codex",
                    "source": "response_item", "phase": "final",
                    "message": "\n".join(extract_codex_text(payload.get("content"))),
                })
            if payload_type == "reasoning":
                artifact["session_trace"]["decision_log"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "codex",
                    "source": "reasoning",
                    "summary": payload.get("summary"),
                })
                push_normalized_event(artifact, {
                    "index": index,
                    "timestamp": timestamp,
                    "kind": "reasoning",
                    "role": None,
                })

        elif record_type == "event_msg":
            payload_type = payload.get("type")
            if payload_type == "agent_message":
                artifact["session_trace"]["handoff_notes"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "codex",
                    "source": "agent_message",
                    "phase": payload.get("phase"),
                    "message": payload.get("message"),
                })
            elif payload_type in {"task_started", "task_complete"}:
                artifact["session_trace"]["artifact_trail"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "codex",
                    "type": payload_type,
                    "turn_id": payload.get("turn_id"),
                    "duration_ms": payload.get("duration_ms"),
                })
            elif payload_type in {"web_search_call", "web_search_end"}:
                artifact["session_trace"]["tool_call_trace"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "codex",
                    "direction": "call" if payload_type == "web_search_call" else "result",
                    "call_id": payload.get("call_id"),
                    "tool_name": "web_search",
                    "input": payload.get("query") or payload.get("action"),
                })
            elif payload_type == "token_count":
                artifact["session_trace"]["artifact_trail"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "codex",
                    "type": "token_count",
                    "total_token_usage": (payload.get("info") or {}).get("total_token_usage"),
                })

            push_normalized_event(artifact, {
                "index": index,
                "timestamp": timestamp,
                "kind": "event",
                "role": None,
                "subtype": payload_type,
            })

        elif record_type == "token_usage_record":
            artifact["session_trace"]["artifact_trail"].append({
                "index": index, "timestamp": timestamp, "runtime": "codex",
                "type": "token_usage_record", "payload": payload,
            })

        elif record_type == "world_state":
            artifact["session_trace"]["artifact_trail"].append({
                "index": index,
                "timestamp": timestamp,
                "runtime": "codex",
                "type": "world_state",
                "full": bool(payload.get("full")),
            })
            push_normalized_event(artifact, {
                "index": index,
                "timestamp": timestamp,
                "kind": "artifact",
                "role": None,
                "artifact_type": "world_state",
            })

    artifact["extraction_notes"].append(
        "Codex transcript combines response items, runtime context, world state, and event messages in one JSONL stream."
    )
    return artifact


def resolve_opencode_db_path(explicit_path: Optional[Path]):
    if explicit_path is not None:
        return Path(os.path.expanduser(str(explicit_path))).resolve()
    if OPENCODE_DB_DEFAULT.exists():
        return OPENCODE_DB_DEFAULT
    try:
        result = subprocess.run(
            ["opencode", "db", "path"],
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError) as exc:
        raise FileNotFoundError(
            f"Opencode database not found at {OPENCODE_DB_DEFAULT} and `opencode db path` failed: {exc}"
        ) from exc
    return Path(os.path.expanduser(result.stdout.strip())).resolve()


def opencode_connect(db_path: Path):
    if not db_path.exists():
        raise FileNotFoundError(f"Opencode database not found: {db_path}")
    connection = sqlite3.connect(f"{db_path.as_uri()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


def find_latest_opencode_session(connection, project_path: Optional[str]):
    query = "select id from session where time_archived is null"
    params = []
    if project_path:
        query += " and directory = ?"
        params.append(os.path.abspath(os.path.expanduser(project_path)))
    query += " order by time_updated desc limit 1"
    row = connection.execute(query, params).fetchone()
    return row["id"] if row else None


def read_opencode_session_row(connection, session_id: str):
    row = connection.execute("select * from session where id = ?", (session_id,)).fetchone()
    return dict(row) if row is not None else None


def read_opencode_parts(connection, session_id: str):
    return connection.execute(
        "select p.id as part_id, p.time_created as part_time, p.data as part_data, "
        "m.data as message_data "
        "from part p join message m on m.id = p.message_id "
        "where p.session_id = ? "
        "order by m.time_created, p.time_created, p.id",
        (session_id,),
    ).fetchall()


def parse_opencode_session(connection, session_id: str, db_path: Path):
    session_row = read_opencode_session_row(connection, session_id)
    if session_row is None:
        raise ValueError(f"Opencode session not found: {session_id}")

    artifact = build_base_artifact("opencode", db_path)
    artifact["source"]["transcript_format"] = "sqlite"
    artifact["source"]["session_id"] = session_id

    artifact["session"]["id"] = session_row.get("id")
    artifact["session"]["cwd"] = session_row.get("directory")
    artifact["session"]["started_at"] = ms_to_iso(session_row.get("time_created"))
    artifact["session"]["cli_version"] = session_row.get("version")
    artifact["session"]["model"] = safe_json_parse(session_row.get("model")) or None
    for key in ("title", "slug", "project_id", "workspace_id", "parent_id", "path", "agent", "cost"):
        if key in session_row:
            artifact["session"]["metadata"][key] = session_row.get(key)
    artifact["session"]["metadata"]["archived"] = session_row.get("time_archived") is not None
    artifact["session"]["metadata"]["session_totals"] = {
        "tokens_input": session_row.get("tokens_input"),
        "tokens_output": session_row.get("tokens_output"),
        "tokens_reasoning": session_row.get("tokens_reasoning"),
        "tokens_cache_read": session_row.get("tokens_cache_read"),
        "tokens_cache_write": session_row.get("tokens_cache_write"),
        "summary_additions": session_row.get("summary_additions"),
        "summary_deletions": session_row.get("summary_deletions"),
        "summary_files": session_row.get("summary_files"),
    }

    totals = {"input": 0, "output": 0, "reasoning": 0, "cost": 0}
    reasoning_parts = 0

    for index, row in enumerate(read_opencode_parts(connection, session_id)):
        part = safe_json_parse(row["part_data"]) or {}
        message = safe_json_parse(row["message_data"]) or {}
        if not isinstance(part, dict):
            continue
        part_type = part.get("type")
        role = message.get("role") if isinstance(message, dict) else None
        timestamp = ms_to_iso(row["part_time"])

        increment_counter(artifact["stats"]["raw_event_types"], part_type)
        if timestamp:
            artifact["session"]["ended_at"] = timestamp
        if artifact["session"]["model"] is None and isinstance(message, dict) and message.get("modelID"):
            artifact["session"]["model"] = message.get("modelID")
            artifact["session"]["metadata"]["provider"] = message.get("providerID")

        if part_type == "text":
            text = part.get("text")
            push_if_text(artifact["session_trace"]["chat_history"], {
                "index": index,
                "timestamp": timestamp,
                "runtime": "opencode",
                "role": role,
                "text": text,
            })
            if isinstance(text, str) and text.strip():
                push_normalized_event(artifact, {
                    "index": index,
                    "timestamp": timestamp,
                    "kind": "chat",
                    "role": role,
                    "text": text,
                })

        elif part_type == "reasoning":
            reasoning_parts += 1

        elif part_type == "tool":
            state = part.get("state") or {}
            call_id = part.get("callID")
            tool_name = part.get("tool")
            input_value = state.get("input")
            status = state.get("status")

            artifact["session_trace"]["tool_call_trace"].append({
                "index": index,
                "timestamp": timestamp,
                "runtime": "opencode",
                "direction": "call",
                "call_id": call_id,
                "tool_name": tool_name,
                "input": input_value,
            })

            command_value = None
            if isinstance(input_value, dict):
                command_value = input_value.get("command") or input_value.get("cmd")
            if command_value:
                artifact["session_trace"]["command_transcript"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "opencode",
                    "source": "tool_call",
                    "call_id": call_id,
                    "tool_name": tool_name,
                    "command": command_value,
                })

            push_normalized_event(artifact, {
                "index": index,
                "timestamp": timestamp,
                "kind": "tool_call",
                "role": None,
                "tool_name": tool_name,
                "call_id": call_id,
                "command": command_value,
            })

            if status in {"completed", "error"}:
                artifact["session_trace"]["tool_call_trace"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "opencode",
                    "direction": "result",
                    "call_id": call_id,
                    "tool_name": tool_name,
                    "status": status,
                    "output": state.get("output"),
                    "error": state.get("error"),
                })
                artifact["session_trace"]["command_transcript"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "opencode",
                    "source": "tool_result",
                    "call_id": call_id,
                    "tool_name": tool_name,
                    "status": status,
                    "output": state.get("output"),
                    "error": state.get("error"),
                })
                push_normalized_event(artifact, {
                    "index": index,
                    "timestamp": timestamp,
                    "kind": "tool_result",
                    "role": None,
                    "tool_name": tool_name,
                    "call_id": call_id,
                    "status": status,
                })
                if status == "error":
                    artifact["session_trace"]["failure_retry_log"].append({
                        "index": index,
                        "timestamp": timestamp,
                        "runtime": "opencode",
                        "call_id": call_id,
                        "tool_name": tool_name,
                        "error": state.get("error"),
                    })

            file_path = input_value.get("filePath") if isinstance(input_value, dict) else None
            if file_path and tool_name in OPENCODE_FILE_TOOLS:
                artifact["session_trace"]["artifact_trail"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "opencode",
                    "type": "file_change",
                    "tool_name": tool_name,
                    "path": file_path,
                })
                push_normalized_event(artifact, {
                    "index": index,
                    "timestamp": timestamp,
                    "kind": "artifact",
                    "role": None,
                    "artifact_type": "file_change",
                })

        elif part_type == "patch":
            artifact["session_trace"]["artifact_trail"].append({
                "index": index,
                "timestamp": timestamp,
                "runtime": "opencode",
                "type": "patch",
                "hash": part.get("hash"),
                "files": part.get("files"),
            })
            push_normalized_event(artifact, {
                "index": index,
                "timestamp": timestamp,
                "kind": "artifact",
                "role": None,
                "artifact_type": "patch",
            })

        elif part_type == "file":
            artifact["session_trace"]["artifact_trail"].append({
                "index": index,
                "timestamp": timestamp,
                "runtime": "opencode",
                "type": "file",
                "mime": part.get("mime"),
                "filename": part.get("filename"),
            })
            push_normalized_event(artifact, {
                "index": index,
                "timestamp": timestamp,
                "kind": "artifact",
                "role": None,
                "artifact_type": "file",
            })

        elif part_type == "step-finish":
            tokens = part.get("tokens") or {}
            for key in ("input", "output", "reasoning"):
                value = tokens.get(key)
                if isinstance(value, (int, float)):
                    totals[key] += value
            cost = part.get("cost")
            if isinstance(cost, (int, float)):
                totals["cost"] += cost

    artifact["session"]["metadata"]["token_totals"] = totals
    artifact["session"]["metadata"]["reasoning_parts"] = reasoning_parts

    artifact["extraction_notes"].append(
        "Opencode history is a SQLite database, not a JSONL transcript; parts are joined to their parent message for role and model."
    )
    artifact["extraction_notes"].append(
        "Reasoning parts are counted in raw_event_types and session.metadata.reasoning_parts, but their text is never emitted."
    )
    artifact["extraction_notes"].append(
        "Binary file parts keep mime and filename only; embedded data URLs are dropped."
    )
    artifact["extraction_notes"].append(
        "A tool part carries both call and result, so each completed or failed tool produces one call entry and one result entry at the same index."
    )
    return artifact


def extract_opencode(args, input_path: Optional[Path]):
    db_path = resolve_opencode_db_path(input_path)
    connection = opencode_connect(db_path)
    try:
        session_id = args.session_id
        if not session_id:
            if not args.latest:
                raise ValueError("Provide --session-id or --latest for the opencode runtime.")
            session_id = find_latest_opencode_session(connection, args.project)
            if not session_id:
                raise ValueError("No opencode session found for the requested project.")
        return parse_opencode_session(connection, session_id, db_path), db_path
    finally:
        connection.close()


def assess_coverage(artifact, records):
    """Compare observable source tool events with the normalized trace, not agent claims."""
    raw_calls, raw_results, media = [], [], []
    compactions = []
    for index, record in enumerate(records):
        payload = record.get("payload") or {}
        if artifact["runtime"] == "codex":
            if record.get("type") == "response_item":
                kind = payload.get("type")
                if kind in {"function_call", "custom_tool_call"}:
                    raw_calls.append((index, payload.get("call_id")))
                elif kind in {"function_call_output", "custom_tool_call_output"}:
                    raw_results.append((index, payload.get("call_id")))
            elif record.get("type") == "event_msg":
                if payload.get("type") == "web_search_call":
                    raw_calls.append((index, payload.get("call_id")))
                elif payload.get("type") == "web_search_end":
                    raw_results.append((index, payload.get("call_id")))
            blocks = payload.get("content") or []
        else:
            blocks = (record.get("message") or {}).get("content") or []
            if isinstance(blocks, list):
                for block in blocks:
                    if block.get("type") == "tool_use":
                        raw_calls.append((index, block.get("id")))
                    elif block.get("type") == "tool_result":
                        raw_results.append((index, block.get("tool_use_id")))
        if isinstance(blocks, list) and any(
            block.get("type") in {"image", "input_image", "audio", "input_audio", "document"}
            for block in blocks
        ):
            media.append(index)
        if "compact" in str(record.get("type", "")) or "compact" in str(record.get("subtype", "")):
            compactions.append(index)

    trace = artifact["session_trace"]["tool_call_trace"]
    calls = {(entry["index"], entry.get("call_id")) for entry in trace if entry["direction"] == "call"}
    results = {(entry["index"], entry.get("call_id")) for entry in trace if entry["direction"] == "result"}
    call_ids = {call_id for _, call_id in raw_calls if call_id}
    result_ids = {call_id for _, call_id in raw_results if call_id}
    represented = {event["index"] for event in artifact["normalized_events"]}
    for entries in artifact["session_trace"].values():
        represented.update(entry["index"] for entry in entries if "index" in entry)
    unrepresented = {}
    for index, record in enumerate(records):
        if index not in represented:
            kind = record.get("type", "unknown")
            if kind == "response_item":
                kind += "/" + str((record.get("payload") or {}).get("type"))
            increment_counter(unrepresented, kind)
    truncated = sorted({
        entry["index"] for entry in trace if entry["direction"] == "result"
        and re.search(r"Warning: truncated output|Output truncated to \d+|\d+ (?:tokens|characters) truncated",
                      json.dumps(entry.get("output"), ensure_ascii=False))
    })
    artifact["coverage"] = {
        "scope": "stored_observable_events_not_full_model_context",
        "source_records": len(records),
        "raw_tool_calls": len(raw_calls), "raw_tool_results": len(raw_results),
        "preserved_tool_calls": sum(item in calls for item in raw_calls),
        "preserved_tool_results": sum(item in results for item in raw_results),
        "missing_tool_event_indices": sorted({index for index, call_id in raw_calls if (index, call_id) not in calls}
                                             | {index for index, call_id in raw_results if (index, call_id) not in results}),
        "tool_events_without_call_id": sorted({index for index, call_id in raw_calls + raw_results if not call_id}),
        "calls_without_results": sorted(call_ids - result_ids),
        "results_without_calls": sorted(result_ids - call_ids),
        "truncation_marker_indices": truncated,
        "omitted_media_indices": media,
        "compaction_indices": compactions,
        "records_without_trace_entries": unrepresented,
        "session_completion": "unknown",
    }
    artifact["extraction_notes"].append(
        "Coverage compares stored tool events only. Paired calls do not prove task completion; ended_at is the last recorded timestamp. "
        "Truncation markers are candidates for inspection, not a semantic verdict. Original instructions, media, compaction context, "
        "and omitted record types may require the raw source. Do not sum message/token usage snapshots blindly."
    )


def write_artifact_set(artifact, output_dir: Path):
    ensure_dir(output_dir)
    write_json(output_dir / "session-trace.json", artifact)
    write_json(output_dir / "metadata.json", {
        "schema_version": artifact["schema_version"],
        "runtime": artifact["runtime"],
        "source": artifact["source"],
        "session": artifact["session"],
        "stats": artifact["stats"],
        "coverage": artifact.get("coverage"),
        "extraction_notes": artifact["extraction_notes"],
    })
    write_ndjson(output_dir / "chat-history.ndjson", artifact["session_trace"]["chat_history"])
    write_ndjson(output_dir / "command-transcript.ndjson", artifact["session_trace"]["command_transcript"])
    write_ndjson(output_dir / "tool-call-trace.ndjson", artifact["session_trace"]["tool_call_trace"])
    write_ndjson(output_dir / "artifact-trail.ndjson", artifact["session_trace"]["artifact_trail"])
    write_json(output_dir / "handoff-notes.json", artifact["session_trace"]["handoff_notes"])
    write_json(output_dir / "decision-log.json", artifact["session_trace"]["decision_log"])
    write_json(output_dir / "failure-retry-log.json", artifact["session_trace"]["failure_retry_log"])


FRICTION_MARKER = re.compile(r"#friction\b[:\s]*(.*)", re.IGNORECASE | re.DOTALL)
INTERRUPT_MARKER = "[Request interrupted by user"
DONE_CLAIM = re.compile(r"\b(?:done|completed|finished|implemented)\b|hoàn thành|đã xong", re.IGNORECASE)
SKILL_FILE = re.compile(r"skills/([\w.-]+)/SKILL\.md")
REVERT_COMMAND = re.compile(r"\bgit\s+(?:restore|revert|reset\s+--hard|checkout\s+--\s)")


def parse_time(value):
    """Parse an ISO timestamp; naive values are UTC (transcript convention)."""
    if not isinstance(value, str) or not value.strip():
        return None
    text = re.sub(r"\.(\d+)", lambda match: "." + match.group(1)[:6].ljust(6, "0"),
                  value.strip().replace("Z", "+00:00"), count=1)
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def record_window(records):
    times = [parse_time(record.get("timestamp")) for record in records if isinstance(record, dict)]
    times = [value for value in times if value]
    return (min(times), max(times)) if times else (None, None)


def triage_signals(runtime, records, transcript_path):
    """Cheap observable signals for ranking; leads for a deep dive, not findings."""
    parse = parse_claude_transcript if runtime == "claude" else parse_codex_transcript
    artifact = parse(records, transcript_path)
    assess_coverage(artifact, records)
    trace = artifact["session_trace"]
    friction, human, interrupts, after_done = [], 0, 0, 0
    last_assistant = ""
    for entry in trace["chat_history"]:
        text = str(entry.get("text") or "").strip()
        if entry.get("role") != "user":
            last_assistant = text
            continue
        if text.startswith(INTERRUPT_MARKER):
            interrupts += 1
            continue
        if text.startswith(("<", "# AGENTS.md instructions")):  # runtime-injected context, not human input
            continue
        human += 1
        match = FRICTION_MARKER.search(text)
        if match:
            friction.append({"index": entry.get("index"), "note": match.group(1).strip()[:300]})
        if last_assistant and DONE_CLAIM.search(last_assistant):
            after_done += 1
        last_assistant = ""
    interrupts += sum(1 for record in records if isinstance(record, dict)
                      and (record.get("payload") or {}).get("type") == "turn_aborted")
    commands = [str(entry["command"]) for entry in trace["command_transcript"] if entry.get("command")]
    skills = set()
    for entry in trace["tool_call_trace"]:
        tool_input = entry.get("input") if entry["direction"] == "call" else None
        if isinstance(tool_input, dict) and entry.get("tool_name") == "Skill" and tool_input.get("skill"):
            skills.add(str(tool_input["skill"]))
        elif tool_input is not None:
            skills.update(SKILL_FILE.findall(json.dumps(tool_input)))
    started, ended = record_window(records)
    signals = {
        "friction_notes": friction,
        "human_messages": human,
        "interrupts": interrupts,
        "human_after_done_claim": after_done,
        "tool_errors": len(trace["failure_retry_log"]),
        "repeated_commands": len(commands) - len(set(commands)),
        "revert_commands": sum(1 for command in commands if REVERT_COMMAND.search(command)),
        "compactions": len(artifact["coverage"]["compaction_indices"]),
        "duration_minutes": round((ended - started).total_seconds() / 60) if started else None,
        "events": len(artifact["normalized_events"]),
        "skills_used": sorted(skills),
    }
    signals["score"] = (3 * (interrupts + after_done) + 2 * (signals["revert_commands"] + signals["compactions"])
                        + signals["tool_errors"] + signals["repeated_commands"] + max(0, human - 1)
                        + (signals["duration_minutes"] or 0) // 60)
    return signals


def in_window(start, end, since, until):
    return start is not None and end >= since and start <= until


def audit_inventory(projects, since, until, top=5, exclude=()):
    """Multi-project Claude/Paseo inventory filtered by transcript timestamps, with triage ranking."""
    exclude = set(exclude) | {os.environ.get(name) for name in ("CLAUDE_CODE_SESSION_ID", "PASEO_AGENT_ID")}
    exclude.discard(None)
    exclude.discard("")
    result = {"window": {"since": since.isoformat(), "until": until.isoformat()}, "top_n": top,
              "excluded_session_ids": sorted(exclude), "projects": [], "triage": []}
    ranked = []
    for project in projects:
        claude, issues = discover_transcripts("claude", project)
        paseo, paseo_issues = discover_paseo(project)
        seen_issues = set()
        report = {"project": canonical_path(project), "sessions": [], "subagents": [], "excluded": [],
                  "evidence_gaps": [], "outside_window": 0, "issues": []}
        for issue in issues + paseo_issues:
            if json.dumps(issue, sort_keys=True) not in seen_issues:
                seen_issues.add(json.dumps(issue, sort_keys=True))
                report["issues"].append(issue)
        candidates = {}
        for item in claude:
            key = ("claude", item["session_id"])
            if item["subagent"]:
                report["subagents"].append(item)
            elif key in candidates:
                report["issues"].append({"path": item["transcript_path"], "reason": "duplicate_session_id"})
            else:
                candidates[key] = dict(item, paseo_agents=[])
        for item in paseo:
            reference = item.pop("paseo")
            if not item["available"]:
                activity = parse_time(reference.get("last_activity_at"))
                if activity is None or activity >= since:
                    report["evidence_gaps"].append(dict(item, paseo=reference))
                continue
            key = (item["runtime"], item["session_id"])
            entry = candidates.setdefault(key, dict(item, paseo_agents=[]))
            entry["paseo_agents"].append(reference)
            entry["status"] = item["status"]
        subagents, report["subagents"] = report["subagents"], []
        for entry in list(candidates.values()) + subagents:
            ids = {entry["session_id"]} | {ref.get("agent_id") for ref in entry.get("paseo_agents", [])}
            if ids & exclude:
                report["excluded"].append({"session_id": entry["session_id"], "reason": "audit_session",
                                           "transcript_path": entry["transcript_path"]})
                continue
            path = Path(entry["transcript_path"])
            try:
                # mtime is never older than the last write, so it can only rule sessions out.
                if datetime.fromtimestamp(path.stat().st_mtime, timezone.utc) < since:
                    report["outside_window"] += 1
                    continue
                records = read_jsonl(path)
                start, end = record_window(records)
                if start is None:
                    report["issues"].append({"path": str(path), "reason": "transcript_timestamps_missing"})
                    continue
                if not in_window(start, end, since, until):
                    report["outside_window"] += 1
                    continue
                entry.update(first_at=start.isoformat(), last_at=end.isoformat())
                if entry.get("subagent"):
                    report["subagents"].append(entry)
                    continue
                entry["triage"] = triage_signals(entry["runtime"], records, path)
            except (OSError, ValueError, AttributeError, TypeError, KeyError) as exc:
                report["issues"].append({"path": str(path), "reason": type(exc).__name__})
                continue
            report["sessions"].append(entry)
            ranked.append((report["project"], entry))
        report["counts"] = {"sessions": len(report["sessions"]), "subagents": len(report["subagents"]),
                            "excluded": len(report["excluded"]), "evidence_gaps": len(report["evidence_gaps"]),
                            "outside_window": report["outside_window"], "issues": len(report["issues"])}
        result["projects"].append(report)
    ranked.sort(key=lambda item: (not item[1]["triage"]["friction_notes"], -item[1]["triage"]["score"],
                                  item[1]["first_at"]))
    for rank, (project, entry) in enumerate(ranked, start=1):
        result["triage"].append({
            "rank": rank, "deep_dive": rank <= top, "project": project, "runtime": entry["runtime"],
            "session_id": entry["session_id"], "transcript_path": entry["transcript_path"],
            "paseo_agent_ids": [ref.get("agent_id") for ref in entry["paseo_agents"]],
            "friction": bool(entry["triage"]["friction_notes"]), "score": entry["triage"]["score"],
        })
    return result


def parse_args():
    parser = argparse.ArgumentParser(description="Discover project sessions and normalize local history for independent workflow evaluation.")
    parser.add_argument("--input", help="Raw local transcript path, or the opencode database path.")
    parser.add_argument("--runtime", choices=["claude", "codex", "opencode", "paseo"], help="Runtime or local Paseo source.")
    parser.add_argument("--session-id", help="Opencode session ID, or exact Paseo agent ID when --runtime paseo.")
    parser.add_argument("--list", action="store_true", help="Print project session inventory as JSON without writing files (Claude, Codex, Paseo).")
    parser.add_argument("--latest", action="store_true", help="Pick the latest transcript or session for the runtime.")
    parser.add_argument("--triage", action="store_true",
                        help="Print a multi-project Claude/Paseo inventory filtered by transcript timestamps, "
                             "with triage ranking, as JSON without writing files.")
    parser.add_argument("--project", action="append",
                        help="Exact project/cwd path; required for --list, --triage (repeatable), and Paseo resolution.")
    parser.add_argument("--since", help="--triage window start (ISO date/time, naive = local time); default 7 days before --until.")
    parser.add_argument("--until", help="--triage window end (ISO date/time, naive = local time); default now.")
    parser.add_argument("--top", type=int, default=5, help="--triage sessions marked for deep dive (default 5).")
    parser.add_argument("--exclude-session", action="append", default=[],
                        help="--triage session or Paseo agent ID to exclude, such as the audit session (repeatable).")
    parser.add_argument("--output-dir", help="Target output directory.")
    parser.add_argument("--stdout", action="store_true", help="Print session-trace.json to stdout.")
    args = parser.parse_args()
    triage_only = args.since or args.until or args.exclude_session or args.top != 5
    if args.triage:
        if not args.project:
            parser.error("--triage requires at least one --project.")
        if args.list or args.runtime or args.input or args.latest or args.session_id or args.output_dir or args.stdout:
            parser.error("--triage cannot be combined with --list, --runtime, or extraction options.")
        if args.top < 0:
            parser.error("--top must not be negative.")
        try:
            args.until = datetime.fromisoformat(args.until).astimezone() if args.until else datetime.now().astimezone()
            args.since = (datetime.fromisoformat(args.since).astimezone() if args.since
                          else args.until - timedelta(days=7))
        except ValueError as exc:
            parser.error(f"Invalid --since/--until: {exc}")
        if args.since > args.until:
            parser.error("--since must not be after --until.")
        return args
    if triage_only:
        parser.error("--since, --until, --top, and --exclude-session require --triage.")
    if args.project and len(args.project) > 1:
        parser.error("Only --triage accepts more than one --project.")
    args.project = args.project[0] if args.project else None
    if args.list:
        if not args.project or args.runtime not in {"claude", "codex", "paseo"}:
            parser.error("--list requires --project and --runtime claude, codex, or paseo.")
        if args.input or args.latest or args.session_id or args.output_dir or args.stdout:
            parser.error("--list cannot be combined with extraction options.")
    if args.runtime == "paseo" and not args.list:
        if not args.project or not args.session_id or args.input or args.latest:
            parser.error("Paseo extraction requires --project and --session-id, without --input or --latest.")
    return args


def main():
    args = parse_args()
    if args.triage:
        print(json.dumps(audit_inventory(args.project, args.since, args.until, args.top, args.exclude_session),
                         indent=2, ensure_ascii=False))
        return
    if args.list:
        sessions, issues = (discover_paseo(args.project) if args.runtime == "paseo"
                            else discover_transcripts(args.runtime, args.project))
        print(json.dumps({"project": canonical_path(args.project), "source": args.runtime,
                          "sessions": sessions, "issues": issues}, indent=2))
        return
    input_path = Path(os.path.expanduser(args.input)).resolve() if args.input else None
    runtime = args.runtime or detect_runtime(input_path)
    paseo_source = None
    if runtime == "paseo":
        sessions, issues = discover_paseo(args.project)
        matches = [item for item in sessions if item["paseo"]["agent_id"] == args.session_id]
        if len(matches) != 1 or not matches[0]["available"]:
            raise ValueError("No unique local provider transcript for this Paseo agent/project; inspect --list issues and unavailable_reason.")
        selected = matches[0]
        paseo_source = selected["paseo"]
        input_path = Path(selected["transcript_path"])
        runtime = selected["runtime"]
    if runtime is None and args.session_id:
        runtime = "opencode"

    if runtime == "opencode":
        artifact, input_path = extract_opencode(args, input_path)
    else:
        if input_path is None and args.latest:
            if runtime is None:
                raise ValueError("--runtime is required when using --latest.")
            input_path = find_latest_transcript(runtime, args.project)
            if input_path is None:
                scope = f" for project {args.project}" if args.project else ""
                raise FileNotFoundError(f"No {runtime} transcript found{scope}.")

        if input_path is None:
            raise ValueError("Provide --input or use --latest.")
        if runtime is None:
            runtime = detect_runtime(input_path)
        if runtime not in {"claude", "codex"}:
            raise ValueError(f"Unsupported runtime: {runtime}")
        if not input_path.exists():
            raise FileNotFoundError(f"Transcript not found: {input_path}")

        records = read_jsonl(input_path)
        artifact = parse_claude_transcript(records, input_path) if runtime == "claude" else parse_codex_transcript(records, input_path)
        assess_coverage(artifact, records)

    if paseo_source:
        artifact["source"]["paseo"] = paseo_source

    if artifact["session"]["id"] is None:
        artifact["session"]["id"] = input_path.stem
        artifact["extraction_notes"].append("Session id was inferred from the transcript file name.")

    default_output = Path.cwd() / "docs" / "evaluation" / "session-traces" / runtime / sanitize_file_name(artifact["session"]["id"])
    output_dir = Path(os.path.expanduser(args.output_dir)).resolve() if args.output_dir else default_output

    write_artifact_set(artifact, output_dir)

    summary = {
        "runtime": artifact["runtime"],
        "transcript_path": str(input_path),
        "output_dir": str(output_dir),
        "session_id": artifact["session"]["id"],
        "cwd": artifact["session"]["cwd"],
        "started_at": artifact["session"]["started_at"],
        "coverage": artifact.get("coverage"),
        "counts": {
            "chat_history": len(artifact["session_trace"]["chat_history"]),
            "command_transcript": len(artifact["session_trace"]["command_transcript"]),
            "tool_call_trace": len(artifact["session_trace"]["tool_call_trace"]),
            "artifact_trail": len(artifact["session_trace"]["artifact_trail"]),
            "handoff_notes": len(artifact["session_trace"]["handoff_notes"]),
            "decision_log": len(artifact["session_trace"]["decision_log"]),
            "failure_retry_log": len(artifact["session_trace"]["failure_retry_log"]),
            "normalized_events": len(artifact["normalized_events"]),
        },
    }
    print(json.dumps(summary, indent=2, ensure_ascii=True))

    if args.stdout:
        print(json.dumps(artifact, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # pragma: no cover
        print(str(exc), file=sys.stderr)
        sys.exit(1)
