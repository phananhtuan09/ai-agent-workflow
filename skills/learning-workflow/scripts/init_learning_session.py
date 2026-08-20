#!/usr/bin/env python3
"""Initialize an MVP learning profile and case-bound session."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from validate_learning_state import (
    ValidationError,
    load_json,
    validate_case,
    validate_profile,
    validate_project,
    validate_schedule,
    validate_session,
)


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def write_json_atomic(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temporary_path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary_path.replace(path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--case", required=True, type=Path)
    parser.add_argument("--project", required=True, type=Path)
    parser.add_argument("--schedule", required=True, type=Path)
    parser.add_argument("--profile", required=True, type=Path)
    parser.add_argument("--session", required=True, type=Path)
    parser.add_argument("--goal", required=True)
    parser.add_argument("--baseline")
    args = parser.parse_args()

    try:
        case = load_json(args.case)
        project = load_json(args.project)
        schedule = load_json(args.schedule)
        validate_case(case)
        validate_project(project)
        validate_schedule(schedule, project)
        if project["status"] != "active" or schedule["status"] != "active":
            raise ValidationError("project and schedule must be active before session initialization")
        if case["learning_context"]["project_id"] != project["project_id"]:
            raise ValidationError("case project does not match the active learning project")
        if schedule["current_week"] not in case["learning_context"]["schedule_weeks"]:
            raise ValidationError("case is not aligned with the current schedule week")
        if args.session.exists():
            raise ValidationError(f"session already exists: {args.session}")

        timestamp = now()
        if args.profile.exists():
            profile = load_json(args.profile)
            validate_profile(profile)
            if profile.get("active_session_id"):
                raise ValidationError(f"profile already has active session: {profile['active_session_id']}")
            if profile.get("project_id") != project["project_id"] or profile.get("schedule_id") != schedule["schedule_id"]:
                raise ValidationError("existing profile does not match the active project and schedule")
            profile["schedule_week"] = schedule["current_week"]
        else:
            if not args.baseline or not args.baseline.strip():
                raise ValidationError("--baseline is required when creating a profile")
            profile = {
                "schema_version": "learning-profile/v1",
                "project_id": project["project_id"],
                "schedule_id": schedule["schedule_id"],
                "schedule_week": schedule["current_week"],
                "goals": [
                    {
                        "id": "G-001",
                        "statement": args.goal.strip(),
                        "status": "active",
                        "accepted_at": timestamp
                    }
                ],
                "baseline": {
                    "summary": args.baseline.strip(),
                    "prerequisites": [],
                    "strengths": [],
                    "independence": "unknown",
                    "recorded_at": timestamp
                },
                "competencies": [],
                "current_gaps": [],
                "progress_history": [],
                "active_session_id": None,
                "next_action": None,
                "cadence": "schedule-driven",
                "updated_at": timestamp
            }

        session_id = args.session.stem
        session = {
            "schema_version": "learning-session/v1",
            "session_id": session_id,
            "case_id": case["case_id"],
            "case_path": str(args.case),
            "case_checksum": hashlib.sha256(args.case.read_bytes()).hexdigest(),
            "status": "boundary-pending",
            "started_at": timestamp,
            "updated_at": timestamp,
            "active_competency": case["active_competency"],
            "learning_context": {
                "project_id": project["project_id"],
                "project_version": project["version"],
                "schedule_id": schedule["schedule_id"],
                "schedule_week": schedule["current_week"],
                "project_snapshot": {
                    "title": project["title"],
                    "domain": project["domain"]["summary"],
                    "product_goal": project["product"]["goal"],
                    "architecture_baseline": project["architecture_baseline"]["summary"]
                },
                "weekly_plan": {
                    "theme": schedule["weeks"][schedule["current_week"] - 1]["theme"],
                    "competency_focus": schedule["weeks"][schedule["current_week"] - 1]["competency_focus"],
                    "project_focus": schedule["weeks"][schedule["current_week"] - 1]["project_focus"]
                }
            },
            "boundary": {
                "accepted": False,
                "accepted_at": None,
                "scope": "case",
                "ai_authority": "case support and explicitly authorized mechanical work",
                "protected_judgment_ids": [item["id"] for item in case["protected_judgments"]]
            },
            "protected_judgments": [
                {
                    "id": item["id"],
                    "title": item["title"],
                    "status": "open",
                    "first_attempt": None,
                    "revisions": [],
                    "closed_at": None
                }
                for item in case["protected_judgments"]
            ],
            "discovered_fact_ids": [item["id"] for item in case["facts"] if item["visibility"] == "public"],
            "discovery_records": [],
            "released_event_ids": [],
            "event_release_records": [],
            "assistance": [],
            "evidence_requests": [],
            "system_evidence": [],
            "evidence_interpretations": [],
            "assessment": {
                "dimensions": [],
                "result_summary": {
                    "independent": [],
                    "assisted": [],
                    "not_demonstrated": []
                },
                "gaps": [],
                "outcome": None,
                "limitations": [],
                "disputes": [],
                "next_action": None,
                "accepted_by_human": False,
                "accepted_at": None
            },
            "history": [
                {
                    "at": timestamp,
                    "type": "session-initialized",
                    "detail": "MVP case loaded; boundary awaits human acceptance."
                }
            ]
        }

        profile["active_session_id"] = session_id
        profile["updated_at"] = timestamp
        validate_profile(profile)
        validate_session(session, case, args.case, profile, project, schedule)
        write_json_atomic(args.session, session)
        try:
            write_json_atomic(args.profile, profile)
        except OSError:
            args.session.unlink(missing_ok=True)
            raise
    except ValidationError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(json.dumps({"profile_path": str(args.profile), "session_path": str(args.session)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
