#!/usr/bin/env python3
"""Create and update the verify-workflow run manifest.

The manifest is the run's durable state: testcase definitions, executor
self-reports, recorded observations, gate results, and judge verdicts.
Use this script instead of hand-editing the JSON so invariants hold.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

MODES = {"spec", "fix", "adhoc"}
ORACLE_KINDS = {"spec", "fix-summary", "stated-intent"}
EXECUTOR_STATUSES = {"pass", "fail", "partial", "blocked"}
VERDICTS = {
    "VERIFIED",
    "CONFIRMED_FAILURE",
    "INSUFFICIENT_EVIDENCE",
    "ORACLE_UNCLEAR",
    "BLOCKED",
}
VERDICT_ICON = {
    "VERIFIED": "🟢",
    "CONFIRMED_FAILURE": "🔴",
    "INSUFFICIENT_EVIDENCE": "🟡",
    "ORACLE_UNCLEAR": "🔴",
    "BLOCKED": "🔴",
}
EXPECTED_VERDICT = {
    "pass": "VERIFIED",
    "fail": "CONFIRMED_FAILURE",
    "partial": "INSUFFICIENT_EVIDENCE",
    "blocked": "BLOCKED",
}
TESTCASE_ID = re.compile(r"^(TC|RG)-\d{3}$")
MAX_REEXECUTIONS = 1


class ManifestError(ValueError):
    pass


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise ManifestError(f"manifest does not exist: {path}")
    except json.JSONDecodeError as error:
        raise ManifestError(f"invalid JSON in {path}: {error}")
    if not isinstance(value, dict) or not isinstance(value.get("testcases"), list):
        raise ManifestError(f"manifest must be an object with a testcases list: {path}")
    return value


def save(path: Path, manifest: dict[str, Any]) -> None:
    manifest["updated_at"] = now()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_json_arg(raw: str) -> Any:
    if raw == "-":
        return json.loads(sys.stdin.read())
    candidate = Path(raw)
    if candidate.exists():
        return json.loads(candidate.read_text(encoding="utf-8"))
    return json.loads(raw)


def find_case(manifest: dict[str, Any], case_id: str) -> dict[str, Any]:
    for testcase in manifest["testcases"]:
        if testcase.get("id") == case_id:
            return testcase
    raise ManifestError(f"testcase not in manifest: {case_id}")


def cmd_init(args: argparse.Namespace) -> dict[str, Any]:
    path = Path(args.manifest)
    if path.exists() and not args.force:
        raise ManifestError(f"manifest already exists, use --force to reset: {path}")
    if args.mode not in MODES:
        raise ManifestError(f"mode must be one of {sorted(MODES)}")
    if args.oracle_kind not in ORACLE_KINDS:
        raise ManifestError(f"oracle-kind must be one of {sorted(ORACLE_KINDS)}")
    if args.mode == "adhoc" and not args.oracle_text:
        raise ManifestError("mode adhoc requires --oracle-text with the stated intent")
    manifest = {
        "run_id": f"{args.slug}--{now()}",
        "feature_slug": args.slug,
        "mode": args.mode,
        "oracle": {
            "kind": args.oracle_kind,
            "ref": args.oracle_ref or "",
            "text": args.oracle_text or "",
        },
        "created_at": now(),
        "updated_at": now(),
        "testcases": [],
    }
    save(path, manifest)
    return {"run_id": manifest["run_id"], "manifest": str(path)}


def cmd_set_testcases(args: argparse.Namespace) -> dict[str, Any]:
    path = Path(args.manifest)
    manifest = load(path)
    incoming = read_json_arg(args.testcases)
    if not isinstance(incoming, list):
        raise ManifestError("--testcases must be a JSON list of testcase objects")

    existing = {testcase["id"]: testcase for testcase in manifest["testcases"]}
    added, kept = [], []
    for entry in incoming:
        if not isinstance(entry, dict):
            raise ManifestError("each testcase must be an object")
        case_id = entry.get("id", "")
        if not TESTCASE_ID.match(case_id):
            raise ManifestError(f"testcase id must match TC-000 or RG-000: {case_id!r}")
        for field in ("action", "expected", "required_evidence"):
            if not entry.get(field):
                raise ManifestError(f"{case_id} is missing {field}")
        previous = existing.get(case_id)
        if previous is None:
            entry.setdefault("spec_mapping", [])
            entry.setdefault("assertion_traits", [])
            entry.setdefault("attempts", 0)
            entry.setdefault("attempt_notes", [])
            existing[case_id] = entry
            added.append(case_id)
            continue
        changed = [
            field
            for field in ("action", "expected")
            if str(previous.get(field)) != str(entry.get(field))
        ]
        if changed and not args.allow_oracle_change:
            raise ManifestError(
                f"{case_id} would change {changed}; the oracle owns expected results. "
                "Pass --allow-oracle-change only when the approved oracle itself changed."
            )
        if changed:
            previous.update({field: entry[field] for field in changed})
            previous.pop("judge", None)
            previous.pop("gate", None)
        previous["required_evidence"] = entry["required_evidence"]
        previous["assertion_traits"] = entry.get("assertion_traits", previous.get("assertion_traits", []))
        kept.append(case_id)

    def sort_key(case_id: str) -> tuple[int, str]:
        return (0 if case_id.startswith("TC-") else 1, case_id)

    manifest["testcases"] = [existing[case_id] for case_id in sorted(existing, key=sort_key)]
    save(path, manifest)
    return {"added": added, "kept": kept, "total": len(manifest["testcases"])}


def cmd_record_executor(args: argparse.Namespace) -> dict[str, Any]:
    path = Path(args.manifest)
    manifest = load(path)
    testcase = find_case(manifest, args.case)
    if args.status not in EXECUTOR_STATUSES:
        raise ManifestError(f"status must be one of {sorted(EXECUTOR_STATUSES)}")
    testcase["executor"] = {
        "status": args.status,
        "claim": args.claim,
        "source": args.source,
        "recorded_at": now(),
    }
    testcase.pop("judge", None)
    save(path, manifest)
    return {"id": args.case, "executor_status": args.status}


def cmd_record_observations(args: argparse.Namespace) -> dict[str, Any]:
    path = Path(args.manifest)
    manifest = load(path)
    testcase = find_case(manifest, args.case)
    observations = read_json_arg(args.observations)
    if not isinstance(observations, dict):
        raise ManifestError("--observations must be a JSON object")
    testcase["observations"] = observations
    testcase.pop("gate", None)
    testcase.pop("judge", None)
    if args.evidence_dir:
        testcase["evidence_dir"] = args.evidence_dir
    save(path, manifest)
    return {"id": args.case, "observation_keys": sorted(observations)}


def cmd_bump_attempt(args: argparse.Namespace) -> dict[str, Any]:
    path = Path(args.manifest)
    manifest = load(path)
    testcase = find_case(manifest, args.case)
    gate = testcase.get("gate") or {}
    if gate.get("result") != "insufficient":
        raise ManifestError(
            f"{args.case} may be re-executed only when its gate result is insufficient"
        )
    attempts = int(testcase.get("attempts", 0)) + 1
    if attempts > MAX_REEXECUTIONS:
        raise ManifestError(
            f"{args.case} reached the re-execution cap of {MAX_REEXECUTIONS} per run"
        )
    testcase["attempts"] = attempts
    testcase.setdefault("attempt_notes", []).append({"attempt": attempts, "changed": args.changed})
    save(path, manifest)
    return {"id": args.case, "attempts": attempts}


def cmd_record_judge(args: argparse.Namespace) -> dict[str, Any]:
    path = Path(args.manifest)
    manifest = load(path)
    testcase = find_case(manifest, args.case)
    if args.verdict not in VERDICTS:
        raise ManifestError(f"verdict must be one of {sorted(VERDICTS)}")
    gate = testcase.get("gate")
    if not isinstance(gate, dict) or "result" not in gate:
        raise ManifestError(f"{args.case} has no gate result; run validate_evidence.py --write first")
    if args.verdict == "VERIFIED" and gate["result"] != "pass":
        raise ManifestError(
            f"{args.case} cannot be VERIFIED while its gate result is '{gate['result']}'"
        )
    executor_status = (testcase.get("executor") or {}).get("status")
    expected = EXPECTED_VERDICT.get(executor_status)
    entry = {
        "verdict": args.verdict,
        "icon": VERDICT_ICON[args.verdict],
        "reason": args.reason,
        "attempt": int(testcase.get("attempts", 0)),
        "executor_status": executor_status,
        "agrees_with_executor": expected == args.verdict if expected else None,
        "recorded_at": now(),
    }
    testcase["judge"] = entry
    testcase.setdefault("judge_history", []).append(entry)
    save(path, manifest)
    return {
        "id": args.case,
        "verdict": args.verdict,
        "agrees_with_executor": testcase["judge"]["agrees_with_executor"],
    }


def cmd_summary(args: argparse.Namespace) -> dict[str, Any]:
    manifest = load(Path(args.manifest))
    groups = {"spec": {}, "regression": {}}
    unjudged, events = [], []
    for testcase in manifest["testcases"]:
        case_id = testcase.get("id", "")
        group = "spec" if case_id.startswith("TC-") else "regression"
        for entry in testcase.get("judge_history") or []:
            if entry.get("agrees_with_executor") is False:
                events.append(
                    {
                        "id": case_id,
                        "attempt": entry.get("attempt"),
                        "executor": entry.get("executor_status"),
                        "judge": entry.get("verdict"),
                    }
                )
        judge = testcase.get("judge")
        if not isinstance(judge, dict):
            unjudged.append(case_id)
            continue
        verdict = judge.get("verdict")
        groups[group][verdict] = groups[group].get(verdict, 0) + 1
    total = len(manifest["testcases"])
    return {
        "feature_slug": manifest.get("feature_slug"),
        "mode": manifest.get("mode"),
        "total": total,
        "spec": groups["spec"],
        "regression": groups["regression"],
        "unjudged": unjudged,
        "disagreement_cases": len({event["id"] for event in events}),
        "disagreement_events": len(events),
        "disagreements": events,
        "complete": not unjudged,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    init = subparsers.add_parser("init", help="create a manifest for a run")
    init.add_argument("--manifest", required=True)
    init.add_argument("--slug", required=True)
    init.add_argument("--mode", required=True)
    init.add_argument("--oracle-kind", required=True)
    init.add_argument("--oracle-ref", default="")
    init.add_argument("--oracle-text", default="")
    init.add_argument("--force", action="store_true")
    init.set_defaults(handler=cmd_init)

    plan = subparsers.add_parser("set-testcases", help="add or refresh testcase definitions")
    plan.add_argument("--manifest", required=True)
    plan.add_argument("--testcases", required=True, help="JSON list, a file path, or - for stdin")
    plan.add_argument("--allow-oracle-change", action="store_true")
    plan.set_defaults(handler=cmd_set_testcases)

    executor = subparsers.add_parser("record-executor", help="record a helper self-report")
    executor.add_argument("--manifest", required=True)
    executor.add_argument("--case", required=True)
    executor.add_argument("--status", required=True)
    executor.add_argument("--claim", required=True)
    executor.add_argument("--source", required=True)
    executor.set_defaults(handler=cmd_record_executor)

    observations = subparsers.add_parser("record-observations", help="record tool observations")
    observations.add_argument("--manifest", required=True)
    observations.add_argument("--case", required=True)
    observations.add_argument("--observations", required=True, help="JSON object, path, or -")
    observations.add_argument("--evidence-dir", default="")
    observations.set_defaults(handler=cmd_record_observations)

    attempt = subparsers.add_parser("bump-attempt", help="record a bounded re-execution")
    attempt.add_argument("--manifest", required=True)
    attempt.add_argument("--case", required=True)
    attempt.add_argument("--changed", required=True, help="what changed between attempts")
    attempt.set_defaults(handler=cmd_bump_attempt)

    judge = subparsers.add_parser("record-judge", help="record the judge verdict")
    judge.add_argument("--manifest", required=True)
    judge.add_argument("--case", required=True)
    judge.add_argument("--verdict", required=True)
    judge.add_argument("--reason", required=True)
    judge.set_defaults(handler=cmd_record_judge)

    summary = subparsers.add_parser("summary", help="print counts and the disagreement record")
    summary.add_argument("--manifest", required=True)
    summary.set_defaults(handler=cmd_summary)

    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        result = args.handler(args)
    except ManifestError as error:
        print(f"manifest error: {error}", file=sys.stderr)
        return 2
    except json.JSONDecodeError as error:
        print(f"manifest error: invalid JSON input: {error}", file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
