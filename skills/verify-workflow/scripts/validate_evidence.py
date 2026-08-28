#!/usr/bin/env python3
"""Deterministic evidence gate for verify-workflow.

Checks recorded observations and stored artifacts against each testcase's
declared required evidence. Produces `pass`, `manual`, or `insufficient`
per testcase. Never inspects agent narrative and never judges semantics.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

KNOWN_KINDS = {
    "artifact",
    "request_param",
    "request_absent_param",
    "response_all",
    "dom_matches_response",
    "dataset_discriminates",
    "request_after_reload",
    "no_new_console_error",
    "manual_judgment",
}

TRAIT_REQUIREMENTS = {
    "scoping": {"dataset_discriminates"},
    "server_call": {"request_param", "request_absent_param"},
    "persistence": {"request_after_reload"},
    "displays_data": {"dom_matches_response"},
}


class GateError(ValueError):
    pass


def load_manifest(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise GateError(f"manifest does not exist: {path}")
    except json.JSONDecodeError as error:
        raise GateError(f"invalid JSON in {path}: {error}")
    if not isinstance(value, dict) or not isinstance(value.get("testcases"), list):
        raise GateError(f"manifest must be an object with a testcases list: {path}")
    return value


def expected_value(item: dict[str, Any], refs: dict[str, Any]) -> str:
    if "equals" in item:
        return str(item["equals"])
    ref = item.get("equals_ref")
    if ref is None:
        raise GateError(f"{item.get('kind')} needs equals or equals_ref")
    if ref not in refs:
        return "\x00unresolved"
    return str(refs[ref])


def matching_requests(obs: dict[str, Any], needle: str, phase: str | None) -> list[dict]:
    out = []
    for request in obs.get("requests") or []:
        if not isinstance(request, dict):
            continue
        if needle not in str(request.get("url", "")):
            continue
        if phase is not None and request.get("phase") != phase:
            continue
        out.append(request)
    return out


def find_response(obs: dict[str, Any], ref: str) -> dict | None:
    for response in obs.get("responses") or []:
        if isinstance(response, dict) and response.get("ref") == ref:
            return response
    return None


def check_item(item: dict[str, Any], obs: dict[str, Any], root: Path) -> tuple[str, str]:
    """Return (status, detail) where status is ok, missing, or manual."""
    kind = item.get("kind")
    refs = obs.get("refs") or {}

    if kind == "manual_judgment":
        return "manual", item.get("reason", "cần người đánh giá")

    if kind == "artifact":
        raw = item.get("path")
        if not raw:
            raise GateError("artifact needs path")
        target = Path(raw)
        if not target.is_absolute():
            target = root / target
        if not target.exists():
            return "missing", f"artifact không tồn tại: {raw}"
        if target.is_file() and target.stat().st_size == 0:
            return "missing", f"artifact rỗng: {raw}"
        return "ok", f"artifact có mặt: {raw}"

    if kind in {"request_param", "request_after_reload"}:
        needle = item.get("url_contains", "")
        param = item.get("param")
        if not param:
            raise GateError(f"{kind} needs param")
        phase = "after_reload" if kind == "request_after_reload" else None
        found = matching_requests(obs, needle, phase)
        if not found:
            label = " sau reload" if phase else ""
            return "missing", f"không có request nào khớp '{needle}'{label}"
        want = expected_value(item, refs) if ("equals" in item or "equals_ref" in item) else None
        if want == "\x00unresolved":
            return "missing", f"refs thiếu giá trị '{item.get('equals_ref')}' để so sánh"
        for request in found:
            params = request.get("params") or {}
            if param not in params:
                continue
            if want is None or str(params[param]) == want:
                return "ok", f"request {request.get('url')} có {param}={params[param]}"
        if want is None:
            return "missing", f"request khớp '{needle}' không có tham số {param}"
        return "missing", f"không có request nào khớp '{needle}' với {param}={want}"

    if kind == "request_absent_param":
        needle = item.get("url_contains", "")
        param = item.get("param")
        if not param:
            raise GateError("request_absent_param needs param")
        found = matching_requests(obs, needle, None)
        if not found:
            return "missing", f"không có request nào khớp '{needle}' để kiểm tra"
        for request in found:
            if param in (request.get("params") or {}):
                return "missing", f"request {request.get('url')} vẫn có {param}"
        return "ok", f"request khớp '{needle}' không mang {param}"

    if kind == "response_all":
        ref = item.get("response_ref")
        field = item.get("field")
        if not ref or not field:
            raise GateError("response_all needs response_ref and field")
        response = find_response(obs, ref)
        if response is None:
            return "missing", f"không có response nào ref='{ref}'"
        items = response.get("items")
        if not isinstance(items, list) or not items:
            return "missing", f"response '{ref}' không có item nào để kiểm tra"
        want = expected_value(item, refs)
        if want == "\x00unresolved":
            return "missing", f"refs thiếu giá trị '{item.get('equals_ref')}' để so sánh"
        bad = [entry for entry in items if str((entry or {}).get(field)) != want]
        if bad:
            return "missing", f"{len(bad)}/{len(items)} item trong '{ref}' có {field} != {want}"
        return "ok", f"{len(items)}/{len(items)} item trong '{ref}' có {field}={want}"

    if kind == "dom_matches_response":
        ref = item.get("response_ref")
        if not ref:
            raise GateError("dom_matches_response needs response_ref")
        response = find_response(obs, ref)
        if response is None:
            return "missing", f"không có response nào ref='{ref}'"
        dom_items = obs.get("dom_items")
        if not isinstance(dom_items, list):
            return "missing", "không ghi lại dom_items"
        api_ids = {str((entry or {}).get("id")) for entry in response.get("items") or []}
        dom_ids = {str(entry) for entry in dom_items}
        if api_ids != dom_ids:
            return "missing", f"DOM {sorted(dom_ids)} khác response {sorted(api_ids)}"
        return "ok", f"DOM khớp response: {len(dom_ids)} item"

    if kind == "dataset_discriminates":
        dataset = obs.get("dataset")
        if not isinstance(dataset, dict):
            return "missing", "không ghi lại dataset in_scope/out_of_scope"
        in_min = int(item.get("in_scope_min", 1))
        out_min = int(item.get("out_of_scope_min", 1))
        in_scope = dataset.get("in_scope")
        out_scope = dataset.get("out_of_scope")
        if not isinstance(in_scope, int) or not isinstance(out_scope, int):
            return "missing", "dataset in_scope/out_of_scope phải là số"
        if in_scope < in_min or out_scope < out_min:
            return "missing", (
                f"dataset không phân biệt được: in_scope={in_scope} (cần >={in_min}), "
                f"out_of_scope={out_scope} (cần >={out_min})"
            )
        return "ok", f"dataset in_scope={in_scope}, out_of_scope={out_scope}"

    if kind == "no_new_console_error":
        errors = obs.get("console_errors")
        if errors is None:
            return "missing", "không ghi lại console_errors"
        if errors:
            return "missing", f"{len(errors)} console error: {errors[0]}"
        return "ok", "không có console error"

    raise GateError(f"unknown required_evidence kind: {kind!r}")


def plan_gaps(testcase: dict[str, Any]) -> list[str]:
    declared = {item.get("kind") for item in testcase.get("required_evidence") or []}
    gaps = []
    for trait in testcase.get("assertion_traits") or []:
        needed = TRAIT_REQUIREMENTS.get(trait)
        if needed is None:
            raise GateError(f"unknown assertion trait: {trait!r}")
        if not declared & needed:
            gaps.append(
                f"trait '{trait}' cần khai báo một trong {sorted(needed)} nhưng plan không có"
            )
    return gaps


def gate_testcase(testcase: dict[str, Any], root: Path) -> dict[str, Any]:
    tc_id = testcase.get("id") or "<no-id>"
    required = testcase.get("required_evidence")
    if not isinstance(required, list) or not required:
        return {
            "result": "insufficient",
            "missing": [f"{tc_id} không khai báo required_evidence"],
            "satisfied": [],
        }
    for item in required:
        if not isinstance(item, dict) or item.get("kind") not in KNOWN_KINDS:
            raise GateError(f"{tc_id}: unknown required_evidence kind: {item!r}")

    missing = plan_gaps(testcase)
    satisfied: list[str] = []
    manual: list[str] = []
    obs = testcase.get("observations") or {}

    for item in required:
        status, detail = check_item(item, obs, root)
        if status == "ok":
            satisfied.append(f"{item['kind']}: {detail}")
        elif status == "manual":
            manual.append(f"{item['kind']}: {detail}")
        else:
            missing.append(f"{item['kind']}: {detail}")

    if missing:
        result = "insufficient"
    elif manual:
        result = "manual"
    else:
        result = "pass"
    return {"result": result, "missing": missing, "manual": manual, "satisfied": satisfied}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", help="path to {feature-slug}.manifest.json")
    parser.add_argument("--case", action="append", help="gate only these testcase ids")
    parser.add_argument("--root", default=".", help="root used to resolve artifact paths")
    parser.add_argument("--write", action="store_true", help="write gate results into the manifest")
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    try:
        manifest = load_manifest(manifest_path)
        root = Path(args.root).resolve()
        selected = set(args.case or [])
        report = []
        for testcase in manifest["testcases"]:
            if selected and testcase.get("id") not in selected:
                continue
            gate = gate_testcase(testcase, root)
            testcase["gate"] = gate
            report.append({"id": testcase.get("id"), **gate})
    except GateError as error:
        print(f"gate error: {error}", file=sys.stderr)
        return 2

    if not report:
        print("gate error: no testcase matched", file=sys.stderr)
        return 2

    if args.write:
        manifest_path.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if any(entry["result"] == "insufficient" for entry in report) else 0


if __name__ == "__main__":
    sys.exit(main())
