#!/usr/bin/env python3
"""Apply validated state transitions for the MVP learning workflow."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from validate_learning_state import (
    ValidationError,
    load_json,
    validate_case,
    validate_profile,
    validate_session,
)


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def require_payload(args: argparse.Namespace) -> dict[str, Any]:
    if args.payload is None:
        raise ValidationError(f"{args.operation} requires --payload")
    return load_json(args.payload)


def require_string(payload: dict[str, Any], field: str) -> str:
    value = payload.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"payload.{field} must be a non-empty string")
    return value.strip()


def require_string_list(payload: dict[str, Any], field: str, allow_empty: bool = True) -> list[str]:
    value = payload.get(field)
    if not isinstance(value, list) or any(not isinstance(item, str) or not item.strip() for item in value):
        raise ValidationError(f"payload.{field} must be an array of non-empty strings")
    if not allow_empty and not value:
        raise ValidationError(f"payload.{field} must not be empty")
    return [item.strip() for item in value]


def next_id(value: dict[str, Any], prefix: str) -> str:
    matches = [int(item) for item in re.findall(rf'"{re.escape(prefix)}-(\d{{3}})"', json.dumps(value))]
    return f"{prefix}-{max(matches, default=0) + 1:03d}"


def append_history(session: dict[str, Any], timestamp: str, event_type: str, detail: str) -> None:
    session["history"].append({"at": timestamp, "type": event_type, "detail": detail})
    session["updated_at"] = timestamp


def find_judgment(session: dict[str, Any], judgment_id: str) -> dict[str, Any]:
    for judgment in session["protected_judgments"]:
        if judgment["id"] == judgment_id:
            return judgment
    raise ValidationError(f"unknown judgment: {judgment_id}")


def find_record(items: list[dict[str, Any]], record_id: str, label: str) -> dict[str, Any]:
    for item in items:
        if item.get("id") == record_id:
            return item
    raise ValidationError(f"unknown {label}: {record_id}")


def require_accepted_boundary(session: dict[str, Any]) -> None:
    if session["boundary"]["accepted"] is not True:
        raise ValidationError("boundary must be accepted before this transition")


def accept_boundary(session: dict[str, Any], timestamp: str) -> None:
    if session["status"] != "boundary-pending":
        raise ValidationError("accept-boundary requires a boundary-pending session")
    session["boundary"]["accepted"] = True
    session["boundary"]["accepted_at"] = timestamp
    session["status"] = "active"
    append_history(session, timestamp, "boundary-accepted", "Human accepted the active competency and protected scope.")


def disclose_facts(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    require_accepted_boundary(session)
    fact_ids = require_string_list(payload, "fact_ids", allow_empty=False)
    session["discovery_records"].append({
        "id": next_id(session, "DR"),
        "question": require_string(payload, "question"),
        "matched_discovery_path": require_string(payload, "matched_discovery_path"),
        "fact_ids": fact_ids,
        "recorded_at": timestamp,
    })
    session["discovered_fact_ids"] = list(dict.fromkeys([*session["discovered_fact_ids"], *fact_ids]))
    append_history(session, timestamp, "facts-disclosed", f"Disclosed grounded facts: {', '.join(fact_ids)}.")


def record_attempt(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    require_accepted_boundary(session)
    judgment = find_judgment(session, require_string(payload, "judgment_id"))
    if any(item["judgment_id"] == judgment["id"] and item["material"] for item in session["assistance"]):
        raise ValidationError("cannot record an independent first attempt after material assistance")
    if judgment["status"] != "open" or judgment["first_attempt"] is not None:
        raise ValidationError("record-attempt requires an open judgment without a prior attempt")
    judgment["first_attempt"] = {
        "id": next_id(session, "AT"),
        "summary": require_string(payload, "summary"),
        "reasoning": require_string(payload, "reasoning"),
        "assumptions": require_string_list(payload, "assumptions"),
        "constraints": require_string_list(payload, "constraints"),
        "invariants": require_string_list(payload, "invariants"),
        "risks": require_string_list(payload, "risks"),
        "predictions": require_string_list(payload, "predictions"),
        "tradeoffs": require_string_list(payload, "tradeoffs"),
        "independent": True,
        "recorded_at": timestamp,
    }
    judgment["status"] = "first-attempt-recorded"
    append_history(session, timestamp, "first-attempt-recorded", f"Recorded independent attempt for {judgment['id']}.")


def record_revision(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    require_accepted_boundary(session)
    judgment = find_judgment(session, require_string(payload, "judgment_id"))
    if judgment["first_attempt"] is None:
        raise ValidationError("record-revision requires a first attempt")
    revision = {
        "id": next_id(session, "RV"),
        "summary": require_string(payload, "summary"),
        "reason": require_string(payload, "reason"),
        "evidence_refs": require_string_list(payload, "evidence_refs", allow_empty=False),
        "recorded_at": timestamp,
    }
    judgment["revisions"].append(revision)
    materially_assisted = any(
        item["judgment_id"] == judgment["id"] and item["material"]
        for item in session["assistance"]
    )
    judgment["status"] = "assisted" if materially_assisted else "independently-revised"
    if materially_assisted:
        judgment["closed_at"] = timestamp
    append_history(session, timestamp, "revision-recorded", f"Recorded revision for {judgment['id']}.")


def record_assistance(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    require_accepted_boundary(session)
    judgment = find_judgment(session, require_string(payload, "judgment_id"))
    level = payload.get("level")
    if level not in {1, 2, 3, 4, 5, 6}:
        raise ValidationError("payload.level must be 1..6")
    material = payload.get("material")
    if not isinstance(material, bool):
        raise ValidationError("payload.material must be boolean")
    if level >= 4:
        material = True
    status_before = judgment["status"]
    if level == 6 and status_before not in {"assessment-closed", "assessment-frozen"}:
        raise ValidationError("level 6 requires a closed or frozen judgment")
    record = {
        "id": next_id(session, "AS"),
        "judgment_id": judgment["id"],
        "level": level,
        "kind": require_string(payload, "kind"),
        "content": require_string(payload, "content"),
        "material": material,
        "material_reason": require_string(payload, "material_reason") if material else None,
        "before_first_attempt": judgment["first_attempt"] is None,
        "judgment_status_before": status_before,
        "impact": require_string(payload, "impact"),
        "recorded_at": timestamp,
    }
    session["assistance"].append(record)
    if material:
        judgment["status"] = "assisted"
        judgment["closed_at"] = timestamp
    elif judgment["first_attempt"] is not None and judgment["status"] == "first-attempt-recorded":
        judgment["status"] = "under-review"
    append_history(session, timestamp, "assistance-recorded", f"Recorded level {level} assistance for {judgment['id']}.")


def request_evidence(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    require_accepted_boundary(session)
    judgment_id = require_string(payload, "judgment_id")
    find_judgment(session, judgment_id)
    interpretation_protected = payload.get("interpretation_protected")
    if not isinstance(interpretation_protected, bool):
        raise ValidationError("payload.interpretation_protected must be boolean")
    request = {
        "id": next_id(session, "ER"),
        "judgment_id": judgment_id,
        "decision_or_assumption": require_string(payload, "decision_or_assumption"),
        "question": require_string(payload, "question"),
        "method": require_string(payload, "method"),
        "scope": require_string(payload, "scope"),
        "interpretation_protected": interpretation_protected,
        "status": "authorized",
        "authorized_at": timestamp,
    }
    session["evidence_requests"].append(request)
    append_history(session, timestamp, "evidence-authorized", f"Authorized evidence request {request['id']}.")


def block_evidence(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    request = find_record(session["evidence_requests"], require_string(payload, "request_id"), "evidence request")
    if request["status"] != "authorized":
        raise ValidationError("block-evidence requires an authorized request")
    request["status"] = "blocked"
    request["blocked_reason"] = require_string(payload, "blocked_reason")
    append_history(session, timestamp, "evidence-blocked", f"Blocked evidence request {request['id']}.")


def record_evidence(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    request = find_record(session["evidence_requests"], require_string(payload, "request_id"), "evidence request")
    if request["status"] != "authorized":
        raise ValidationError("record-evidence requires an authorized request")
    evidence = deepcopy(payload)
    evidence["id"] = next_id(session, "SE")
    evidence["judgment_id"] = request["judgment_id"]
    evidence["recorded_at"] = timestamp
    session["system_evidence"].append(evidence)
    request["status"] = "completed"
    append_history(session, timestamp, "system-evidence-recorded", f"Recorded system evidence {evidence['id']}.")


def interpret_evidence(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    evidence = find_record(session["system_evidence"], require_string(payload, "evidence_id"), "system evidence")
    interpretation = {
        "id": next_id(session, "EI"),
        "evidence_id": evidence["id"],
        "judgment_id": evidence["judgment_id"],
        "summary": require_string(payload, "summary"),
        "proves": require_string_list(payload, "proves"),
        "does_not_prove": require_string_list(payload, "does_not_prove", allow_empty=False),
        "decision_change": require_string(payload, "decision_change"),
        "recorded_at": timestamp,
    }
    session["evidence_interpretations"].append(interpretation)
    append_history(session, timestamp, "evidence-interpreted", f"Recorded human interpretation {interpretation['id']}.")


def release_event(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    require_accepted_boundary(session)
    event_id = require_string(payload, "event_id")
    if event_id in session["released_event_ids"]:
        raise ValidationError(f"event already released: {event_id}")
    record = {
        "id": next_id(session, "ERL"),
        "event_id": event_id,
        "trigger_evidence": require_string_list(payload, "trigger_evidence", allow_empty=False),
        "released_at": timestamp,
    }
    session["event_release_records"].append(record)
    session["released_event_ids"].append(event_id)
    append_history(session, timestamp, "future-event-released", f"Released predeclared event {event_id}.")


def close_judgment(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    judgment = find_judgment(session, require_string(payload, "judgment_id"))
    mode = require_string(payload, "mode")
    if mode not in {"assessment-closed", "assessment-frozen"}:
        raise ValidationError("payload.mode must be assessment-closed or assessment-frozen")
    if mode == "assessment-closed" and judgment["first_attempt"] is None:
        raise ValidationError("assessment-closed requires an independent first attempt")
    if mode == "assessment-closed" and any(
        item["judgment_id"] == judgment["id"] and item["material"] for item in session["assistance"]
    ):
        raise ValidationError("materially assisted judgment cannot be assessment-closed")
    judgment["status"] = mode
    judgment["closed_at"] = timestamp
    append_history(session, timestamp, mode, f"Set {judgment['id']} to {mode}.")


def propose_assessment(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    if any(item["status"] not in {"assessment-closed", "assessment-frozen", "assisted"} for item in session["protected_judgments"]):
        raise ValidationError("all judgments must be terminal before assessment")
    session["assessment"] = {
        "dimensions": payload.get("dimensions"),
        "result_summary": payload.get("result_summary"),
        "gaps": payload.get("gaps"),
        "outcome": payload.get("outcome"),
        "limitations": payload.get("limitations"),
        "disputes": session["assessment"].get("disputes", []),
        "next_action": payload.get("next_action"),
        "accepted_by_human": False,
        "accepted_at": None,
    }
    session["status"] = "assessment"
    append_history(session, timestamp, "assessment-proposed", "Prepared an evidence-bound assessment for human review.")


def raise_dispute(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    if session["status"] != "assessment":
        raise ValidationError("raise-dispute requires assessment status")
    dispute = {
        "id": next_id(session, "DP"),
        "category": require_string(payload, "category"),
        "status": "open",
        "reason": require_string(payload, "reason"),
        "raised_at": timestamp,
    }
    session["assessment"]["disputes"].append(dispute)
    append_history(session, timestamp, "assessment-disputed", f"Recorded dispute {dispute['id']}.")


def resolve_dispute(session: dict[str, Any], payload: dict[str, Any], timestamp: str) -> None:
    dispute = find_record(session["assessment"]["disputes"], require_string(payload, "dispute_id"), "dispute")
    if dispute["status"] != "open":
        raise ValidationError("resolve-dispute requires an open dispute")
    dispute["status"] = "resolved"
    dispute["resolution"] = require_string(payload, "resolution")
    append_history(session, timestamp, "assessment-dispute-resolved", f"Resolved dispute {dispute['id']}.")


def derive_independence(dimensions: list[dict[str, Any]]) -> str:
    observed = {item.get("independence") for item in dimensions if item.get("rating") in {"demonstrated", "partial"}}
    if "assisted" in observed:
        return "assisted"
    if "independent" in observed:
        return "independent"
    return "not-observed"


def complete_session(session: dict[str, Any], profile: dict[str, Any], timestamp: str) -> None:
    if session["status"] != "assessment":
        raise ValidationError("complete-session requires assessment status")
    assessment = session["assessment"]
    assessment["accepted_by_human"] = True
    assessment["accepted_at"] = timestamp
    session["status"] = "completed"
    session["completed_at"] = timestamp
    append_history(session, timestamp, "session-completed", "Human accepted the assessment and progression recommendation.")

    profile["active_session_id"] = None
    profile["current_gaps"] = assessment["gaps"]
    profile["next_action"] = assessment["next_action"]
    profile["updated_at"] = timestamp
    competency = {
        "id": session["active_competency"]["id"],
        "name": session["active_competency"]["name"],
        "latest_outcome": assessment["outcome"],
        "independence": derive_independence(assessment["dimensions"]),
        "last_session_id": session["session_id"],
        "updated_at": timestamp,
    }
    profile["competencies"] = [item for item in profile["competencies"] if item.get("id") != competency["id"]]
    profile["competencies"].append(competency)
    profile["progress_history"].append({
        "session_id": session["session_id"],
        "competency_id": session["active_competency"]["id"],
        "outcome": assessment["outcome"],
        "result_summary": assessment["result_summary"],
        "gaps": assessment["gaps"],
        "completed_at": timestamp,
    })


TRANSITIONS = {
    "accept-boundary": lambda session, profile, payload, timestamp: accept_boundary(session, timestamp),
    "disclose-facts": lambda session, profile, payload, timestamp: disclose_facts(session, payload, timestamp),
    "record-attempt": lambda session, profile, payload, timestamp: record_attempt(session, payload, timestamp),
    "record-revision": lambda session, profile, payload, timestamp: record_revision(session, payload, timestamp),
    "record-assistance": lambda session, profile, payload, timestamp: record_assistance(session, payload, timestamp),
    "request-evidence": lambda session, profile, payload, timestamp: request_evidence(session, payload, timestamp),
    "block-evidence": lambda session, profile, payload, timestamp: block_evidence(session, payload, timestamp),
    "record-evidence": lambda session, profile, payload, timestamp: record_evidence(session, payload, timestamp),
    "interpret-evidence": lambda session, profile, payload, timestamp: interpret_evidence(session, payload, timestamp),
    "release-event": lambda session, profile, payload, timestamp: release_event(session, payload, timestamp),
    "close-judgment": lambda session, profile, payload, timestamp: close_judgment(session, payload, timestamp),
    "propose-assessment": lambda session, profile, payload, timestamp: propose_assessment(session, payload, timestamp),
    "raise-dispute": lambda session, profile, payload, timestamp: raise_dispute(session, payload, timestamp),
    "resolve-dispute": lambda session, profile, payload, timestamp: resolve_dispute(session, payload, timestamp),
    "complete-session": lambda session, profile, payload, timestamp: complete_session(session, profile, timestamp),
}


def write_pair_atomic(session_path: Path, session: dict[str, Any], profile_path: Path, profile: dict[str, Any]) -> None:
    session_text = json.dumps(session, ensure_ascii=False, indent=2) + "\n"
    profile_text = json.dumps(profile, ensure_ascii=False, indent=2) + "\n"
    session_tmp = session_path.with_name(f".{session_path.name}.{os.getpid()}.tmp")
    profile_tmp = profile_path.with_name(f".{profile_path.name}.{os.getpid()}.tmp")
    previous_session = session_path.read_bytes()
    previous_profile = profile_path.read_bytes()
    session_tmp.write_text(session_text, encoding="utf-8")
    profile_tmp.write_text(profile_text, encoding="utf-8")
    try:
        session_tmp.replace(session_path)
        profile_tmp.replace(profile_path)
    except OSError:
        session_path.write_bytes(previous_session)
        profile_path.write_bytes(previous_profile)
        session_tmp.unlink(missing_ok=True)
        profile_tmp.unlink(missing_ok=True)
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=sorted(TRANSITIONS))
    parser.add_argument("--session", required=True, type=Path)
    parser.add_argument("--case", required=True, type=Path)
    parser.add_argument("--profile", required=True, type=Path)
    parser.add_argument("--payload", type=Path)
    args = parser.parse_args()

    try:
        session = load_json(args.session)
        case = load_json(args.case)
        profile = load_json(args.profile)
        validate_case(case)
        validate_profile(profile)
        validate_session(session, case, args.case, profile)
        payload = {} if args.payload is None else require_payload(args)
        if args.operation not in {"accept-boundary", "complete-session"} and args.payload is None:
            raise ValidationError(f"{args.operation} requires --payload")
        timestamp = now()
        TRANSITIONS[args.operation](session, profile, payload, timestamp)
        validate_profile(profile)
        validate_session(session, case, args.case, profile)
        write_pair_atomic(args.session, session, args.profile, profile)
    except (OSError, ValidationError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(json.dumps({
        "operation": args.operation,
        "session_path": str(args.session),
        "profile_path": str(args.profile),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
