#!/usr/bin/env python3
"""Validate learning-workflow case, profile, and session invariants."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any


ID = re.compile(r"^[A-Z]+(?:-[A-Z]+)*-\d{3}$")
SESSION_ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
JUDGMENT_STATUSES = {
    "open",
    "first-attempt-recorded",
    "under-review",
    "independently-revised",
    "assessment-closed",
    "assessment-frozen",
    "assisted",
}
TERMINAL_JUDGMENT_STATUSES = {"assessment-closed", "assessment-frozen", "assisted"}
SESSION_STATUSES = {"boundary-pending", "active", "assessment", "completed"}
OUTCOMES = {"independent-success", "assisted-success", "needs-revisit", "inconclusive"}
NEXT_ACTIONS = {
    "revisit-prerequisite",
    "retry-similar",
    "transfer-context",
    "increase-difficulty",
    "change-competency",
}
PROGRESSION_ACTIONS = {"transfer-context", "increase-difficulty"}
RATINGS = {"demonstrated", "partial", "not-demonstrated", "inconclusive"}
INDEPENDENCE = {"independent", "assisted", "not-observed"}
RESULT_GROUPS = {"independent", "assisted", "not_demonstrated"}


class ValidationError(ValueError):
    pass


def fail(message: str) -> None:
    raise ValidationError(message)


def load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"file does not exist: {path}")
    except json.JSONDecodeError as error:
        fail(f"invalid JSON in {path}: {error}")
    if not isinstance(value, dict):
        fail(f"root must be an object: {path}")
    return value


def require_string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        fail(f"{field} must be a non-empty string")
    return value.strip()


def require_list(value: Any, field: str) -> list[Any]:
    if not isinstance(value, list):
        fail(f"{field} must be an array")
    return value


def require_string_list(value: Any, field: str, allow_empty: bool = True) -> list[str]:
    items = require_list(value, field)
    if not allow_empty and not items:
        fail(f"{field} must not be empty")
    for index, item in enumerate(items):
        require_string(item, f"{field}[{index}]")
    return items


def unique_ids(items: list[Any], field: str, pattern: re.Pattern[str] = ID) -> set[str]:
    seen: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            fail(f"{field}[{index}] must be an object")
        item_id = require_string(item.get("id"), f"{field}[{index}].id")
        if not pattern.fullmatch(item_id):
            fail(f"{field}[{index}].id has invalid format: {item_id}")
        if item_id in seen:
            fail(f"duplicate id in {field}: {item_id}")
        seen.add(item_id)
    return seen


def checksum(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_case(case: dict[str, Any]) -> None:
    if case.get("schema_version") != "learning-case/v1":
        fail("case.schema_version must equal learning-case/v1")
    require_string(case.get("case_id"), "case.case_id")
    require_string(case.get("title"), "case.title")
    require_string(case.get("domain"), "case.domain")
    competency = case.get("active_competency")
    if not isinstance(competency, dict):
        fail("case.active_competency must be an object")
    require_string(competency.get("id"), "case.active_competency.id")
    require_string(competency.get("name"), "case.active_competency.name")
    brief = case.get("public_brief")
    if not isinstance(brief, dict):
        fail("case.public_brief must be an object")
    require_string(brief.get("business_goal"), "case.public_brief.business_goal")
    require_string(brief.get("initial_question"), "case.public_brief.initial_question")
    require_string_list(brief.get("current_context"), "case.public_brief.current_context", allow_empty=False)

    judgments = require_list(case.get("protected_judgments"), "case.protected_judgments")
    judgment_ids = unique_ids(judgments, "case.protected_judgments")
    if not judgment_ids:
        fail("case.protected_judgments must not be empty")
    for index, judgment in enumerate(judgments):
        require_string(judgment.get("title"), f"case.protected_judgments[{index}].title")
        require_string(judgment.get("prompt"), f"case.protected_judgments[{index}].prompt")
        require_string_list(
            judgment.get("required_observations"),
            f"case.protected_judgments[{index}].required_observations",
            allow_empty=False,
        )

    facts = require_list(case.get("facts"), "case.facts")
    unique_ids(facts, "case.facts")
    for index, fact in enumerate(facts):
        visibility = fact.get("visibility")
        if visibility not in {"public", "discoverable"}:
            fail(f"case.facts[{index}].visibility must be public or discoverable")
        require_string(fact.get("statement"), f"case.facts[{index}].statement")
        paths = require_string_list(fact.get("discovery_paths"), f"case.facts[{index}].discovery_paths")
        if visibility == "discoverable" and not paths:
            fail(f"case.facts[{index}] discoverable fact requires a discovery path")

    events = require_list(case.get("future_events"), "case.future_events")
    unique_ids(events, "case.future_events")
    for index, event in enumerate(events):
        require_string(event.get("trigger"), f"case.future_events[{index}].trigger")
        require_string(event.get("statement"), f"case.future_events[{index}].statement")
        require_string(event.get("purpose"), f"case.future_events[{index}].purpose")

    rubric = require_list(case.get("rubric"), "case.rubric")
    unique_ids(rubric, "case.rubric")
    if not rubric:
        fail("case.rubric must not be empty")
    for index, dimension in enumerate(rubric):
        require_string(dimension.get("name"), f"case.rubric[{index}].name")
        required = set(require_list(dimension.get("required_judgment_ids"), f"case.rubric[{index}].required_judgment_ids"))
        unknown = required - judgment_ids
        if unknown:
            fail(f"case.rubric[{index}] references unknown judgments: {sorted(unknown)}")
        require_string_list(
            dimension.get("observable_signals"),
            f"case.rubric[{index}].observable_signals",
            allow_empty=False,
        )

    transfer = case.get("transfer")
    if not isinstance(transfer, dict):
        fail("case.transfer must be an object")
    require_string(transfer.get("prompt"), "case.transfer.prompt")
    require_string(transfer.get("same_principle"), "case.transfer.same_principle")


def validate_profile(profile: dict[str, Any]) -> None:
    if profile.get("schema_version") != "learning-profile/v1":
        fail("profile.schema_version must equal learning-profile/v1")
    goals = require_list(profile.get("goals"), "profile.goals")
    if not goals:
        fail("profile.goals must not be empty")
    unique_ids(goals, "profile.goals", re.compile(r"^G-\d{3}$"))
    for index, goal in enumerate(goals):
        require_string(goal.get("statement"), f"profile.goals[{index}].statement")
        if goal.get("status") not in {"active", "paused", "completed"}:
            fail(f"profile.goals[{index}].status is invalid")
    baseline = profile.get("baseline")
    if not isinstance(baseline, dict):
        fail("profile.baseline must be an object")
    require_string(baseline.get("summary"), "profile.baseline.summary")
    require_string(baseline.get("recorded_at"), "profile.baseline.recorded_at")
    require_list(profile.get("competencies"), "profile.competencies")
    current_gaps = require_string_list(profile.get("current_gaps"), "profile.current_gaps")
    if len(current_gaps) > 3:
        fail("profile.current_gaps must contain at most three items")
    progress_history = require_list(profile.get("progress_history"), "profile.progress_history")
    history_session_ids: set[str] = set()
    for index, entry in enumerate(progress_history):
        if not isinstance(entry, dict):
            fail(f"profile.progress_history[{index}] must be an object")
        history_session_id = require_string(entry.get("session_id"), f"profile.progress_history[{index}].session_id")
        if history_session_id in history_session_ids:
            fail(f"duplicate progress history session: {history_session_id}")
        history_session_ids.add(history_session_id)
        require_string(entry.get("competency_id"), f"profile.progress_history[{index}].competency_id")
        if entry.get("outcome") not in OUTCOMES:
            fail(f"profile.progress_history[{index}].outcome is invalid")
        validate_result_summary(entry.get("result_summary"), f"profile.progress_history[{index}].result_summary")
        entry_gaps = require_string_list(entry.get("gaps"), f"profile.progress_history[{index}].gaps")
        if len(entry_gaps) > 3:
            fail(f"profile.progress_history[{index}].gaps must contain at most three items")
        require_string(entry.get("completed_at"), f"profile.progress_history[{index}].completed_at")
    next_action = profile.get("next_action")
    if next_action is not None:
        if not isinstance(next_action, dict):
            fail("profile.next_action must be null or an object")
        if next_action.get("type") not in NEXT_ACTIONS:
            fail("profile.next_action.type is invalid")
        require_string(next_action.get("reason"), "profile.next_action.reason")


def validate_result_summary(value: Any, field: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        fail(f"{field} must be an object")
    if set(value) != RESULT_GROUPS:
        fail(f"{field} must contain exactly: {sorted(RESULT_GROUPS)}")
    for group in sorted(RESULT_GROUPS):
        require_string_list(value.get(group), f"{field}.{group}")
    return value


def validate_session(session: dict[str, Any], case: dict[str, Any], case_path: Path, profile: dict[str, Any] | None) -> None:
    if session.get("schema_version") != "learning-session/v1":
        fail("session.schema_version must equal learning-session/v1")
    session_id = require_string(session.get("session_id"), "session.session_id")
    if not SESSION_ID.fullmatch(session_id):
        fail("session.session_id must be kebab-case")
    if session.get("case_id") != case.get("case_id"):
        fail("session.case_id does not match case.case_id")
    session_case_path = require_string(session.get("case_path"), "session.case_path")
    if Path(session_case_path).resolve() != case_path.resolve():
        fail("session.case_path does not match the validated case path")
    if session.get("case_checksum") != checksum(case_path):
        fail("session.case_checksum does not match the current case; case integrity is broken")
    if session.get("status") not in SESSION_STATUSES:
        fail("session.status is invalid")

    boundary = session.get("boundary")
    if not isinstance(boundary, dict) or not isinstance(boundary.get("accepted"), bool):
        fail("session.boundary.accepted must be boolean")
    if boundary["accepted"] and not boundary.get("accepted_at"):
        fail("accepted boundary requires boundary.accepted_at")

    case_judgments = {item["id"] for item in case["protected_judgments"]}
    judgments = require_list(session.get("protected_judgments"), "session.protected_judgments")
    session_judgments = unique_ids(judgments, "session.protected_judgments")
    if session_judgments != case_judgments:
        fail("session protected judgments must exactly match the case")

    material_judgments: set[str] = set()
    pre_attempt_material_judgments: set[str] = set()
    assistance_ids: set[str] = set()
    for index, item in enumerate(require_list(session.get("assistance"), "session.assistance")):
        if not isinstance(item, dict):
            fail(f"session.assistance[{index}] must be an object")
        assistance_id = require_string(item.get("id"), f"session.assistance[{index}].id")
        if assistance_id in assistance_ids:
            fail(f"duplicate assistance id: {assistance_id}")
        assistance_ids.add(assistance_id)
        judgment_id = item.get("judgment_id")
        if judgment_id not in case_judgments:
            fail(f"session.assistance[{index}] references unknown judgment")
        if item.get("level") not in {1, 2, 3, 4, 5, 6}:
            fail(f"session.assistance[{index}].level must be 1..6")
        if not isinstance(item.get("material"), bool) or not isinstance(item.get("before_first_attempt"), bool):
            fail(f"session.assistance[{index}] material flags must be boolean")
        if item["level"] >= 4 and not item["material"]:
            fail(f"session.assistance[{index}] level 4..6 must be material")
        if item["material"]:
            material_judgments.add(judgment_id)
            if item["before_first_attempt"]:
                pre_attempt_material_judgments.add(judgment_id)

    for index, judgment in enumerate(judgments):
        judgment_id = judgment["id"]
        status = judgment.get("status")
        if status not in JUDGMENT_STATUSES:
            fail(f"session.protected_judgments[{index}].status is invalid")
        first_attempt = judgment.get("first_attempt")
        revisions = require_list(judgment.get("revisions"), f"session.protected_judgments[{index}].revisions")
        if status == "open" and (first_attempt is not None or revisions):
            fail(f"open judgment {judgment_id} cannot contain attempts or revisions")
        if status in {"first-attempt-recorded", "under-review", "independently-revised", "assessment-closed"}:
            if not isinstance(first_attempt, dict):
                fail(f"judgment {judgment_id} status {status} requires first_attempt")
            if first_attempt.get("independent") is not True:
                fail(f"judgment {judgment_id} first_attempt must be independent")
        if judgment_id in pre_attempt_material_judgments and first_attempt is not None:
            fail(f"judgment {judgment_id} cannot record a first_attempt after prior material assistance")
        if judgment_id in material_judgments and status not in {"assisted", "assessment-frozen"}:
            fail(f"judgment {judgment_id} received material assistance but status is {status}")
        if status == "independently-revised" and not revisions:
            fail(f"judgment {judgment_id} independently-revised requires a revision")

    if not boundary["accepted"]:
        if session.get("status") != "boundary-pending":
            fail("unaccepted boundary requires boundary-pending session status")
        if any(item.get("status") != "open" for item in judgments):
            fail("judgments cannot advance before boundary acceptance")

    fact_ids = {item["id"] for item in case["facts"]}
    discovered = require_list(session.get("discovered_fact_ids"), "session.discovered_fact_ids")
    if len(discovered) != len(set(discovered)) or set(discovered) - fact_ids:
        fail("session.discovered_fact_ids contains duplicate or unknown facts")
    event_ids = {item["id"] for item in case["future_events"]}
    released = require_list(session.get("released_event_ids"), "session.released_event_ids")
    if len(released) != len(set(released)) or set(released) - event_ids:
        fail("session.released_event_ids contains duplicate or unknown events")
    require_list(session.get("system_evidence"), "session.system_evidence")
    require_list(session.get("history"), "session.history")

    assessment = session.get("assessment")
    if not isinstance(assessment, dict):
        fail("session.assessment must be an object")
    outcome = assessment.get("outcome")
    result_summary = validate_result_summary(assessment.get("result_summary"), "session.assessment.result_summary")
    gaps = require_string_list(assessment.get("gaps"), "session.assessment.gaps")
    if len(gaps) > 3:
        fail("session.assessment.gaps must contain at most three items")
    disputes = require_list(assessment.get("disputes"), "session.assessment.disputes")
    unresolved_disputes = []
    for index, dispute in enumerate(disputes):
        if not isinstance(dispute, dict):
            fail(f"session.assessment.disputes[{index}] must be an object")
        if dispute.get("status") not in {"open", "resolved"}:
            fail(f"session.assessment.disputes[{index}].status is invalid")
        require_string(dispute.get("reason"), f"session.assessment.disputes[{index}].reason")
        if dispute["status"] == "open":
            unresolved_disputes.append(dispute)
    dimensions = require_list(assessment.get("dimensions"), "session.assessment.dimensions")
    rubric_ids = {item["id"] for item in case["rubric"]}
    if dimensions:
        dimension_ids = unique_ids(dimensions, "session.assessment.dimensions")
        if dimension_ids - rubric_ids:
            fail("session assessment references unknown rubric dimensions")
        for index, dimension in enumerate(dimensions):
            if dimension.get("rating") not in RATINGS:
                fail(f"session.assessment.dimensions[{index}].rating is invalid")
            if dimension.get("independence") not in INDEPENDENCE:
                fail(f"session.assessment.dimensions[{index}].independence is invalid")
            require_string(dimension.get("limitation"), f"session.assessment.dimensions[{index}].limitation")

    if outcome is not None and outcome not in OUTCOMES:
        fail("session.assessment.outcome is invalid")
    if outcome == "independent-success":
        if material_judgments:
            fail("independent-success is impossible after material assistance")
        if any(item.get("status") != "assessment-closed" for item in judgments):
            fail("independent-success requires every judgment to be assessment-closed")
        if any(item.get("independence") != "independent" or item.get("rating") != "demonstrated" for item in dimensions):
            fail("independent-success requires demonstrated independent rubric dimensions")
        if {item["id"] for item in dimensions} != rubric_ids:
            fail("independent-success requires every rubric dimension")

    if session.get("status") == "completed":
        if outcome not in OUTCOMES:
            fail("completed session requires an assessment outcome")
        if any(item.get("status") not in TERMINAL_JUDGMENT_STATUSES for item in judgments):
            fail("completed session requires every judgment to be terminal")
        next_action = assessment.get("next_action")
        if not isinstance(next_action, dict) or next_action.get("type") not in NEXT_ACTIONS:
            fail("completed session requires a valid assessment.next_action")
        require_string(next_action.get("reason"), "session.assessment.next_action.reason")
        if not any(result_summary.values()):
            fail("completed session requires a non-empty assessment.result_summary")
        if unresolved_disputes:
            if outcome != "inconclusive":
                fail("completed session with an open dispute must be inconclusive")
            if next_action.get("type") in PROGRESSION_ACTIONS:
                fail("open dispute cannot produce a progression next action")

    if profile is not None:
        active_session = profile.get("active_session_id")
        if session.get("status") == "completed" and active_session == session_id:
            fail("completed session must be cleared from profile.active_session_id")
        if session.get("status") != "completed" and active_session != session_id:
            fail("profile.active_session_id must reference the active session")
        if session.get("status") == "completed":
            history_entries = [item for item in profile["progress_history"] if item.get("session_id") == session_id]
            if len(history_entries) != 1:
                fail("completed session requires exactly one matching profile.progress_history entry")
            history_entry = history_entries[0]
            if history_entry.get("competency_id") != session["active_competency"].get("id"):
                fail("progress history competency does not match the completed session")
            if history_entry.get("outcome") != outcome:
                fail("progress history outcome does not match the completed session")
            if history_entry.get("result_summary") != result_summary:
                fail("progress history result_summary does not match the completed session")
            if history_entry.get("gaps") != gaps:
                fail("progress history gaps do not match the completed session")
            if profile.get("current_gaps") != gaps:
                fail("profile.current_gaps must match the latest completed session gaps")
            if profile.get("next_action") != assessment.get("next_action"):
                fail("profile.next_action must match the completed session assessment")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=Path)
    parser.add_argument("--case", type=Path)
    parser.add_argument("--profile", type=Path)
    args = parser.parse_args()

    try:
        value = load_json(args.path)
        schema = value.get("schema_version")
        if schema == "learning-case/v1":
            validate_case(value)
        elif schema == "learning-profile/v1":
            validate_profile(value)
        elif schema == "learning-session/v1":
            if args.case is None:
                fail("--case is required when validating a session")
            case = load_json(args.case)
            validate_case(case)
            profile = load_json(args.profile) if args.profile else None
            if profile is not None:
                validate_profile(profile)
            validate_session(value, case, args.case, profile)
        else:
            fail(f"unsupported schema_version: {schema}")
    except ValidationError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(f"OK: {args.path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
