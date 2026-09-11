#!/usr/bin/env python3
"""Validate structured verification results and their source freshness."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


RESULTS = {"pass", "fail", "partial", "blocked", "skipped"}
CLASSIFICATIONS = {
    "verified",
    "implementation_defect",
    "insufficient_evidence",
    "spec_ambiguity",
    "scope_change",
    "risk_authority",
    "environment_blocker",
    "not_applicable",
}
TEST_TYPES = {"code_test", "build_check", "api_check", "runtime_e2e"}
EXECUTORS = {"verify-feature", "verify-runtime"}
SHA256 = re.compile(r"^[0-9a-f]{64}$")


class ValidationError(ValueError):
    pass


def load_json(path: Path, label: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise ValidationError(f"{label} does not exist: {path}")
    except json.JSONDecodeError as error:
        raise ValidationError(f"invalid JSON in {label}: {error}")
    if not isinstance(value, dict):
        raise ValidationError(f"{label} must be a JSON object")
    return value


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require_sha(value: Any, label: str) -> str:
    if not isinstance(value, str) or not SHA256.fullmatch(value):
        raise ValidationError(f"{label} must be a 64-character lowercase SHA-256 value")
    return value


def require_string(value: Any, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"{label} must be a non-empty string")
    return value


def repo_relative(path: Path, repo_root: Path) -> str:
    try:
        return path.resolve().relative_to(repo_root.resolve()).as_posix()
    except ValueError:
        return path.resolve().as_posix()


def source_sha256(repo_root: Path, files: list[Any]) -> str:
    digest = hashlib.sha256()
    root = repo_root.resolve()
    normalized: list[tuple[str, Path]] = []
    for raw in files:
        if not isinstance(raw, str) or not raw.strip():
            raise ValidationError("source_files must contain non-empty repository-relative paths")
        relative = Path(raw)
        if relative.is_absolute():
            raise ValidationError(f"source file must be repository-relative: {raw}")
        resolved = (root / relative).resolve()
        if resolved != root and root not in resolved.parents:
            raise ValidationError(f"source file escapes repository root: {raw}")
        normalized.append((relative.as_posix(), resolved))
    for relative, resolved in sorted(normalized):
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        if resolved.is_file():
            digest.update(b"file\0")
            digest.update(resolved.read_bytes())
        elif resolved.exists():
            raise ValidationError(f"source path is not a file: {relative}")
        else:
            digest.update(b"missing\0")
    return digest.hexdigest()


def testcase_ids(definitions: dict[str, Any]) -> list[str]:
    ids: list[str] = []
    for group in ("testcases", "regression_testcases"):
        entries = definitions.get(group, [])
        if not isinstance(entries, list):
            raise ValidationError(f"{group} must be an array")
        for index, testcase in enumerate(entries):
            if not isinstance(testcase, dict) or not isinstance(testcase.get("id"), str):
                raise ValidationError(f"{group}[{index}] must have a string id")
            for field in ("ac", "steps", "done_criteria"):
                if not isinstance(testcase.get(field), list if field != "done_criteria" else dict):
                    raise ValidationError(f"{group}[{index}] needs {field}")
            if not isinstance(testcase.get("expected"), str) or not testcase["expected"].strip():
                raise ValidationError(f"{group}[{index}] needs a non-empty expected value")
            if not testcase["ac"] or any(not isinstance(item, str) or not item.strip() for item in testcase["ac"]):
                raise ValidationError(f"{group}[{index}].ac must be a non-empty string array")
            if not testcase["steps"] or any(not isinstance(item, str) or not item.strip() for item in testcase["steps"]):
                raise ValidationError(f"{group}[{index}].steps must be a non-empty string array")
            criteria = testcase["done_criteria"]
            for field in ("required", "not_sufficient"):
                if not isinstance(criteria.get(field), list) or any(not isinstance(item, str) for item in criteria[field]):
                    raise ValidationError(f"{group}[{index}].done_criteria.{field} must be a string array")
            if not isinstance(testcase.get("test_type"), str) or testcase["test_type"] not in TEST_TYPES:
                raise ValidationError(f"{group}[{index}].test_type is unsupported")
            ids.append(testcase["id"])
    if not definitions.get("testcases"):
        raise ValidationError("testcases must be non-empty")
    if len(ids) != len(set(ids)):
        raise ValidationError("testcase ids must be unique")
    return ids


def validate_result(case_id: str, testcase: dict[str, Any], result: Any) -> None:
    if not isinstance(result, dict):
        raise ValidationError(f"result for {case_id} must be an object")
    if result.get("result") not in RESULTS:
        raise ValidationError(f"result for {case_id} has invalid result")
    if result.get("classification") not in CLASSIFICATIONS:
        raise ValidationError(f"result for {case_id} has invalid classification")
    expected_executor = "verify-runtime" if testcase["test_type"] == "runtime_e2e" else "verify-feature"
    if result.get("executor") != expected_executor:
        raise ValidationError(f"result for {case_id} must be emitted by {expected_executor}")
    for field in ("satisfied", "missing", "evidence"):
        if not isinstance(result.get(field), list):
            raise ValidationError(f"result for {case_id} needs array field {field}")
        if field != "evidence" and any(not isinstance(item, str) for item in result[field]):
            raise ValidationError(f"result for {case_id}.{field} must contain strings")
    for item in result["evidence"]:
        if not isinstance(item, dict):
            raise ValidationError(f"result for {case_id}.evidence must contain kind/ref objects")
        require_string(item.get("kind"), f"result for {case_id} evidence.kind")
        require_string(item.get("ref"), f"result for {case_id} evidence.ref")
    require_string(result.get("verified_at"), f"result for {case_id}.verified_at")
    try:
        datetime.fromisoformat(result["verified_at"].replace("Z", "+00:00"))
    except ValueError as error:
        raise ValidationError(f"result for {case_id}.verified_at must be ISO-8601") from error
    if result["result"] == "pass" and result["classification"] != "verified":
        raise ValidationError(f"passing result for {case_id} must be classified verified")
    if result["result"] == "pass" and (result["missing"] or not result["evidence"]):
        raise ValidationError(f"passing result for {case_id} needs evidence and cannot have missing items")
    if result["classification"] == "verified" and (result["result"] != "pass" or result["missing"]):
        raise ValidationError(f"verified result for {case_id} must be a complete pass")
    if result["result"] == "skipped" and result["classification"] != "not_applicable":
        raise ValidationError(f"skipped result for {case_id} must be classified not_applicable")


def validate_definitions(definitions: dict[str, Any], config: dict[str, Any] | None) -> list[str]:
    require_string(definitions.get("feature"), "testcase definitions.feature")
    require_string(definitions.get("spec_path"), "testcase definitions.spec_path")
    require_sha(definitions.get("spec_sha256"), "testcase definitions.spec_sha256")
    files = definitions.get("source_files")
    if not isinstance(files, list) or not files:
        raise ValidationError("testcase definitions need a non-empty source_files array")
    if any(not isinstance(item, str) or not item.strip() for item in files):
        raise ValidationError("source_files must be a unique non-empty string array")
    if len(files) != len(set(files)):
        raise ValidationError("source_files must be a unique non-empty string array")
    origin = definitions.get("source_files_origin")
    if origin != "git-working-tree+explicit":
        raise ValidationError("source_files_origin must be git-working-tree+explicit")
    for field in ("risk_tags", "risk_exceptions"):
        if not isinstance(definitions.get(field), list):
            raise ValidationError(f"testcase definitions.{field} must be an array")
    ids = testcase_ids(definitions)
    if config:
        known_types = set((config.get("test_types") or {}).keys())
        for group in ("testcases", "regression_testcases"):
            for testcase in definitions.get(group, []):
                if testcase["test_type"] not in known_types:
                    raise ValidationError(f"{testcase['id']} uses undefined test_type {testcase['test_type']}")
    return ids


def validate_repair(repair: Any, ids: list[str], current_source: str) -> None:
    if not isinstance(repair, dict) or repair.get("max_attempts") != 2 or not isinstance(repair.get("attempts"), list):
        raise ValidationError("verification results need repair.max_attempts=2 and an attempts array")
    attempts = repair["attempts"]
    if len(attempts) > 2:
        raise ValidationError("verification results exceed the two-attempt repair limit")
    for index, attempt in enumerate(attempts, start=1):
        if not isinstance(attempt, dict) or attempt.get("attempt") != index:
            raise ValidationError("repair attempts must be sequentially numbered from 1")
        failed = attempt.get("failed_testcase_ids")
        if not isinstance(failed, list) or not failed or any(case_id not in ids for case_id in failed):
            raise ValidationError("each repair attempt needs known failed_testcase_ids")
        if attempt.get("classification") != "implementation_defect":
            raise ValidationError("repair attempts are allowed only for implementation_defect")
        before = require_sha(attempt.get("source_sha256_before"), "repair source_sha256_before")
        after = require_sha(attempt.get("source_sha256_after"), "repair source_sha256_after")
        if before == after:
            raise ValidationError("repair attempt must change the source fingerprint")
        require_string(attempt.get("summary"), "repair summary")
        require_string(attempt.get("recorded_at"), "repair recorded_at")
    if attempts and attempts[-1]["source_sha256_after"] != current_source:
        raise ValidationError("latest repair source fingerprint does not match current source")


def validate_risk_policy(definitions: dict[str, Any], config: dict[str, Any]) -> None:
    policies = config.get("risk_policies") or {}
    if not isinstance(policies, dict):
        raise ValidationError("verify config risk_policies must be an object")
    tags = definitions.get("risk_tags") or []
    if not isinstance(tags, list) or any(not isinstance(tag, str) for tag in tags):
        raise ValidationError("risk_tags must be an array of strings")
    unknown = sorted(set(tags) - set(policies))
    if unknown:
        raise ValidationError(f"unknown risk tags: {unknown}")
    exceptions = definitions.get("risk_exceptions") or []
    if not isinstance(exceptions, list):
        raise ValidationError("risk_exceptions must be an array")
    for entry in exceptions:
        if not isinstance(entry, dict) or not all(isinstance(entry.get(field), str) and entry[field].strip() for field in ("tag", "requirement", "reason")):
            raise ValidationError("risk_exceptions entries need tag, requirement, and reason strings")
    exception_keys = {
        (entry.get("tag"), entry.get("requirement"))
        for entry in exceptions
        if isinstance(entry, dict) and entry.get("reason")
    }
    cases = list(definitions.get("testcases") or []) + list(definitions.get("regression_testcases") or [])
    for case in cases:
        case_tags = case.get("risk_tags") or []
        case_scenarios = case.get("risk_scenarios") or []
        if not isinstance(case_tags, list) or any(not isinstance(tag, str) or tag not in policies for tag in case_tags):
            raise ValidationError(f"{case.get('id')} has unknown or invalid risk_tags")
        if not isinstance(case_scenarios, list) or any(not isinstance(item, str) for item in case_scenarios):
            raise ValidationError(f"{case.get('id')} risk_scenarios must be a string array")
    for tag in tags:
        policy = policies[tag]
        required_types = policy.get("required_test_types") or []
        required_scenarios = policy.get("required_scenarios") or []
        tagged = [case for case in cases if tag in (case.get("risk_tags") or [])]
        for test_type in required_types:
            if not any(case.get("test_type") == test_type for case in tagged):
                requirement = f"test_type:{test_type}"
                if (tag, requirement) not in exception_keys:
                    raise ValidationError(f"risk tag {tag} lacks required {requirement}")
        for scenario in required_scenarios:
            if not any(scenario in (case.get("risk_scenarios") or []) for case in tagged):
                requirement = f"scenario:{scenario}"
                if (tag, requirement) not in exception_keys:
                    raise ValidationError(f"risk tag {tag} lacks required {requirement}")


def validate(args: argparse.Namespace) -> dict[str, Any]:
    definitions_path = Path(args.testcases)
    results_path = Path(args.results)
    spec_path = Path(args.spec)
    definitions = load_json(definitions_path, "testcase definitions")
    results = load_json(results_path, "verification results")
    config = load_json(Path(args.config), "verify config") if args.config else None
    ids = validate_definitions(definitions, config)
    if args.config:
        validate_risk_policy(definitions, config)

    actual_spec = file_sha256(spec_path)
    repo_root = Path(args.repo_root).resolve()
    if definitions["spec_path"] != repo_relative(spec_path, repo_root):
        raise ValidationError("testcase definitions.spec_path does not match the validated spec path")
    if results.get("schema_version") != 1:
        raise ValidationError("verification results.schema_version must equal 1")
    if results.get("feature") != definitions["feature"]:
        raise ValidationError("verification results.feature does not match testcase definitions")
    if results.get("spec_path") != definitions["spec_path"]:
        raise ValidationError("verification results.spec_path does not match testcase definitions")
    if results.get("testcases_path") != repo_relative(definitions_path, repo_root):
        raise ValidationError("verification results.testcases_path does not match the validated definitions path")
    if definitions.get("spec_sha256") != actual_spec:
        raise ValidationError("testcase definitions are stale because the approved spec changed")
    if results.get("spec_sha256") != actual_spec:
        raise ValidationError("verification results are stale because the approved spec changed")

    actual_definitions = file_sha256(definitions_path)
    if results.get("testcases_sha256") != actual_definitions:
        raise ValidationError("verification results are stale because testcase definitions changed")

    files = definitions["source_files"]
    actual_source = source_sha256(repo_root, files)
    if results.get("source_sha256") != actual_source:
        raise ValidationError("verification results are stale because implementation source files changed")

    recorded = results.get("results")
    if not isinstance(recorded, dict):
        raise ValidationError("verification results need a results object")
    repair = results.get("repair")
    validate_repair(repair, ids, actual_source)
    unknown = sorted(set(recorded) - set(ids))
    if unknown:
        raise ValidationError(f"verification results contain unknown testcase ids: {unknown}")
    testcase_by_id = {case["id"]: case for group in ("testcases", "regression_testcases") for case in definitions[group]}
    for case_id, result in recorded.items():
        validate_result(case_id, testcase_by_id[case_id], result)
    missing = sorted(set(ids) - set(recorded))
    if args.complete and missing:
        raise ValidationError(f"verification results are incomplete: {missing}")

    return {
        "valid": True,
        "complete": not missing,
        "missing_testcases": missing,
        "spec_sha256": actual_spec,
        "testcases_sha256": actual_definitions,
        "source_sha256": actual_source,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--testcases", required=True)
    parser.add_argument("--results", required=True)
    parser.add_argument("--spec", required=True)
    parser.add_argument("--repo-root", default=".")
    parser.add_argument("--complete", action="store_true")
    parser.add_argument("--config", help="project verify config with transparent risk policies")
    args = parser.parse_args()
    try:
        report = validate(args)
    except (OSError, ValidationError) as error:
        print(f"invalid: {error}", file=sys.stderr)
        return 1
    print(json.dumps(report, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
