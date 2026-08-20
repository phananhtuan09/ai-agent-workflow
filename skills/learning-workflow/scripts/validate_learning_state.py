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
CONFIDENCE_LEVELS = {"low", "medium", "high"}
EVIDENCE_REQUEST_STATUSES = {"authorized", "completed", "blocked"}
DECISION_CHANGES = {"kept", "revised", "rejected", "unknown"}
DISPUTE_CATEGORIES = {"fact", "rubric-mapping", "attribution", "interpretation"}
PROJECT_STATUSES = {"draft", "active", "completed"}
SCHEDULE_STATUSES = {"draft", "active", "completed"}
WEEK_STATUSES = {"planned", "in-progress", "completed"}


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


def require_boolean(value: Any, field: str) -> bool:
    if not isinstance(value, bool):
        fail(f"{field} must be boolean")
    return value


def require_object(value: Any, field: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        fail(f"{field} must be an object")
    return value


def require_record_id(value: Any, field: str, prefix: str) -> str:
    record_id = require_string(value, field)
    if not re.fullmatch(rf"^{re.escape(prefix)}-\d{{3}}$", record_id):
        fail(f"{field} has invalid format: {record_id}")
    return record_id


def validate_attempt(value: Any, field: str) -> str:
    attempt = require_object(value, field)
    attempt_id = require_record_id(attempt.get("id"), f"{field}.id", "AT")
    require_string(attempt.get("summary"), f"{field}.summary")
    require_string(attempt.get("reasoning"), f"{field}.reasoning")
    require_boolean(attempt.get("independent"), f"{field}.independent")
    require_string(attempt.get("recorded_at"), f"{field}.recorded_at")
    observation_fields = ["assumptions", "constraints", "invariants", "risks", "predictions", "tradeoffs"]
    observations = []
    for name in observation_fields:
        observations.extend(require_string_list(attempt.get(name), f"{field}.{name}"))
    if not observations:
        fail(f"{field} must record at least one assumption, constraint, invariant, risk, prediction, or tradeoff")
    return attempt_id


def validate_revision(value: Any, field: str) -> str:
    revision = require_object(value, field)
    revision_id = require_record_id(revision.get("id"), f"{field}.id", "RV")
    require_string(revision.get("summary"), f"{field}.summary")
    require_string(revision.get("reason"), f"{field}.reason")
    require_string_list(revision.get("evidence_refs"), f"{field}.evidence_refs", allow_empty=False)
    require_string(revision.get("recorded_at"), f"{field}.recorded_at")
    return revision_id


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
    provenance = require_object(case.get("provenance"), "case.provenance")
    if provenance.get("kind") not in {"simulation", "external-source", "maintained-system", "composite"}:
        fail("case.provenance.kind is invalid")
    require_string(provenance.get("statement"), "case.provenance.statement")
    require_string_list(provenance.get("external_sources"), "case.provenance.external_sources")
    require_string_list(case.get("assumptions"), "case.assumptions")
    case_history = require_list(case.get("case_history"), "case.case_history")
    if not case_history:
        fail("case.case_history must not be empty")
    for index, entry in enumerate(case_history):
        entry = require_object(entry, f"case.case_history[{index}]")
        if not isinstance(entry.get("version"), int) or entry["version"] < 1:
            fail(f"case.case_history[{index}].version must be a positive integer")
        require_string(entry.get("change"), f"case.case_history[{index}].change")
    learning_context = require_object(case.get("learning_context"), "case.learning_context")
    require_string(learning_context.get("project_id"), "case.learning_context.project_id")
    minimum_project_version = learning_context.get("minimum_project_version")
    if not isinstance(minimum_project_version, int) or minimum_project_version < 1:
        fail("case.learning_context.minimum_project_version must be a positive integer")
    schedule_weeks = require_list(learning_context.get("schedule_weeks"), "case.learning_context.schedule_weeks")
    if not schedule_weeks or any(not isinstance(item, int) or item < 1 for item in schedule_weeks):
        fail("case.learning_context.schedule_weeks must contain positive integers")
    if len(schedule_weeks) != len(set(schedule_weeks)):
        fail("case.learning_context.schedule_weeks must not contain duplicates")
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


def validate_project(project: dict[str, Any]) -> None:
    if project.get("schema_version") != "learning-project/v1":
        fail("project.schema_version must equal learning-project/v1")
    require_string(project.get("project_id"), "project.project_id")
    require_string(project.get("title"), "project.title")
    if project.get("status") not in PROJECT_STATUSES:
        fail("project.status is invalid")
    if project["status"] != "draft" and not project.get("accepted_at"):
        fail("active or completed project requires accepted_at")
    version = project.get("version")
    if not isinstance(version, int) or version < 1:
        fail("project.version must be a positive integer")

    domain = require_object(project.get("domain"), "project.domain")
    require_string(domain.get("name"), "project.domain.name")
    require_string(domain.get("summary"), "project.domain.summary")
    product = require_object(project.get("product"), "project.product")
    require_string(product.get("goal"), "project.product.goal")
    require_string_list(product.get("primary_actors"), "project.product.primary_actors", allow_empty=False)
    require_string_list(product.get("base_capabilities"), "project.product.base_capabilities", allow_empty=False)

    architecture = require_object(project.get("architecture_baseline"), "project.architecture_baseline")
    require_string(architecture.get("summary"), "project.architecture_baseline.summary")
    require_string(architecture.get("application_shape"), "project.architecture_baseline.application_shape")
    require_string_list(architecture.get("components"), "project.architecture_baseline.components", allow_empty=False)
    require_string_list(architecture.get("data_stores"), "project.architecture_baseline.data_stores", allow_empty=False)
    require_string_list(architecture.get("external_integrations"), "project.architecture_baseline.external_integrations")
    require_string(architecture.get("deployment"), "project.architecture_baseline.deployment")

    require_string_list(project.get("base_business_rules"), "project.base_business_rules", allow_empty=False)
    require_string_list(project.get("base_constraints"), "project.base_constraints", allow_empty=False)
    current_state = require_object(project.get("current_state"), "project.current_state")
    require_string_list(current_state.get("accepted_decisions"), "project.current_state.accepted_decisions")
    require_string_list(current_state.get("delivered_capabilities"), "project.current_state.delivered_capabilities")
    require_string_list(current_state.get("active_constraints"), "project.current_state.active_constraints")

    history = require_list(project.get("evolution_history"), "project.evolution_history")
    if len(history) != version:
        fail("project.evolution_history must contain exactly one entry per version")
    for index, entry in enumerate(history):
        entry = require_object(entry, f"project.evolution_history[{index}]")
        if entry.get("version") != index + 1:
            fail("project.evolution_history versions must be sequential")
        session_id = entry.get("session_id")
        if session_id is not None:
            require_string(session_id, f"project.evolution_history[{index}].session_id")
        require_string(entry.get("summary"), f"project.evolution_history[{index}].summary")
        require_string_list(entry.get("decisions"), f"project.evolution_history[{index}].decisions")
        require_string_list(entry.get("delivered_capabilities"), f"project.evolution_history[{index}].delivered_capabilities")
        require_string_list(entry.get("active_constraints"), f"project.evolution_history[{index}].active_constraints")
        if index > 0 or project["status"] != "draft":
            require_string(entry.get("accepted_at"), f"project.evolution_history[{index}].accepted_at")


def validate_schedule(schedule: dict[str, Any], project: dict[str, Any] | None = None) -> None:
    if schedule.get("schema_version") != "learning-schedule/v1":
        fail("schedule.schema_version must equal learning-schedule/v1")
    require_string(schedule.get("schedule_id"), "schedule.schedule_id")
    project_id = require_string(schedule.get("project_id"), "schedule.project_id")
    if project is not None and project_id != project.get("project_id"):
        fail("schedule.project_id must match project.project_id")
    if schedule.get("status") not in SCHEDULE_STATUSES:
        fail("schedule.status is invalid")
    if schedule["status"] != "draft":
        require_string(schedule.get("accepted_at"), "schedule.accepted_at")
        require_string(schedule.get("started_at"), "schedule.started_at")
    horizon = schedule.get("horizon_weeks")
    sessions_per_week = schedule.get("sessions_per_week")
    recalibration = schedule.get("recalibration_every_weeks")
    current_week = schedule.get("current_week")
    if not isinstance(horizon, int) or horizon < 1:
        fail("schedule.horizon_weeks must be a positive integer")
    if not isinstance(sessions_per_week, int) or sessions_per_week < 1:
        fail("schedule.sessions_per_week must be a positive integer")
    if not isinstance(recalibration, int) or recalibration < 1:
        fail("schedule.recalibration_every_weeks must be a positive integer")
    if not isinstance(current_week, int) or current_week < 1 or current_week > horizon:
        fail("schedule.current_week must be within the schedule horizon")

    weeks = require_list(schedule.get("weeks"), "schedule.weeks")
    if len(weeks) != horizon:
        fail("schedule.weeks must contain exactly horizon_weeks entries")
    all_session_ids: set[str] = set()
    for index, week in enumerate(weeks):
        week = require_object(week, f"schedule.weeks[{index}]")
        week_number = index + 1
        if week.get("week") != week_number:
            fail("schedule week numbers must be sequential")
        require_string(week.get("theme"), f"schedule.weeks[{index}].theme")
        require_string_list(week.get("competency_focus"), f"schedule.weeks[{index}].competency_focus", allow_empty=False)
        require_string(week.get("project_focus"), f"schedule.weeks[{index}].project_focus")
        if week.get("status") not in WEEK_STATUSES:
            fail(f"schedule.weeks[{index}].status is invalid")
        session_ids = require_string_list(week.get("completed_session_ids"), f"schedule.weeks[{index}].completed_session_ids")
        if len(session_ids) != len(set(session_ids)):
            fail(f"schedule.weeks[{index}] contains duplicate session IDs")
        if all_session_ids & set(session_ids):
            fail("a completed session may appear in only one schedule week")
        all_session_ids.update(session_ids)
        require_string_list(week.get("evidence_refs"), f"schedule.weeks[{index}].evidence_refs")
        adjustments = require_list(week.get("adjustments"), f"schedule.weeks[{index}].adjustments")
        for adjustment_index, adjustment in enumerate(adjustments):
            adjustment = require_object(adjustment, f"schedule.weeks[{index}].adjustments[{adjustment_index}]")
            require_string(adjustment.get("session_id"), f"schedule.weeks[{index}].adjustments[{adjustment_index}].session_id")
            require_string(adjustment.get("reason"), f"schedule.weeks[{index}].adjustments[{adjustment_index}].reason")
            require_string(adjustment.get("recorded_at"), f"schedule.weeks[{index}].adjustments[{adjustment_index}].recorded_at")

        if schedule["status"] == "draft" and week["status"] != "planned":
            fail("draft schedule weeks must all be planned")
        if schedule["status"] == "active":
            expected = "completed" if week_number < current_week else "in-progress" if week_number == current_week else "planned"
            if week["status"] != expected:
                fail(f"schedule week {week_number} must be {expected}")
        if schedule["status"] == "completed" and week["status"] != "completed":
            fail("completed schedule requires every week to be completed")

    revisions = require_list(schedule.get("revision_history"), "schedule.revision_history")
    for index, revision in enumerate(revisions):
        revision = require_object(revision, f"schedule.revision_history[{index}]")
        require_string(revision.get("reason"), f"schedule.revision_history[{index}].reason")
        effective_week = revision.get("effective_week")
        if not isinstance(effective_week, int) or effective_week < 1 or effective_week > horizon:
            fail(f"schedule.revision_history[{index}].effective_week is invalid")
        updates = require_list(revision.get("updates"), f"schedule.revision_history[{index}].updates")
        if not updates:
            fail(f"schedule.revision_history[{index}].updates must not be empty")
        for update_index, update in enumerate(updates):
            update = require_object(update, f"schedule.revision_history[{index}].updates[{update_index}]")
            week_number = update.get("week")
            if not isinstance(week_number, int) or week_number < effective_week or week_number > horizon:
                fail(f"schedule.revision_history[{index}].updates[{update_index}].week is invalid")
        require_string(revision.get("accepted_at"), f"schedule.revision_history[{index}].accepted_at")


def validate_profile(profile: dict[str, Any]) -> None:
    if profile.get("schema_version") != "learning-profile/v1":
        fail("profile.schema_version must equal learning-profile/v1")
    require_string(profile.get("project_id"), "profile.project_id")
    require_string(profile.get("schedule_id"), "profile.schedule_id")
    schedule_week = profile.get("schedule_week")
    if not isinstance(schedule_week, int) or schedule_week < 1:
        fail("profile.schedule_week must be a positive integer")
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
    require_string_list(baseline.get("prerequisites"), "profile.baseline.prerequisites")
    require_string_list(baseline.get("strengths"), "profile.baseline.strengths")
    if baseline.get("independence") not in {"unknown", "dependent", "assisted", "independent"}:
        fail("profile.baseline.independence is invalid")
    require_string(baseline.get("recorded_at"), "profile.baseline.recorded_at")
    competencies = require_list(profile.get("competencies"), "profile.competencies")
    competency_ids: set[str] = set()
    for index, competency in enumerate(competencies):
        if not isinstance(competency, dict):
            fail(f"profile.competencies[{index}] must be an object")
        competency_id = require_string(competency.get("id"), f"profile.competencies[{index}].id")
        if competency_id in competency_ids:
            fail(f"duplicate profile competency: {competency_id}")
        competency_ids.add(competency_id)
        require_string(competency.get("name"), f"profile.competencies[{index}].name")
        if competency.get("latest_outcome") not in OUTCOMES:
            fail(f"profile.competencies[{index}].latest_outcome is invalid")
        if competency.get("independence") not in INDEPENDENCE:
            fail(f"profile.competencies[{index}].independence is invalid")
        require_string(competency.get("last_session_id"), f"profile.competencies[{index}].last_session_id")
        require_string(competency.get("updated_at"), f"profile.competencies[{index}].updated_at")
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
    if profile.get("cadence") != "schedule-driven":
        fail("profile.cadence must equal schedule-driven for MVP")


def validate_result_summary(value: Any, field: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        fail(f"{field} must be an object")
    if set(value) != RESULT_GROUPS:
        fail(f"{field} must contain exactly: {sorted(RESULT_GROUPS)}")
    for group in sorted(RESULT_GROUPS):
        require_string_list(value.get(group), f"{field}.{group}")
    return value


def validate_session(
    session: dict[str, Any],
    case: dict[str, Any],
    case_path: Path,
    profile: dict[str, Any] | None,
    project: dict[str, Any] | None = None,
    schedule: dict[str, Any] | None = None,
) -> None:
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
    if not case_path.resolve().parent.as_posix().endswith("/docs/ai/learning/cases"):
        fail("active sessions must bind a durable case under docs/ai/learning/cases")
    if session.get("case_checksum") != checksum(case_path):
        fail("session.case_checksum does not match the current case; case integrity is broken")
    if session.get("status") not in SESSION_STATUSES:
        fail("session.status is invalid")
    require_string(session.get("started_at"), "session.started_at")
    require_string(session.get("updated_at"), "session.updated_at")
    if session.get("active_competency") != case.get("active_competency"):
        fail("session.active_competency must exactly match the case")

    learning_context = require_object(session.get("learning_context"), "session.learning_context")
    project_id = require_string(learning_context.get("project_id"), "session.learning_context.project_id")
    project_version = learning_context.get("project_version")
    if not isinstance(project_version, int) or project_version < 1:
        fail("session.learning_context.project_version must be a positive integer")
    schedule_id = require_string(learning_context.get("schedule_id"), "session.learning_context.schedule_id")
    schedule_week = learning_context.get("schedule_week")
    if not isinstance(schedule_week, int) or schedule_week < 1:
        fail("session.learning_context.schedule_week must be a positive integer")
    project_snapshot = require_object(learning_context.get("project_snapshot"), "session.learning_context.project_snapshot")
    require_string(project_snapshot.get("title"), "session.learning_context.project_snapshot.title")
    require_string(project_snapshot.get("domain"), "session.learning_context.project_snapshot.domain")
    require_string(project_snapshot.get("product_goal"), "session.learning_context.project_snapshot.product_goal")
    require_string(project_snapshot.get("architecture_baseline"), "session.learning_context.project_snapshot.architecture_baseline")
    weekly_plan = require_object(learning_context.get("weekly_plan"), "session.learning_context.weekly_plan")
    require_string(weekly_plan.get("theme"), "session.learning_context.weekly_plan.theme")
    require_string_list(weekly_plan.get("competency_focus"), "session.learning_context.weekly_plan.competency_focus", allow_empty=False)
    require_string(weekly_plan.get("project_focus"), "session.learning_context.weekly_plan.project_focus")

    case_context = require_object(case.get("learning_context"), "case.learning_context")
    if case_context.get("project_id") != project_id:
        fail("case.learning_context.project_id must match the session project")
    if project_version < case_context.get("minimum_project_version", 1):
        fail("session project version is older than the case requirement")
    aligned_weeks = require_list(case_context.get("schedule_weeks"), "case.learning_context.schedule_weeks")
    if schedule_week not in aligned_weeks:
        fail("case is not aligned with the session schedule week")

    if project is not None:
        validate_project(project)
        if session.get("status") != "completed" and project.get("status") != "active":
            fail("active session requires an active learning project")
        if session.get("status") == "completed" and project.get("status") not in {"active", "completed"}:
            fail("completed session requires an accepted learning project")
        if project_id != project.get("project_id"):
            fail("session learning context does not match the active project")
        if session.get("status") != "completed" and project_version != project.get("version"):
            fail("active session must use the current project version")
        if session.get("status") == "completed" and project_version > project.get("version"):
            fail("completed session references a future project version")
    if schedule is not None:
        validate_schedule(schedule, project)
        if session.get("status") != "completed" and schedule.get("status") != "active":
            fail("active session requires an active learning schedule")
        if session.get("status") == "completed" and schedule.get("status") not in {"active", "completed"}:
            fail("completed session requires an accepted learning schedule")
        if schedule_id != schedule.get("schedule_id"):
            fail("session learning context does not match the active schedule")
        if session.get("status") != "completed" and schedule_week != schedule.get("current_week"):
            fail("active session must use the current schedule week")
        if session.get("status") == "completed":
            recorded_sessions = schedule["weeks"][schedule_week - 1]["completed_session_ids"]
            if session_id not in recorded_sessions:
                fail("completed session must be recorded in its schedule week")

    boundary = session.get("boundary")
    if not isinstance(boundary, dict) or not isinstance(boundary.get("accepted"), bool):
        fail("session.boundary.accepted must be boolean")
    if boundary["accepted"] and not boundary.get("accepted_at"):
        fail("accepted boundary requires boundary.accepted_at")
    if boundary["accepted"] and session.get("status") == "boundary-pending":
        fail("accepted boundary cannot remain boundary-pending")
    if boundary.get("scope") != "case":
        fail("session.boundary.scope must equal case for MVP")
    require_string(boundary.get("ai_authority"), "session.boundary.ai_authority")

    case_judgments = {item["id"] for item in case["protected_judgments"]}
    boundary_judgments = set(require_string_list(
        boundary.get("protected_judgment_ids"),
        "session.boundary.protected_judgment_ids",
        allow_empty=False,
    ))
    if boundary_judgments != case_judgments:
        fail("session.boundary.protected_judgment_ids must exactly match the case")
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
        assistance_id = require_record_id(item.get("id"), f"session.assistance[{index}].id", "AS")
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
        require_string(item.get("kind"), f"session.assistance[{index}].kind")
        require_string(item.get("content"), f"session.assistance[{index}].content")
        require_string(item.get("impact"), f"session.assistance[{index}].impact")
        require_string(item.get("recorded_at"), f"session.assistance[{index}].recorded_at")
        if item["level"] >= 4 and not item["material"]:
            fail(f"session.assistance[{index}] level 4..6 must be material")
        if item["material"]:
            require_string(item.get("material_reason"), f"session.assistance[{index}].material_reason")
        if item["level"] == 6 and item.get("judgment_status_before") not in {"assessment-closed", "assessment-frozen"}:
            fail(f"session.assistance[{index}] level 6 requires a previously closed or frozen judgment")
        if item["material"]:
            material_judgments.add(judgment_id)
            if item["before_first_attempt"]:
                pre_attempt_material_judgments.add(judgment_id)

    attempt_ids: set[str] = set()
    revision_ids: set[str] = set()
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
            attempt_id = validate_attempt(first_attempt, f"session.protected_judgments[{index}].first_attempt")
            if attempt_id in attempt_ids:
                fail(f"duplicate attempt id: {attempt_id}")
            attempt_ids.add(attempt_id)
            if first_attempt.get("independent") is not True:
                fail(f"judgment {judgment_id} first_attempt must be independent")
        elif first_attempt is not None:
            attempt_id = validate_attempt(first_attempt, f"session.protected_judgments[{index}].first_attempt")
            if attempt_id in attempt_ids:
                fail(f"duplicate attempt id: {attempt_id}")
            attempt_ids.add(attempt_id)
        for revision_index, revision in enumerate(revisions):
            revision_id = validate_revision(
                revision,
                f"session.protected_judgments[{index}].revisions[{revision_index}]",
            )
            if revision_id in revision_ids:
                fail(f"duplicate revision id: {revision_id}")
            revision_ids.add(revision_id)
        if judgment_id in pre_attempt_material_judgments and first_attempt is not None:
            fail(f"judgment {judgment_id} cannot record a first_attempt after prior material assistance")
        if judgment_id in material_judgments and status not in {"assisted", "assessment-frozen"}:
            fail(f"judgment {judgment_id} received material assistance but status is {status}")
        if status == "independently-revised" and not revisions:
            fail(f"judgment {judgment_id} independently-revised requires a revision")
        if status in TERMINAL_JUDGMENT_STATUSES and not judgment.get("closed_at"):
            fail(f"terminal judgment {judgment_id} requires closed_at")

    if not boundary["accepted"]:
        if session.get("status") != "boundary-pending":
            fail("unaccepted boundary requires boundary-pending session status")
        if any(item.get("status") != "open" for item in judgments):
            fail("judgments cannot advance before boundary acceptance")

    facts_by_id = {item["id"]: item for item in case["facts"]}
    fact_ids = set(facts_by_id)
    public_fact_ids = {item["id"] for item in case["facts"] if item["visibility"] == "public"}
    discovered = require_list(session.get("discovered_fact_ids"), "session.discovered_fact_ids")
    if len(discovered) != len(set(discovered)) or set(discovered) - fact_ids:
        fail("session.discovered_fact_ids contains duplicate or unknown facts")
    discovery_records = require_list(session.get("discovery_records"), "session.discovery_records")
    discovery_record_ids: set[str] = set()
    recorded_fact_ids: set[str] = set()
    for index, record in enumerate(discovery_records):
        record = require_object(record, f"session.discovery_records[{index}]")
        record_id = require_record_id(record.get("id"), f"session.discovery_records[{index}].id", "DR")
        if record_id in discovery_record_ids:
            fail(f"duplicate discovery record id: {record_id}")
        discovery_record_ids.add(record_id)
        require_string(record.get("question"), f"session.discovery_records[{index}].question")
        matched_path = require_string(record.get("matched_discovery_path"), f"session.discovery_records[{index}].matched_discovery_path")
        record_fact_ids = set(require_string_list(
            record.get("fact_ids"),
            f"session.discovery_records[{index}].fact_ids",
            allow_empty=False,
        ))
        if record_fact_ids - fact_ids:
            fail(f"session.discovery_records[{index}] references unknown facts")
        if record_fact_ids & recorded_fact_ids:
            fail(f"session.discovery_records[{index}] repeats an already discovered fact")
        for fact_id in record_fact_ids:
            fact = facts_by_id[fact_id]
            if fact["visibility"] != "discoverable":
                fail(f"session.discovery_records[{index}] may only record discoverable facts")
            if matched_path not in fact["discovery_paths"]:
                fail(f"session.discovery_records[{index}] path does not match fact {fact_id}")
        recorded_fact_ids.update(record_fact_ids)
        require_string(record.get("recorded_at"), f"session.discovery_records[{index}].recorded_at")
    if set(discovered) != public_fact_ids | recorded_fact_ids:
        fail("session.discovered_fact_ids must equal public facts plus discovery records")

    event_ids = {item["id"] for item in case["future_events"]}
    released = require_list(session.get("released_event_ids"), "session.released_event_ids")
    if len(released) != len(set(released)) or set(released) - event_ids:
        fail("session.released_event_ids contains duplicate or unknown events")
    event_records = require_list(session.get("event_release_records"), "session.event_release_records")
    event_record_ids: set[str] = set()
    recorded_event_ids: set[str] = set()
    for index, record in enumerate(event_records):
        record = require_object(record, f"session.event_release_records[{index}]")
        record_id = require_record_id(record.get("id"), f"session.event_release_records[{index}].id", "ERL")
        if record_id in event_record_ids:
            fail(f"duplicate event release record id: {record_id}")
        event_record_ids.add(record_id)
        event_id = require_string(record.get("event_id"), f"session.event_release_records[{index}].event_id")
        if event_id not in event_ids:
            fail(f"session.event_release_records[{index}] references unknown event")
        if event_id in recorded_event_ids:
            fail(f"event released more than once: {event_id}")
        recorded_event_ids.add(event_id)
        require_string_list(record.get("trigger_evidence"), f"session.event_release_records[{index}].trigger_evidence", allow_empty=False)
        require_string(record.get("released_at"), f"session.event_release_records[{index}].released_at")
    if set(released) != recorded_event_ids:
        fail("session.released_event_ids must match event_release_records")

    evidence_requests = require_list(session.get("evidence_requests"), "session.evidence_requests")
    evidence_request_ids: set[str] = set()
    evidence_requests_by_id: dict[str, dict[str, Any]] = {}
    for index, request in enumerate(evidence_requests):
        request = require_object(request, f"session.evidence_requests[{index}]")
        request_id = require_record_id(request.get("id"), f"session.evidence_requests[{index}].id", "ER")
        if request_id in evidence_request_ids:
            fail(f"duplicate evidence request id: {request_id}")
        evidence_request_ids.add(request_id)
        evidence_requests_by_id[request_id] = request
        if request.get("judgment_id") not in case_judgments:
            fail(f"session.evidence_requests[{index}] references unknown judgment")
        require_string(request.get("decision_or_assumption"), f"session.evidence_requests[{index}].decision_or_assumption")
        require_string(request.get("question"), f"session.evidence_requests[{index}].question")
        require_string(request.get("method"), f"session.evidence_requests[{index}].method")
        require_string(request.get("scope"), f"session.evidence_requests[{index}].scope")
        require_boolean(request.get("interpretation_protected"), f"session.evidence_requests[{index}].interpretation_protected")
        if request.get("status") not in EVIDENCE_REQUEST_STATUSES:
            fail(f"session.evidence_requests[{index}].status is invalid")
        require_string(request.get("authorized_at"), f"session.evidence_requests[{index}].authorized_at")
        if request.get("status") == "blocked":
            require_string(request.get("blocked_reason"), f"session.evidence_requests[{index}].blocked_reason")

    system_evidence = require_list(session.get("system_evidence"), "session.system_evidence")
    system_evidence_ids: set[str] = set()
    system_evidence_by_id: dict[str, dict[str, Any]] = {}
    evidence_count_by_request: dict[str, int] = {}
    for index, evidence in enumerate(system_evidence):
        evidence = require_object(evidence, f"session.system_evidence[{index}]")
        evidence_id = require_record_id(evidence.get("id"), f"session.system_evidence[{index}].id", "SE")
        if evidence_id in system_evidence_ids:
            fail(f"duplicate system evidence id: {evidence_id}")
        system_evidence_ids.add(evidence_id)
        system_evidence_by_id[evidence_id] = evidence
        request_id = require_string(evidence.get("request_id"), f"session.system_evidence[{index}].request_id")
        request = evidence_requests_by_id.get(request_id)
        if request is None:
            fail(f"session.system_evidence[{index}] references unknown request")
        if evidence.get("judgment_id") != request.get("judgment_id"):
            fail(f"session.system_evidence[{index}] judgment does not match its request")
        evidence_count_by_request[request_id] = evidence_count_by_request.get(request_id, 0) + 1
        require_string(evidence.get("question"), f"session.system_evidence[{index}].question")
        require_string(evidence.get("method"), f"session.system_evidence[{index}].method")
        require_object(evidence.get("environment"), f"session.system_evidence[{index}].environment")
        require_string_list(evidence.get("assumptions"), f"session.system_evidence[{index}].assumptions")
        require_string(evidence.get("result"), f"session.system_evidence[{index}].result")
        require_string_list(evidence.get("evidence_references"), f"session.system_evidence[{index}].evidence_references", allow_empty=False)
        require_string_list(evidence.get("limitations"), f"session.system_evidence[{index}].limitations", allow_empty=False)
        if evidence.get("confidence") not in CONFIDENCE_LEVELS:
            fail(f"session.system_evidence[{index}].confidence is invalid")
        require_string_list(evidence.get("proves"), f"session.system_evidence[{index}].proves")
        require_string_list(evidence.get("suggests"), f"session.system_evidence[{index}].suggests")
        require_string_list(evidence.get("does_not_prove"), f"session.system_evidence[{index}].does_not_prove", allow_empty=False)
        require_boolean(evidence.get("interpretation_withheld"), f"session.system_evidence[{index}].interpretation_withheld")
        require_string(evidence.get("recorded_at"), f"session.system_evidence[{index}].recorded_at")
    for request_id, request in evidence_requests_by_id.items():
        count = evidence_count_by_request.get(request_id, 0)
        if request["status"] == "completed" and count != 1:
            fail(f"completed evidence request {request_id} requires exactly one evidence package")
        if request["status"] != "completed" and count:
            fail(f"evidence request {request_id} has evidence but status is {request['status']}")

    interpretations = require_list(session.get("evidence_interpretations"), "session.evidence_interpretations")
    interpretation_ids: set[str] = set()
    interpreted_evidence_ids: set[str] = set()
    for index, interpretation in enumerate(interpretations):
        interpretation = require_object(interpretation, f"session.evidence_interpretations[{index}]")
        interpretation_id = require_record_id(interpretation.get("id"), f"session.evidence_interpretations[{index}].id", "EI")
        if interpretation_id in interpretation_ids:
            fail(f"duplicate evidence interpretation id: {interpretation_id}")
        interpretation_ids.add(interpretation_id)
        evidence_id = require_string(interpretation.get("evidence_id"), f"session.evidence_interpretations[{index}].evidence_id")
        evidence = system_evidence_by_id.get(evidence_id)
        if evidence is None:
            fail(f"session.evidence_interpretations[{index}] references unknown evidence")
        if evidence_id in interpreted_evidence_ids:
            fail(f"system evidence interpreted more than once: {evidence_id}")
        interpreted_evidence_ids.add(evidence_id)
        if interpretation.get("judgment_id") != evidence.get("judgment_id"):
            fail(f"session.evidence_interpretations[{index}] judgment does not match evidence")
        require_string(interpretation.get("summary"), f"session.evidence_interpretations[{index}].summary")
        require_string_list(interpretation.get("proves"), f"session.evidence_interpretations[{index}].proves")
        require_string_list(interpretation.get("does_not_prove"), f"session.evidence_interpretations[{index}].does_not_prove", allow_empty=False)
        if interpretation.get("decision_change") not in DECISION_CHANGES:
            fail(f"session.evidence_interpretations[{index}].decision_change is invalid")
        require_string(interpretation.get("recorded_at"), f"session.evidence_interpretations[{index}].recorded_at")
    for evidence_id, evidence in system_evidence_by_id.items():
        request = evidence_requests_by_id[evidence["request_id"]]
        if request["interpretation_protected"] and evidence_id not in interpreted_evidence_ids and session.get("status") == "completed":
            fail(f"completed session requires human interpretation for protected evidence {evidence_id}")

    history = require_list(session.get("history"), "session.history")
    for index, entry in enumerate(history):
        entry = require_object(entry, f"session.history[{index}]")
        require_string(entry.get("at"), f"session.history[{index}].at")
        require_string(entry.get("type"), f"session.history[{index}].type")
        require_string(entry.get("detail"), f"session.history[{index}].detail")

    if not boundary["accepted"]:
        if discovery_records or event_records or session.get("assistance") or evidence_requests or system_evidence or interpretations:
            fail("learning records cannot advance before boundary acceptance")

    assessment = session.get("assessment")
    if not isinstance(assessment, dict):
        fail("session.assessment must be an object")
    outcome = assessment.get("outcome")
    require_string_list(assessment.get("limitations"), "session.assessment.limitations")
    accepted_by_human = require_boolean(
        assessment.get("accepted_by_human"),
        "session.assessment.accepted_by_human",
    )
    if accepted_by_human and not assessment.get("accepted_at"):
        fail("accepted assessment requires accepted_at")
    result_summary = validate_result_summary(assessment.get("result_summary"), "session.assessment.result_summary")
    gaps = require_string_list(assessment.get("gaps"), "session.assessment.gaps")
    if len(gaps) > 3:
        fail("session.assessment.gaps must contain at most three items")
    disputes = require_list(assessment.get("disputes"), "session.assessment.disputes")
    unresolved_disputes = []
    dispute_ids: set[str] = set()
    for index, dispute in enumerate(disputes):
        if not isinstance(dispute, dict):
            fail(f"session.assessment.disputes[{index}] must be an object")
        dispute_id = require_record_id(dispute.get("id"), f"session.assessment.disputes[{index}].id", "DP")
        if dispute_id in dispute_ids:
            fail(f"duplicate dispute id: {dispute_id}")
        dispute_ids.add(dispute_id)
        if dispute.get("category") not in DISPUTE_CATEGORIES:
            fail(f"session.assessment.disputes[{index}].category is invalid")
        if dispute.get("status") not in {"open", "resolved"}:
            fail(f"session.assessment.disputes[{index}].status is invalid")
        require_string(dispute.get("reason"), f"session.assessment.disputes[{index}].reason")
        require_string(dispute.get("raised_at"), f"session.assessment.disputes[{index}].raised_at")
        if dispute["status"] == "resolved":
            require_string(dispute.get("resolution"), f"session.assessment.disputes[{index}].resolution")
        if dispute["status"] == "open":
            unresolved_disputes.append(dispute)
    dimensions = require_list(assessment.get("dimensions"), "session.assessment.dimensions")
    rubric_ids = {item["id"] for item in case["rubric"]}
    known_evidence_refs = (
        attempt_ids
        | revision_ids
        | assistance_ids
        | system_evidence_ids
        | interpretation_ids
        | event_record_ids
        | discovery_record_ids
    )
    if dimensions:
        dimension_ids = unique_ids(dimensions, "session.assessment.dimensions")
        if dimension_ids - rubric_ids:
            fail("session assessment references unknown rubric dimensions")
        for index, dimension in enumerate(dimensions):
            if dimension.get("rating") not in RATINGS:
                fail(f"session.assessment.dimensions[{index}].rating is invalid")
            if dimension.get("independence") not in INDEPENDENCE:
                fail(f"session.assessment.dimensions[{index}].independence is invalid")
            evidence_refs = set(require_string_list(
                dimension.get("evidence"),
                f"session.assessment.dimensions[{index}].evidence",
            ))
            if dimension.get("rating") in {"demonstrated", "partial"} and not evidence_refs:
                fail(f"session.assessment.dimensions[{index}] requires evidence references")
            if evidence_refs - known_evidence_refs:
                fail(f"session.assessment.dimensions[{index}] references unknown learning evidence")
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
        if {item["id"] for item in dimensions} != rubric_ids:
            fail("completed session requires every rubric dimension")
        next_action = assessment.get("next_action")
        if not isinstance(next_action, dict) or next_action.get("type") not in NEXT_ACTIONS:
            fail("completed session requires a valid assessment.next_action")
        require_string(next_action.get("reason"), "session.assessment.next_action.reason")
        if not any(result_summary.values()):
            fail("completed session requires a non-empty assessment.result_summary")
        if assessment.get("accepted_by_human") is not True or not assessment.get("accepted_at"):
            fail("completed session requires a human-accepted assessment")
        if unresolved_disputes:
            if outcome != "inconclusive":
                fail("completed session with an open dispute must be inconclusive")
            if next_action.get("type") in PROGRESSION_ACTIONS:
                fail("open dispute cannot produce a progression next action")

    if profile is not None:
        if profile.get("project_id") != project_id or profile.get("schedule_id") != schedule_id:
            fail("profile learning context must match the session")
        if session.get("status") != "completed" and profile.get("schedule_week") != schedule_week:
            fail("profile.schedule_week must match the active session")
        if schedule is not None and profile.get("schedule_week") != schedule.get("current_week"):
            fail("profile.schedule_week must match the active schedule")
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
            competency_entries = [
                item for item in profile["competencies"]
                if item.get("id") == session["active_competency"].get("id")
            ]
            if len(competency_entries) != 1:
                fail("completed session requires exactly one matching profile competency entry")
            competency_entry = competency_entries[0]
            if competency_entry.get("name") != session["active_competency"].get("name"):
                fail("profile competency name does not match the session")
            if competency_entry.get("latest_outcome") != outcome:
                fail("profile competency outcome does not match the session")
            if competency_entry.get("last_session_id") != session_id:
                fail("profile competency last_session_id does not match the session")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=Path)
    parser.add_argument("--case", type=Path)
    parser.add_argument("--profile", type=Path)
    parser.add_argument("--project", type=Path)
    parser.add_argument("--schedule", type=Path)
    args = parser.parse_args()

    try:
        value = load_json(args.path)
        schema = value.get("schema_version")
        if schema == "learning-case/v1":
            validate_case(value)
        elif schema == "learning-project/v1":
            validate_project(value)
        elif schema == "learning-schedule/v1":
            project = load_json(args.project) if args.project else None
            if project is not None:
                validate_project(project)
            validate_schedule(value, project)
        elif schema == "learning-profile/v1":
            validate_profile(value)
        elif schema == "learning-session/v1":
            if args.case is None or args.project is None or args.schedule is None:
                fail("--case, --project, and --schedule are required when validating a session")
            case = load_json(args.case)
            project = load_json(args.project)
            schedule = load_json(args.schedule)
            validate_case(case)
            validate_project(project)
            validate_schedule(schedule, project)
            profile = load_json(args.profile) if args.profile else None
            if profile is not None:
                validate_profile(profile)
            validate_session(value, case, args.case, profile, project, schedule)
        else:
            fail(f"unsupported schema_version: {schema}")
    except ValidationError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(f"OK: {args.path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
