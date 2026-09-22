#!/usr/bin/env python3
"""Initialize an MVP learning profile and case-bound session."""

from __future__ import annotations

import argparse
import hashlib
import json
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

from state_io import learning_state_lock, snapshot_paths, write_files_atomic

def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")



def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--case", required=True, type=Path)
    parser.add_argument("--project", required=True, type=Path)
    parser.add_argument("--schedule", required=True, type=Path)
    parser.add_argument("--profile", required=True, type=Path)
    parser.add_argument("--session", required=True, type=Path)
    parser.add_argument("--goal", required=True)
    parser.add_argument("--baseline")
    parser.add_argument("--mode", choices=("practice", "challenge"))
    parser.add_argument("--time-budget-minutes", type=int)
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
        current_week_plan = schedule["weeks"][schedule["current_week"] - 1]
        case_mini_project = case.get("mini_project")
        if case_mini_project is not None and case["case_id"] not in current_week_plan.get("mini_project_ids", []):
            raise ValidationError("mini-project case is not listed in the current schedule cycle")
        if case_mini_project is not None:
            selected_mode = args.mode if args.mode is not None else case_mini_project["mode"]
            selected_budget = (
                args.time_budget_minutes
                if args.time_budget_minutes is not None
                else case_mini_project["daily_time_budget_minutes"]
            )
            if selected_mode not in schedule.get("available_modes", []):
                raise ValidationError("--mode is not available in the active schedule")
            if selected_budget < 15 or selected_budget > case_mini_project["daily_time_budget_minutes"]:
                raise ValidationError(
                    "--time-budget-minutes must be between 15 and the case daily budget"
                )
        else:
            if args.mode or args.time_budget_minutes is not None:
                raise ValidationError("--mode and --time-budget-minutes require a mini-project case")
            selected_mode = None
            selected_budget = None
        if args.session.exists():
            raise ValidationError(f"session already exists: {args.session}")

        originals = snapshot_paths([args.session, args.profile])
        timestamp = now()
        if args.profile.exists():
            profile = load_json(args.profile)
            validate_profile(profile)
            if profile.get("active_session_id"):
                raise ValidationError(f"profile already has active session: {profile['active_session_id']}")
            if profile.get("project_id") != project["project_id"] or profile.get("schedule_id") != schedule["schedule_id"]:
                raise ValidationError("existing profile does not match the active project and schedule")
            profile["schedule_week"] = schedule["current_week"]
            profile["cadence"] = schedule.get("cadence_model", "schedule-driven")
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
                "cadence": schedule.get("cadence_model", "schedule-driven"),
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
                    "project_focus": schedule["weeks"][schedule["current_week"] - 1]["project_focus"],
                    "mini_project_ids": schedule["weeks"][schedule["current_week"] - 1].get("mini_project_ids", []),
                    "target_duration_days": schedule["weeks"][schedule["current_week"] - 1].get("target_duration_days")
                },
                "project_spec": case.get("project_spec")
            },
            "boundary": {
                "accepted": False,
                "accepted_at": None,
                "scope": "mini-project" if case_mini_project is not None else "case",
                "ai_authority": "case support and explicitly authorized mechanical work",
                "protected_judgment_ids": [item["id"] for item in case["protected_judgments"]]
            },
            "mini_project": (
                {
                    "case_id": case_mini_project["id"],
                    "category": case_mini_project["category"],
                    "activity": case_mini_project["activity"],
                    "mode": selected_mode,
                    "duration_days": case_mini_project["duration_days"],
                    "daily_time_budget_minutes": selected_budget,
                    "pitch": case_mini_project["pitch"],
                    "deliverable": case_mini_project["deliverable"],
                    "definition_of_done": case_mini_project["definition_of_done"]
                }
                if case_mini_project is not None
                else None
            ),
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
            "delivery": (
                {
                    "id": "DL-001",
                    "status": "not-started",
                    "summary": None,
                    "artifact_refs": [],
                    "completed_criteria": [],
                    "limitations": [],
                    "recorded_at": None
                }
                if case_mini_project is not None
                else None
            ),
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
                    "detail": (
                        "Mini-project loaded; boundary awaits human acceptance."
                        if case_mini_project is not None
                        else "Case loaded; boundary awaits human acceptance."
                    )
                }
            ]
        }

        profile["active_session_id"] = session_id
        profile["updated_at"] = timestamp
        validate_profile(profile)
        validate_session(session, case, args.case, profile, project, schedule)
        with learning_state_lock([
            args.case,
            args.project,
            args.schedule,
            args.profile,
            args.session,
        ]) as root:
            write_files_atomic(
                {
                    args.session: json.dumps(session, ensure_ascii=False, indent=2) + "\n",
                    args.profile: json.dumps(profile, ensure_ascii=False, indent=2) + "\n",
                },
                originals=originals,
                root=root,
            )
    except (OSError, ValidationError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(json.dumps({"profile_path": str(args.profile), "session_path": str(args.session)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
