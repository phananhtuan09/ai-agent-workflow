#!/usr/bin/env python3

import argparse
import datetime
import json
import os
import sqlite3
import subprocess
import sys
from pathlib import Path
from typing import Optional


SCHEMA_VERSION = "ai-workflow/session-trace-v1"


def project_path_to_claude_key(project_path: str) -> str:
    return project_path.replace("/", "-")


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


def read_first_jsonl(file_path: Path):
    with file_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            stripped = line.strip()
            if stripped:
                return json.loads(stripped)
    return None


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
    if "/.opencode/" in normalized or "/opencode/" in normalized:
        return "opencode"
    return None


def pick_latest_file(files):
    if not files:
        return None
    return max(files, key=lambda item: item.stat().st_mtime_ns)


def find_latest_transcript(runtime: str, project_path: Optional[str]):
    home = Path.home()
    normalized_project = os.path.abspath(os.path.expanduser(project_path)) if project_path else None

    if runtime == "claude":
        files = list_jsonl_files(home / ".claude" / "projects")
        if normalized_project:
            project_key = project_path_to_claude_key(normalized_project)
            files = [path for path in files if project_key in path.as_posix()]
        return pick_latest_file(files)

    if runtime == "codex":
        files = list_jsonl_files(home / ".codex" / "sessions")
        if normalized_project:
            filtered = []
            for file_path in files:
                try:
                    first_record = read_first_jsonl(file_path) or {}
                except Exception:
                    continue
                payload = first_record.get("payload") or {}
                if payload.get("cwd") == normalized_project:
                    filtered.append(file_path)
            files = filtered
        return pick_latest_file(files)

    raise ValueError(f"Unsupported runtime for --latest: {runtime}")


def get_opencode_db_path():
    default_path = Path.home() / ".local" / "share" / "opencode" / "opencode.db"
    if default_path.exists():
        return default_path

    result = subprocess.run(
        ["opencode", "db", "path"],
        capture_output=True,
        text=True,
        check=True,
    )
    return Path(result.stdout.strip()).expanduser()


def find_latest_opencode_session(project_path: Optional[str]):
    normalized_project = os.path.abspath(os.path.expanduser(project_path)) if project_path else None
    db_path = get_opencode_db_path()
    if not db_path.exists():
        raise FileNotFoundError(f"Opencode database not found: {db_path}")

    query = """
        select id, directory, time_updated
        from session
        where time_archived is null
    """
    params = []
    if normalized_project:
        query += " and directory = ?"
        params.append(normalized_project)
    query += " order by time_updated desc limit 1"

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(query, params).fetchone()
    if row is None:
        return None
    return dict(row)


def safe_load_json(value):
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return value


def load_opencode_session(session_id: str):
    db_path = get_opencode_db_path()
    if not db_path.exists():
        raise FileNotFoundError(f"Opencode database not found: {db_path}")

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row

        session_row = conn.execute(
            "select * from session where id = ?",
            [session_id],
        ).fetchone()
        if session_row is None:
            raise ValueError(f"Opencode session not found: {session_id}")

        message_rows = conn.execute(
            """
            select *
            from message
            where session_id = ?
            order by time_created asc, id asc
            """,
            [session_id],
        ).fetchall()

        part_rows = conn.execute(
            """
            select *
            from part
            where session_id = ?
            order by time_created asc, id asc
            """,
            [session_id],
        ).fetchall()

    parts_by_message = {}
    for row in part_rows:
        parts_by_message.setdefault(row["message_id"], []).append({
            "id": row["id"],
            "messageID": row["message_id"],
            "sessionID": row["session_id"],
            **(safe_load_json(row["data"]) or {}),
        })

    messages = []
    for row in message_rows:
        messages.append({
            "info": {
                **(safe_load_json(row["data"]) or {}),
                "id": row["id"],
                "sessionID": row["session_id"],
            },
            "parts": parts_by_message.get(row["id"], []),
        })

    return {
        "source": {
            "db_path": str(db_path),
            "session_id": session_row["id"],
        },
        "info": {
            "id": session_row["id"],
            "slug": session_row["slug"],
            "projectID": session_row["project_id"],
            "workspaceID": session_row["workspace_id"],
            "parentID": session_row["parent_id"],
            "directory": session_row["directory"],
            "path": session_row["path"],
            "title": session_row["title"],
            "agent": session_row["agent"],
            "model": safe_load_json(session_row["model"]) or {},
            "version": session_row["version"],
            "shareURL": session_row["share_url"],
            "metadata": safe_load_json(session_row["metadata"]) or {},
            "summary": {
                "additions": session_row["summary_additions"],
                "deletions": session_row["summary_deletions"],
                "files": session_row["summary_files"],
                "diffs": safe_load_json(session_row["summary_diffs"]) or [],
            },
            "cost": session_row["cost"],
            "tokens": {
                "input": session_row["tokens_input"],
                "output": session_row["tokens_output"],
                "reasoning": session_row["tokens_reasoning"],
                "cache": {
                    "read": session_row["tokens_cache_read"],
                    "write": session_row["tokens_cache_write"],
                },
            },
            "time": {
                "created": session_row["time_created"],
                "updated": session_row["time_updated"],
                "compacting": session_row["time_compacting"],
                "archived": session_row["time_archived"],
            },
        },
        "messages": messages,
    }


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


