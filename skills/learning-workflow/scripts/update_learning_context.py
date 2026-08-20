#!/usr/bin/env python3
"""Approve and evolve durable learning project and schedule artifacts."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from validate_learning_state import ValidationError, load_json, validate_project, validate_schedule


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def require_string(payload: dict[str, Any], field: str) -> str:
    value = payload.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"payload.{field} must be a non-empty string")
    return value.strip()


def require_string_list(payload: dict[str, Any], field: str) -> list[str]:
    value = payload.get(field)
    if not isinstance(value, list) or any(not isinstance(item, str) or not item.strip() for item in value):
        raise ValidationError(f"payload.{field} must be an array of non-empty strings")
    return [item.strip() for item in value]


def append_unique(target: list[str], values: list[str]) -> None:
    for value in values:
        if value not in target:
            target.append(value)


def accept_context(project: dict[str, Any], schedule: dict[str, Any], timestamp: str) -> None:
    if project["status"] != "draft" or schedule["status"] != "draft":
        raise ValidationError("accept requires draft project and schedule artifacts")
    project["status"] = "active"
    project["accepted_at"] = timestamp
    project["evolution_history"][0]["accepted_at"] = timestamp
    schedule["status"] = "active"
    schedule["accepted_at"] = timestamp
    schedule["started_at"] = timestamp
    schedule["weeks"][schedule["current_week"] - 1]["status"] = "in-progress"


def record_project_evolution(
    project: dict[str, Any],
    schedule: dict[str, Any],
    payload: dict[str, Any],
    timestamp: str,
) -> None:
    if project["status"] != "active" or schedule["status"] not in {"active", "completed"}:
        raise ValidationError("project evolution requires an active project and accepted schedule")
    session_id = require_string(payload, "session_id")
    scheduled_sessions = {
        item
        for week in schedule["weeks"]
        for item in week["completed_session_ids"]
    }
    if session_id not in scheduled_sessions:
        raise ValidationError("project evolution requires a completed session recorded in the schedule")
    decisions = require_string_list(payload, "decisions")
    capabilities = require_string_list(payload, "delivered_capabilities")
    constraints = require_string_list(payload, "active_constraints")
    append_unique(project["current_state"]["accepted_decisions"], decisions)
    append_unique(project["current_state"]["delivered_capabilities"], capabilities)
    append_unique(project["current_state"]["active_constraints"], constraints)
    project["version"] += 1
    project["evolution_history"].append({
        "version": project["version"],
        "session_id": session_id,
        "summary": require_string(payload, "summary"),
        "decisions": decisions,
        "delivered_capabilities": capabilities,
        "active_constraints": constraints,
        "accepted_at": timestamp,
    })


def recalibrate_schedule(
    project: dict[str, Any],
    schedule: dict[str, Any],
    payload: dict[str, Any],
    timestamp: str,
) -> None:
    if project["status"] != "active" or schedule["status"] != "active":
        raise ValidationError("schedule recalibration requires active project and schedule artifacts")
    effective_week = payload.get("effective_week")
    if not isinstance(effective_week, int) or effective_week < schedule["current_week"] or effective_week > schedule["horizon_weeks"]:
        raise ValidationError("payload.effective_week must be within the remaining schedule")
    updates = payload.get("updates")
    if not isinstance(updates, list) or not updates:
        raise ValidationError("payload.updates must be a non-empty array")
    updated_weeks: set[int] = set()
    for index, update in enumerate(updates):
        if not isinstance(update, dict):
            raise ValidationError(f"payload.updates[{index}] must be an object")
        week_number = update.get("week")
        if not isinstance(week_number, int) or week_number < effective_week or week_number > schedule["horizon_weeks"]:
            raise ValidationError(f"payload.updates[{index}].week is outside the recalibration range")
        if week_number in updated_weeks:
            raise ValidationError(f"payload.updates repeats week {week_number}")
        updated_weeks.add(week_number)
        week = schedule["weeks"][week_number - 1]
        if week["status"] == "completed":
            raise ValidationError("completed schedule weeks cannot be recalibrated")
        if "theme" in update:
            week["theme"] = require_string(update, "theme")
        if "competency_focus" in update:
            week["competency_focus"] = require_string_list(update, "competency_focus")
            if not week["competency_focus"]:
                raise ValidationError("updated competency_focus must not be empty")
        if "project_focus" in update:
            week["project_focus"] = require_string(update, "project_focus")
    schedule["revision_history"].append({
        "reason": require_string(payload, "reason"),
        "effective_week": effective_week,
        "updates": updates,
        "accepted_at": timestamp,
    })


def write_pair_atomic(project_path: Path, project: dict[str, Any], schedule_path: Path, schedule: dict[str, Any]) -> None:
    values = {
        project_path: json.dumps(project, ensure_ascii=False, indent=2) + "\n",
        schedule_path: json.dumps(schedule, ensure_ascii=False, indent=2) + "\n",
    }
    previous = {path: path.read_bytes() for path in values}
    temporary = {
        path: path.with_name(f".{path.name}.{os.getpid()}.tmp")
        for path in values
    }
    for path, text in values.items():
        temporary[path].write_text(text, encoding="utf-8")
    try:
        for path in values:
            temporary[path].replace(path)
    except OSError:
        for path, content in previous.items():
            path.write_bytes(content)
        for path in temporary.values():
            path.unlink(missing_ok=True)
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=["accept", "record-project-evolution", "recalibrate-schedule"])
    parser.add_argument("--project", required=True, type=Path)
    parser.add_argument("--schedule", required=True, type=Path)
    parser.add_argument("--payload", type=Path)
    args = parser.parse_args()

    try:
        project = load_json(args.project)
        schedule = load_json(args.schedule)
        validate_project(project)
        validate_schedule(schedule, project)
        payload = load_json(args.payload) if args.payload else {}
        timestamp = now()
        if args.operation == "accept":
            if args.payload is not None:
                raise ValidationError("accept does not use --payload")
            accept_context(project, schedule, timestamp)
        elif args.operation == "record-project-evolution":
            if args.payload is None:
                raise ValidationError("record-project-evolution requires --payload")
            record_project_evolution(project, schedule, payload, timestamp)
        else:
            if args.payload is None:
                raise ValidationError("recalibrate-schedule requires --payload")
            recalibrate_schedule(project, schedule, payload, timestamp)
        validate_project(project)
        validate_schedule(schedule, project)
        write_pair_atomic(args.project, project, args.schedule, schedule)
    except (OSError, ValidationError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(json.dumps({
        "operation": args.operation,
        "project_path": str(args.project),
        "schedule_path": str(args.schedule),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
