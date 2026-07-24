#!/usr/bin/env python3
"""Validate a design decision manifest and its approved HTML checksum."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


DECISION_ID = re.compile(r"^D-\d{3}$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
KEBAB_CASE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class HtmlRootParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.attributes: dict[str, str | None] | None = None
        self.required_decisions: list[dict[str, str | None]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "html" and self.attributes is None:
            self.attributes = attributes
        if tag == "fieldset" and "decision-card" in (attributes.get("class") or "").split():
            if attributes.get("data-required") == "true":
                self.required_decisions.append(attributes)


def fail(message: str) -> None:
    raise ValueError(message)


def require_string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        fail(f"{field} must be a non-empty string")
    return value.strip()


def require_string_list(value: Any, field: str) -> list[str]:
    if not isinstance(value, list):
        fail(f"{field} must be an array")
    result: list[str] = []
    for index, item in enumerate(value):
        result.append(require_string(item, f"{field}[{index}]"))
    return result


def parse_timestamp(value: Any, field: str) -> str:
    timestamp = require_string(value, field)
    normalized = timestamp[:-1] + "+00:00" if timestamp.endswith("Z") else timestamp
    try:
        datetime.fromisoformat(normalized)
    except ValueError as error:
        fail(f"{field} must be an ISO-8601 timestamp: {error}")
    return timestamp


def load_manifest(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"manifest does not exist: {path}")
    except json.JSONDecodeError as error:
        fail(f"manifest is not valid JSON: {error}")
    if not isinstance(data, dict):
        fail("manifest root must be an object")
    return data


def resolve_repo_path(repo_root: Path, value: str, field: str) -> Path:
    candidate = Path(value)
    if candidate.is_absolute():
        fail(f"{field} must be repository-relative")
    resolved_root = repo_root.resolve()
    resolved = (resolved_root / candidate).resolve()
    if resolved != resolved_root and resolved_root not in resolved.parents:
        fail(f"{field} escapes the repository root")
    return resolved


def read_html_metadata(path: Path) -> tuple[str, str, dict[str, str]]:
    parser = HtmlRootParser()
    parser.feed(path.read_text(encoding="utf-8"))
    if parser.attributes is None:
        fail("design HTML must contain an html root element")
    feature_slug = require_string(parser.attributes.get("data-feature-slug"), "HTML data-feature-slug")
    design_revision = require_string(parser.attributes.get("data-design-revision"), "HTML data-design-revision")
    required_decisions: dict[str, str] = {}
    for index, decision in enumerate(parser.required_decisions):
        decision_id = require_string(decision.get("data-decision-id"), f"HTML required decision[{index}] id")
        if not DECISION_ID.fullmatch(decision_id):
            fail(f"HTML required decision[{index}] id must match D-xxx")
        if decision_id in required_decisions:
            fail(f"duplicate required decision id in HTML: {decision_id}")
        required_decisions[decision_id] = require_string(
            decision.get("data-question"), f"HTML required decision[{index}] question"
        )
    if not required_decisions:
        fail("design HTML must contain at least one required decision card")
    return feature_slug, design_revision, required_decisions


def validate_manifest(data: dict[str, Any], repo_root: Path, html_override: Path | None) -> dict[str, Any]:
    if data.get("schema_version") != 1:
        fail("schema_version must equal 1")

    feature_slug = require_string(data.get("feature_slug"), "feature_slug")
    if not KEBAB_CASE.fullmatch(feature_slug):
        fail("feature_slug must be kebab-case")
    design_revision = require_string(data.get("design_revision"), "design_revision")

    design_path_value = require_string(data.get("design_path"), "design_path")
    design_path = html_override.resolve() if html_override else resolve_repo_path(repo_root, design_path_value, "design_path")
    if not design_path.is_file():
        fail(f"design HTML does not exist: {design_path}")
    html_feature_slug, html_design_revision, html_required_decisions = read_html_metadata(design_path)
    if html_feature_slug != feature_slug:
        fail(f"feature_slug mismatch: manifest {feature_slug}, HTML {html_feature_slug}")
    if html_design_revision != design_revision:
        fail(f"design_revision mismatch: manifest {design_revision}, HTML {html_design_revision}")

    expected_sha = require_string(data.get("design_sha256"), "design_sha256")
    if not SHA256.fullmatch(expected_sha):
        fail("design_sha256 must contain 64 lowercase hexadecimal characters")
    actual_sha = hashlib.sha256(design_path.read_bytes()).hexdigest()
    if actual_sha != expected_sha:
        fail(f"design_sha256 mismatch: expected {expected_sha}, actual {actual_sha}")

    parse_timestamp(data.get("approved_at"), "approved_at")
    if data.get("approval_source") not in {"local-runner", "lavish"}:
        fail("approval_source must equal 'local-runner' or 'lavish'")

    require_string(data.get("goal"), "goal")

    scope = data.get("scope")
    if not isinstance(scope, dict):
        fail("scope must be an object")
    require_string_list(scope.get("in"), "scope.in")
    require_string_list(scope.get("out"), "scope.out")

    decisions = data.get("decisions")
    if not isinstance(decisions, list) or not decisions:
        fail("decisions must be a non-empty array")
    seen_ids: set[str] = set()
    manifest_decisions: dict[str, str] = {}
    for index, decision in enumerate(decisions):
        if not isinstance(decision, dict):
            fail(f"decisions[{index}] must be an object")
        decision_id = require_string(decision.get("id"), f"decisions[{index}].id")
        if not DECISION_ID.fullmatch(decision_id):
            fail(f"decisions[{index}].id must match D-xxx")
        if decision_id in seen_ids:
            fail(f"duplicate decision id: {decision_id}")
        seen_ids.add(decision_id)
        manifest_decisions[decision_id] = require_string(decision.get("question"), f"decisions[{index}].question")
        require_string(decision.get("answer"), f"decisions[{index}].answer")
        require_string(decision.get("rationale"), f"decisions[{index}].rationale")
        if decision.get("source") != "human":
            fail(f"decisions[{index}].source must equal 'human'")
    if manifest_decisions.keys() != html_required_decisions.keys():
        missing = sorted(html_required_decisions.keys() - manifest_decisions.keys())
        extra = sorted(manifest_decisions.keys() - html_required_decisions.keys())
        fail(f"required decision ids mismatch: missing {missing}, extra {extra}")
    for decision_id, html_question in html_required_decisions.items():
        if manifest_decisions[decision_id] != html_question:
            fail(f"question mismatch for {decision_id}")

    require_string_list(data.get("constraints"), "constraints")
    require_string_list(data.get("unresolved_non_blocking"), "unresolved_non_blocking")

    return {
        "feature_slug": feature_slug,
        "design_revision": design_revision,
        "design_path": design_path_value,
        "decision_count": len(decisions),
        "design_sha256": actual_sha,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, help="Path to the decision manifest JSON")
    parser.add_argument("--repo-root", type=Path, default=Path.cwd(), help="Repository root used for relative paths")
    parser.add_argument("--html", type=Path, help="Optional explicit HTML path for checksum validation")
    args = parser.parse_args()

    try:
        result = validate_manifest(load_manifest(args.manifest), args.repo_root, args.html)
    except ValueError as error:
        print(f"invalid: {error}", file=sys.stderr)
        return 1

    print(json.dumps({"valid": True, **result}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