def build_base_artifact(runtime: str, transcript_path, transcript_format: str = "jsonl"):
    return {
        "schema_version": SCHEMA_VERSION,
        "runtime": runtime,
        "source": {
            "transcript_path": str(transcript_path),
            "transcript_format": transcript_format,
            "extracted_at": datetime.datetime.utcnow().isoformat() + "Z",
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
                        "text": text,
                    })
                    push_normalized_event(artifact, {
                        "index": index,
                        "timestamp": timestamp,
                        "kind": "chat",
                        "role": payload.get("role"),
                        "text": text,
                    })
            elif payload_type == "function_call":
                call_id = payload.get("call_id")
                input_value = safe_json_parse(payload.get("arguments"))
                tool_call = {
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "codex",
                    "direction": "call",
                    "call_id": call_id,
                    "tool_name": payload.get("name"),
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
                        "source": "function_call",
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
            elif payload_type == "function_call_output":
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
                    "output": payload.get("output"),
                })
                artifact["session_trace"]["command_transcript"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "codex",
                    "source": "function_call_output",
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
            elif payload_type == "reasoning":
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


def parse_opencode_export(export_data, source_ref: str):
    session_info = export_data.get("info") or {}
    artifact = build_base_artifact("opencode", source_ref, transcript_format="sqlite-export")
    artifact["source"]["db_path"] = ((export_data.get("source") or {}).get("db_path"))
    artifact["source"]["session_id"] = session_info.get("id")

    model_info = session_info.get("model") or {}
    artifact["session"]["id"] = session_info.get("id")
    artifact["session"]["cwd"] = session_info.get("directory")
    artifact["session"]["started_at"] = (session_info.get("time") or {}).get("created")
    artifact["session"]["ended_at"] = (session_info.get("time") or {}).get("updated")
    artifact["session"]["cli_version"] = session_info.get("version")
    artifact["session"]["model"] = model_info.get("id") or model_info.get("modelID")
    artifact["session"]["metadata"]["agent"] = session_info.get("agent")
    artifact["session"]["metadata"]["slug"] = session_info.get("slug")
    artifact["session"]["metadata"]["project_id"] = session_info.get("projectID")
    artifact["session"]["metadata"]["workspace_id"] = session_info.get("workspaceID")
    artifact["session"]["metadata"]["parent_id"] = session_info.get("parentID")
    artifact["session"]["metadata"]["provider_id"] = model_info.get("providerID")
    artifact["session"]["metadata"]["path"] = session_info.get("path")
    artifact["session"]["metadata"]["title"] = session_info.get("title")
    artifact["session"]["metadata"]["share_url"] = session_info.get("shareURL")
    artifact["session"]["metadata"]["raw_metadata"] = session_info.get("metadata") or {}

    for index, message in enumerate(export_data.get("messages") or []):
        message_info = message.get("info") or {}
        role = message_info.get("role")
        message_time = message_info.get("time") or {}
        timestamp = message_time.get("created") or message_time.get("completed")

        for part in message.get("parts") or []:
            part_type = part.get("type")
            if part_type == "text":
                text = part.get("text") or ""
                part_time = part.get("time") or {}
                effective_timestamp = part_time.get("start") or part_time.get("end") or timestamp
                push_if_text(artifact["session_trace"]["chat_history"], {
                    "index": index,
                    "timestamp": effective_timestamp,
                    "runtime": "opencode",
                    "role": role,
                    "text": text,
                })
                push_normalized_event(artifact, {
                    "index": index,
                    "timestamp": effective_timestamp,
                    "kind": "chat",
                    "role": role,
                    "text": text,
                })
            elif part_type == "tool":
                state = part.get("state") or {}
                tool_name = part.get("tool")
                call_id = part.get("callID")
                input_value = state.get("input")
                output_value = state.get("output")
                status = state.get("status")
                part_time = state.get("time") or {}
                start_ts = part_time.get("start") or timestamp
                end_ts = part_time.get("end") or start_ts
                is_error = status in {"error", "failed", "cancelled"}

                artifact["session_trace"]["tool_call_trace"].append({
                    "index": index,
                    "timestamp": start_ts,
                    "runtime": "opencode",
                    "direction": "call",
                    "call_id": call_id,
                    "tool_name": tool_name,
                    "input": input_value,
                    "status": status,
                })
                artifact["session_trace"]["tool_call_trace"].append({
                    "index": index,
                    "timestamp": end_ts,
                    "runtime": "opencode",
                    "direction": "result",
                    "call_id": call_id,
                    "tool_name": tool_name,
                    "output": output_value,
                    "status": status,
                    "is_error": is_error,
                })

                command_value = None
                if isinstance(input_value, dict):
                    command_value = input_value.get("cmd") or input_value.get("command")
                artifact["session_trace"]["command_transcript"].append({
                    "index": index,
                    "timestamp": end_ts,
                    "runtime": "opencode",
                    "source": "tool",
                    "call_id": call_id,
                    "tool_name": tool_name,
                    "command": command_value,
                    "input": input_value,
                    "output": output_value,
                    "status": status,
                    "title": state.get("title"),
                })

                if is_error:
                    artifact["session_trace"]["failure_retry_log"].append({
                        "index": index,
                        "timestamp": end_ts,
                        "runtime": "opencode",
                        "source": "tool",
                        "call_id": call_id,
                        "tool_name": tool_name,
                        "error": output_value or f"Tool status: {status}",
                    })

                push_normalized_event(artifact, {
                    "index": index,
                    "timestamp": start_ts,
                    "kind": "tool_call",
                    "role": role,
                    "tool_name": tool_name,
                    "call_id": call_id,
                    "command": command_value,
                })
                push_normalized_event(artifact, {
                    "index": index,
                    "timestamp": end_ts,
                    "kind": "tool_result",
                    "role": role,
                    "tool_name": tool_name,
                    "call_id": call_id,
                    "is_error": is_error,
                })
            elif part_type in {"step-start", "step-finish"}:
                artifact["session_trace"]["artifact_trail"].append({
                    "index": index,
                    "timestamp": timestamp,
                    "runtime": "opencode",
                    "type": part_type,
                    "snapshot": part.get("snapshot"),
                    "reason": part.get("reason"),
                    "cost": part.get("cost"),
                    "tokens": part.get("tokens"),
                })
                if part_type == "step-finish" and part.get("reason"):
                    artifact["session_trace"]["handoff_notes"].append({
                        "index": index,
                        "timestamp": timestamp,
                        "runtime": "opencode",
                        "type": "step-finish",
                        "reason": part.get("reason"),
                    })
                push_normalized_event(artifact, {
                    "index": index,
                    "timestamp": timestamp,
                    "kind": "artifact",
                    "role": role,
                    "artifact_type": part_type,
                })

    artifact["extraction_notes"].append(
        "Opencode session history is stored in SQLite and was reconstructed from session, message, and part tables."
    )
    return artifact


def write_artifact_set(artifact, output_dir: Path):
    ensure_dir(output_dir)
    write_json(output_dir / "session-trace.json", artifact)
    write_json(output_dir / "metadata.json", {
        "schema_version": artifact["schema_version"],
        "runtime": artifact["runtime"],
        "source": artifact["source"],
        "session": artifact["session"],
        "stats": artifact["stats"],
        "extraction_notes": artifact["extraction_notes"],
    })
    write_ndjson(output_dir / "chat-history.ndjson", artifact["session_trace"]["chat_history"])
    write_ndjson(output_dir / "command-transcript.ndjson", artifact["session_trace"]["command_transcript"])
    write_ndjson(output_dir / "tool-call-trace.ndjson", artifact["session_trace"]["tool_call_trace"])
    write_ndjson(output_dir / "artifact-trail.ndjson", artifact["session_trace"]["artifact_trail"])
    write_json(output_dir / "handoff-notes.json", artifact["session_trace"]["handoff_notes"])
    write_json(output_dir / "decision-log.json", artifact["session_trace"]["decision_log"])
    write_json(output_dir / "failure-retry-log.json", artifact["session_trace"]["failure_retry_log"])


def parse_args():
    parser = argparse.ArgumentParser(description="Normalize Claude Code, Codex, or Opencode session history for workflow evaluation.")
    parser.add_argument("--input", help="Raw local transcript path.")
    parser.add_argument("--runtime", choices=["claude", "codex", "opencode"], help="Runtime name.")
    parser.add_argument("--session-id", help="Session id for runtimes that store history in a local database, such as Opencode.")
    parser.add_argument("--latest", action="store_true", help="Pick the latest transcript for the runtime.")
    parser.add_argument("--project", help="Filter latest transcript by project/cwd path.")
    parser.add_argument("--output-dir", help="Target output directory.")
    parser.add_argument("--stdout", action="store_true", help="Print session-trace.json to stdout.")
    return parser.parse_args()


def main():
    args = parse_args()
    input_path = Path(os.path.expanduser(args.input)).resolve() if args.input else None
    runtime = args.runtime or detect_runtime(input_path)
    opencode_session_id = args.session_id

    if runtime == "opencode" and args.latest and opencode_session_id is None:
        latest_session = find_latest_opencode_session(args.project)
        if latest_session is None:
            raise ValueError("No Opencode session found for the requested filter.")
        opencode_session_id = latest_session["id"]

    if runtime != "opencode" and input_path is None and args.latest:
        if runtime is None:
            raise ValueError("--runtime is required when using --latest.")
        input_path = find_latest_transcript(runtime, args.project)

    if runtime == "opencode" and input_path is None and opencode_session_id is None:
        raise ValueError("Provide --session-id, --input, or use --latest for runtime opencode.")
    if runtime != "opencode" and input_path is None:
        raise ValueError("Provide --input or use --latest.")
    if runtime is None:
        runtime = detect_runtime(input_path)
    if runtime not in {"claude", "codex", "opencode"}:
        raise ValueError(f"Unsupported runtime: {runtime}")
    if input_path is not None and not input_path.exists():
        raise FileNotFoundError(f"Transcript not found: {input_path}")

    if runtime == "claude":
        records = read_jsonl(input_path)
        artifact = parse_claude_transcript(records, input_path)
    elif runtime == "codex":
        records = read_jsonl(input_path)
        artifact = parse_codex_transcript(records, input_path)
    else:
        if input_path is not None:
            with input_path.open("r", encoding="utf-8") as handle:
                export_data = json.load(handle)
            source_ref = str(input_path)
        else:
            export_data = load_opencode_session(opencode_session_id)
            source_ref = f"opencode://session/{opencode_session_id}"
        artifact = parse_opencode_export(export_data, source_ref)

    if artifact["session"]["id"] is None:
        artifact["session"]["id"] = opencode_session_id or input_path.stem
        artifact["extraction_notes"].append("Session id was inferred from the available source reference.")

    default_output = Path.cwd() / "docs" / "ai" / "session-traces" / runtime / sanitize_file_name(artifact["session"]["id"])
    output_dir = Path(os.path.expanduser(args.output_dir)).resolve() if args.output_dir else default_output

    write_artifact_set(artifact, output_dir)

    summary = {
        "runtime": artifact["runtime"],
        "transcript_path": artifact["source"]["transcript_path"],
        "output_dir": str(output_dir),
        "session_id": artifact["session"]["id"],
        "cwd": artifact["session"]["cwd"],
        "started_at": artifact["session"]["started_at"],
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
