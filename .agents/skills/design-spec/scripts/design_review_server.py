#!/usr/bin/env python3
"""Serve a design review HTML file and persist local approval artifacts."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import signal
import socket
import subprocess
import sys
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import urlopen

from validate_design_review import validate_review


KEBAB_CASE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DECISION_ID = re.compile(r"^D-\d{3}$")
OUTPUT_KINDS = {"ui", "api", "full-stack", "workflow", "data", "generic"}


class DesignParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.root: dict[str, str | None] | None = None
        self.required_decisions: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "html" and self.root is None:
            self.root = attributes
        if tag == "fieldset" and "decision-card" in (attributes.get("class") or "").split():
            if attributes.get("data-required") == "true":
                decision_id = (attributes.get("data-decision-id") or "").strip()
                question = (attributes.get("data-question") or "").strip()
                if decision_id:
                    self.required_decisions[decision_id] = question


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(path)


def resolve_repo_path(repo_root: Path, value: str) -> Path:
    candidate = Path(value)
    if candidate.is_absolute():
        raise ValueError("path must be repository-relative")
    resolved_root = repo_root.resolve()
    resolved = (resolved_root / candidate).resolve()
    if resolved != resolved_root and resolved_root not in resolved.parents:
        raise ValueError("path escapes repository root")
    return resolved


def repo_relative(repo_root: Path, path: Path) -> str:
    return path.resolve().relative_to(repo_root.resolve()).as_posix()


def read_design_metadata(design_path: Path) -> tuple[str, str, dict[str, str]]:
    parser = DesignParser()
    parser.feed(design_path.read_text(encoding="utf-8"))
    if parser.root is None:
        raise ValueError("design HTML must contain an html root element")
    feature_slug = (parser.root.get("data-feature-slug") or "").strip()
    design_revision = (parser.root.get("data-design-revision") or "").strip()
    if not KEBAB_CASE.fullmatch(feature_slug):
        raise ValueError("HTML data-feature-slug must be kebab-case")
    if not design_revision:
        raise ValueError("HTML data-design-revision is required")
    if not parser.required_decisions:
        raise ValueError("design HTML must contain at least one required decision")
    for decision_id, question in parser.required_decisions.items():
        if not DECISION_ID.fullmatch(decision_id):
            raise ValueError(f"invalid required decision id: {decision_id}")
        if not question:
            raise ValueError(f"required decision {decision_id} question is empty")
    return feature_slug, design_revision, parser.required_decisions


def load_current_design(design_path: Path) -> tuple[str, str, dict[str, str]]:
    validate_review(design_path)
    return read_design_metadata(design_path)


def require_string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} must be a non-empty string")
    return value.strip()


def require_string_list(value: Any, field: str) -> list[str]:
    if not isinstance(value, list):
        raise ValueError(f"{field} must be an array")
    result: list[str] = []
    for index, item in enumerate(value):
        result.append(require_string(item, f"{field}[{index}]"))
    return result


def validate_output_preview(value: Any, field: str = "output_preview") -> None:
    if not isinstance(value, dict):
        raise ValueError(f"{field} must be an object")
    if value.get("kind") not in OUTPUT_KINDS:
        raise ValueError(f"{field}.kind must be one of {sorted(OUTPUT_KINDS)}")
    require_string(value.get("summary"), f"{field}.summary")
    require_string_list(value.get("deliverables"), f"{field}.deliverables")
    require_string_list(value.get("primary_interfaces"), f"{field}.primary_interfaces")
    require_string_list(value.get("observable_results"), f"{field}.observable_results")
    flow = value.get("flow")
    if not isinstance(flow, list) or not 2 <= len(flow) <= 6:
        raise ValueError(f"{field}.flow must contain between two and six nodes")
    for index, node in enumerate(flow):
        if not isinstance(node, dict):
            raise ValueError(f"{field}.flow[{index}] must be an object")
        require_string(node.get("label"), f"{field}.flow[{index}].label")
        require_string(node.get("description"), f"{field}.flow[{index}].description")


def validate_approval_payload(
    payload: dict[str, Any],
    feature_slug: str,
    design_revision: str,
    required_decisions: dict[str, str],
) -> None:
    if payload.get("schema_version") != 1:
        raise ValueError("schema_version must equal 1")
    if payload.get("event") != "design-spec-approval":
        raise ValueError("event must equal design-spec-approval")
    if payload.get("approved") is not True:
        raise ValueError("approved must equal true")
    if payload.get("feature_slug") != feature_slug:
        raise ValueError("feature_slug does not match design HTML")
    if str(payload.get("design_revision") or "") != design_revision:
        raise ValueError("design_revision does not match design HTML")
    require_string(payload.get("submitted_at"), "submitted_at")
    require_string(payload.get("goal"), "goal")
    validate_output_preview(payload.get("output_preview"))
    scope = payload.get("scope")
    if not isinstance(scope, dict):
        raise ValueError("scope must be an object")
    require_string_list(scope.get("in"), "scope.in")
    require_string_list(scope.get("out"), "scope.out")

    decisions = payload.get("decisions")
    if not isinstance(decisions, list):
        raise ValueError("decisions must be an array")
    seen: dict[str, str] = {}
    for index, decision in enumerate(decisions):
        if not isinstance(decision, dict):
            raise ValueError(f"decisions[{index}] must be an object")
        decision_id = require_string(decision.get("id"), f"decisions[{index}].id")
        if not DECISION_ID.fullmatch(decision_id):
            raise ValueError(f"decisions[{index}].id must match D-xxx")
        seen[decision_id] = require_string(decision.get("question"), f"decisions[{index}].question")
        require_string(decision.get("answer"), f"decisions[{index}].answer")
        require_string(decision.get("rationale"), f"decisions[{index}].rationale")
    if seen.keys() != required_decisions.keys():
        missing = sorted(required_decisions.keys() - seen.keys())
        extra = sorted(seen.keys() - required_decisions.keys())
        raise ValueError(f"required decision ids mismatch: missing {missing}, extra {extra}")
    for decision_id, question in required_decisions.items():
        if seen[decision_id] != question:
            raise ValueError(f"question mismatch for {decision_id}")
    require_string_list(payload.get("constraints"), "constraints")


def validate_feedback_payload(payload: dict[str, Any], feature_slug: str, design_revision: str) -> None:
    if payload.get("schema_version") != 1:
        raise ValueError("schema_version must equal 1")
    if payload.get("event") != "design-change-request":
        raise ValueError("event must equal design-change-request")
    if payload.get("feature_slug") != feature_slug:
        raise ValueError("feature_slug does not match design HTML")
    if str(payload.get("design_revision") or "") != design_revision:
        raise ValueError("design_revision does not match design HTML")
    comments = payload.get("comments")
    if not isinstance(comments, list) or not comments:
        raise ValueError("comments must be a non-empty array")
    for index, comment in enumerate(comments):
        if not isinstance(comment, dict):
            raise ValueError(f"comments[{index}] must be an object")
        require_string(comment.get("target"), f"comments[{index}].target")
        require_string(comment.get("text"), f"comments[{index}].text")


def make_manifest(repo_root: Path, design_path: Path, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "schema_version": 1,
        "feature_slug": payload["feature_slug"],
        "design_revision": str(payload["design_revision"]),
        "design_path": repo_relative(repo_root, design_path),
        "design_sha256": hashlib.sha256(design_path.read_bytes()).hexdigest(),
        "approved_at": payload["submitted_at"],
        "approval_source": "local-runner",
        "goal": payload["goal"],
        "output_preview": payload["output_preview"],
        "scope": payload["scope"],
        "decisions": [
            {
                "id": decision["id"],
                "question": decision["question"],
                "answer": decision["answer"],
                "rationale": decision["rationale"],
                "source": "human",
            }
            for decision in payload["decisions"]
        ],
        "constraints": payload.get("constraints", []),
        "unresolved_non_blocking": [],
    }


def run_manifest_validator(repo_root: Path, manifest_path: Path) -> None:
    validator = Path(__file__).with_name("validate_design_decisions.py")
    result = subprocess.run(
        [sys.executable, str(validator), str(manifest_path), "--repo-root", str(repo_root)],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise ValueError((result.stderr or result.stdout or "manifest validation failed").strip())


class ReviewHandler(BaseHTTPRequestHandler):
    repo_root: Path
    design_path: Path
    design_rel: str

    def current_design(self) -> tuple[str, str, dict[str, str]]:
        return load_current_design(self.design_path)

    def log_message(self, format: str, *args: Any) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))

    def send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_html(self) -> None:
        body = self.design_path.read_bytes()
        self.send_response(200)
        self.send_header("content-type", "text/html; charset=utf-8")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("content-length") or "0")
        if length <= 0 or length > 1_000_000:
            raise ValueError("request body size is invalid")
        payload = json.loads(self.rfile.read(length).decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("request body must be a JSON object")
        return payload

    def do_GET(self) -> None:
        if self.path in {"/", "/design", "/index.html"}:
            self.send_html()
            return
        if self.path == "/api/status":
            feature_slug, design_revision, _ = self.current_design()
            self.send_json(
                200,
                {
                    "status": "ok",
                    "feature_slug": feature_slug,
                    "design_revision": design_revision,
                    "design_path": self.design_rel,
                },
            )
            return
        self.send_json(404, {"error": "not found"})

    def do_POST(self) -> None:
        try:
            if self.path == "/api/design-approval":
                self.handle_approval()
                return
            if self.path == "/api/design-feedback":
                self.handle_feedback()
                return
            self.send_json(404, {"error": "not found"})
        except (json.JSONDecodeError, ValueError) as error:
            self.send_json(400, {"error": str(error)})
        except Exception as error:
            self.send_json(500, {"error": str(error)})

    def handle_approval(self) -> None:
        payload = self.read_json_body()
        feature_slug, design_revision, required_decisions = self.current_design()
        validate_approval_payload(payload, feature_slug, design_revision, required_decisions)
        manifest_path = self.repo_root / "docs" / "ai" / "design-decisions" / f"{feature_slug}.json"
        manifest = make_manifest(self.repo_root, self.design_path, payload)
        atomic_write_json(manifest_path, manifest)
        try:
            run_manifest_validator(self.repo_root, manifest_path)
        except Exception:
            manifest_path.unlink(missing_ok=True)
            raise
        self.send_json(
            200,
            {
                "status": "approved",
                "design_decisions_path": repo_relative(self.repo_root, manifest_path),
            },
        )

    def handle_feedback(self) -> None:
        payload = self.read_json_body()
        feature_slug, design_revision, _ = self.current_design()
        validate_feedback_payload(payload, feature_slug, design_revision)
        feedback_path = self.repo_root / "docs" / "ai" / "design-feedback" / f"{feature_slug}.json"
        feedback = {
            "schema_version": 1,
            "event": "design-change-request",
            "feature_slug": feature_slug,
            "design_revision": design_revision,
            "design_path": self.design_rel,
            "design_sha256": hashlib.sha256(self.design_path.read_bytes()).hexdigest(),
            "received_at": iso_now(),
            "comments": payload["comments"],
        }
        atomic_write_json(feedback_path, feedback)
        self.send_json(
            200,
            {
                "status": "changes-requested",
                "design_feedback_path": repo_relative(self.repo_root, feedback_path),
            },
        )


def state_path(repo_root: Path, feature_slug: str) -> Path:
    return repo_root / "docs" / "ai" / "design-runtime" / f"{feature_slug}.server.json"


def read_state(path: Path) -> dict[str, Any] | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def pid_running(pid: int) -> bool:
    if pid <= 0:
        return False
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def choose_port(host: str) -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind((host, 0))
        return int(sock.getsockname()[1])


def wait_for_status(url: str, timeout: float = 5.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urlopen(url + "/api/status", timeout=0.5) as response:
                return response.status == 200
        except URLError:
            time.sleep(0.1)
    return False


def fetch_status(url: str, timeout: float = 1.0) -> dict[str, Any] | None:
    try:
        with urlopen(url + "/api/status", timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (OSError, URLError, json.JSONDecodeError):
        return None
    return payload if response.status == 200 and isinstance(payload, dict) else None


def start_command(args: argparse.Namespace) -> int:
    repo_root = args.repo_root.resolve()
    design_path = resolve_repo_path(repo_root, args.design_path)
    feature_slug, design_revision, _ = load_current_design(design_path)
    design_rel = repo_relative(repo_root, design_path)
    state = state_path(repo_root, feature_slug)
    existing = read_state(state)
    if existing and pid_running(int(existing.get("pid") or 0)):
        status = fetch_status(str(existing.get("url") or ""))
        matches = status and all(
            (
                status.get("feature_slug") == feature_slug,
                str(status.get("design_revision") or "") == design_revision,
                status.get("design_path") == design_rel,
            )
        )
        if matches:
            print(json.dumps({"status": "running", **existing}, ensure_ascii=False))
            return 0
        os.kill(int(existing["pid"]), signal.SIGTERM)

    port = args.port or choose_port(args.host)
    state.parent.mkdir(parents=True, exist_ok=True)
    log_path = state.with_suffix(".log")
    command = [
        sys.executable,
        str(Path(__file__).resolve()),
        "--repo-root",
        str(repo_root),
        "serve",
        repo_relative(repo_root, design_path),
        "--host",
        args.host,
        "--port",
        str(port),
    ]
    with log_path.open("ab") as log:
        process = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
    url = f"http://{args.host}:{port}"
    payload = {
        "pid": process.pid,
        "url": url,
        "host": args.host,
        "port": port,
        "feature_slug": feature_slug,
        "design_revision": design_revision,
        "design_path": design_rel,
        "state_path": repo_relative(repo_root, state),
        "log_path": repo_relative(repo_root, log_path),
        "started_at": iso_now(),
    }
    atomic_write_json(state, payload)
    if not wait_for_status(url):
        raise SystemExit(f"server did not become healthy; see {log_path}")
    print(json.dumps({"status": "started", **payload}, ensure_ascii=False))
    return 0


def status_command(args: argparse.Namespace) -> int:
    repo_root = args.repo_root.resolve()
    design_path = resolve_repo_path(repo_root, args.design_path)
    feature_slug, _, _ = load_current_design(design_path)
    state = read_state(state_path(repo_root, feature_slug)) or {}
    running = pid_running(int(state.get("pid") or 0))
    manifest = repo_root / "docs" / "ai" / "design-decisions" / f"{feature_slug}.json"
    feedback = repo_root / "docs" / "ai" / "design-feedback" / f"{feature_slug}.json"
    print(
        json.dumps(
            {
                "status": "running" if running else "stopped",
                "server": state,
                "design_decisions_path": repo_relative(repo_root, manifest) if manifest.exists() else None,
                "design_feedback_path": repo_relative(repo_root, feedback) if feedback.exists() else None,
            },
            ensure_ascii=False,
        )
    )
    return 0


def stop_command(args: argparse.Namespace) -> int:
    repo_root = args.repo_root.resolve()
    design_path = resolve_repo_path(repo_root, args.design_path)
    feature_slug, _, _ = load_current_design(design_path)
    state = read_state(state_path(repo_root, feature_slug)) or {}
    pid = int(state.get("pid") or 0)
    if pid_running(pid):
        os.kill(pid, signal.SIGTERM)
    print(json.dumps({"status": "stopped", "pid": pid}, ensure_ascii=False))
    return 0


def serve_command(args: argparse.Namespace) -> int:
    repo_root = args.repo_root.resolve()
    design_path = resolve_repo_path(repo_root, args.design_path)
    load_current_design(design_path)

    class Handler(ReviewHandler):
        pass

    Handler.repo_root = repo_root
    Handler.design_path = design_path
    Handler.design_rel = repo_relative(repo_root, design_path)
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    server.serve_forever()
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    subparsers = parser.add_subparsers(dest="command", required=True)
    for name in ("start", "status", "stop", "serve"):
        command = subparsers.add_parser(name)
        command.add_argument("design_path")
        command.add_argument("--host", default="127.0.0.1")
        command.add_argument("--port", type=int, default=0)
        command.set_defaults(func=globals()[f"{name}_command"])
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
