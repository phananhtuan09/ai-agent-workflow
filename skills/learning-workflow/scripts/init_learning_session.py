#!/usr/bin/env python3
"""Initialize an MVP learning profile and case-bound session."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from validate_learning_state import ValidationError, load_json, validate_case, validate_profile, validate_session


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def write_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--case", required=True, type=Path)
    parser.add_argument("--profile", required=True, type=Path)
    parser.add_argument("--session", required=True, type=Path)
    parser.add_argument("--goal", required=True)
    parser.add_argument("--baseline")
    args = parser.parse_args()

    try:
        case = load_json(args.case)
        validate_case(case)
        if args.session.exists():
            raise ValidationError(f"session already exists: {args.session}")

        timestamp = now()
        if args.profile.exists():
            profile = load_json(args.profile)
            validate_profile(profile)
            if profile.get("active_session_id"):
                raise ValidationError(f"profile already has active session: {profile['active_session_id']}")
        else:
            if not args.baseline or not args.baseline.strip():
                raise ValidationError("--baseline is required when creating a profile")
            profile = {
                "schema_version": "learning-profile/v1",
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
                    "recorded_at": timestamp
                },
                "competencies": [],
                "current_gaps": [],
                "progress_history": [],
                "active_session_id": None,
                "next_action": None,
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
            "boundary": {
                "accepted": False,
                "accepted_at": None,
                "scope": "case",
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
            "released_event_ids": [],
            "assistance": [],
            "evidence_requests": [],
            "system_evidence": [],
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
                "next_action": None
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
        validate_session(session, case, args.case, profile)
        write_json(args.profile, profile)
        write_json(args.session, session)
    except ValidationError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(json.dumps({"profile_path": str(args.profile), "session_path": str(args.session)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
