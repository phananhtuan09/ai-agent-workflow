#!/usr/bin/env python3
"""Snapshot approved inputs, run native Playwright, and audit evidence bundles."""
import argparse
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path

KINDS = {"browser", "api", "pr-test"}
CLASSIFICATIONS = {"new-behavior", "invariant"}
SETUP_TIMEOUT = 1800


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def local(root, name):
    path = (root / name).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f"Path outside root: {name}")
    return path


def contract(suite, root):
    data = load(suite)
    for key in ("plan", "environment", "revision"):
        if not isinstance(data.get(key), str) or not data[key].strip():
            raise ValueError(f"Missing {key}")
    command = data.get("command")
    if not isinstance(command, list) or not command or any(not isinstance(x, str) or not x for x in command):
        raise ValueError("command must be a nonempty argument array")
    if any(x.startswith(("--output", "--reporter")) for x in command):
        raise ValueError("Runner owns --output and --reporter")
    base = data.get("base")
    if base is not None:
        if not isinstance(base, dict) or not isinstance(base.get("revision"), str) or not base["revision"].strip():
            raise ValueError("base needs a revision")
        env = base.get("env")
        if not isinstance(env, dict) or not env or any(not isinstance(k, str) or not isinstance(v, str) for k, v in env.items()):
            raise ValueError("base env must give the base instance its own ports and data")
        for step in base.get("setup", []):
            if not isinstance(step, list) or not step or any(not isinstance(x, str) or not x for x in step):
                raise ValueError("base setup steps must be nonempty argument arrays")
        if not isinstance(base.get("keep", []), list) or set(base.get("keep", [])) - set(data.get("files") or []):
            raise ValueError("base keep must list approved files")
    det = data.get("determinism")
    if det is not None:
        if not isinstance(det, dict) or set(det) - {"env", "normalize", "limits"}:
            raise ValueError("determinism takes only env, normalize, and limits")
        env = det.get("env", {})
        if not isinstance(env, dict) or any(not isinstance(k, str) or not isinstance(v, str) for k, v in env.items()):
            raise ValueError("determinism env must map names to string values")
        if base is not None and set(env) & set(base["env"]):
            raise ValueError("base env must not override determinism env")
        rules = det.get("normalize", [])
        if not isinstance(rules, list) or any(not isinstance(r, dict) or set(r) != {"pattern", "replacement"} or not isinstance(r["pattern"], str) or not r["pattern"] or not isinstance(r["replacement"], str) for r in rules):
            raise ValueError("determinism normalize rules need a pattern and a replacement")
        for rule in rules:
            try:
                # sub() parses the replacement template even without a match, so bad group references fail here.
                re.compile(rule["pattern"]).sub(rule["replacement"], "")
            except (re.error, IndexError) as error:
                raise ValueError(f"Invalid normalize rule {rule['pattern']!r} -> {rule['replacement']!r}: {error}") from None
        limits = det.get("limits", [])
        if not isinstance(limits, list) or any(not isinstance(x, str) or not x.strip() for x in limits):
            raise ValueError("determinism limits must be nonempty strings")
    cases = data.get("cases", [])
    ids = [c["id"] for c in cases]
    if not ids or len(ids) != len(set(ids)):
        raise ValueError("Cases must have unique IDs")
    if all(c.get("kind") == "pr-test" for c in cases):
        raise ValueError("A suite needs at least one runtime case besides pr-test cases")
    for case in cases:
        if not re.fullmatch(r"[A-Za-z0-9_.-]+", case["id"]) or case.get("kind") not in KINDS:
            raise ValueError("Invalid case ID/kind")
        if case.get("classification", "new-behavior") not in CLASSIFICATIONS:
            raise ValueError("classification must be new-behavior or invariant")
        if case["kind"] == "pr-test":
            test = case.get("test", {})
            if not isinstance(test, dict) or any(not isinstance(test.get(k), str) or not test[k] for k in ("file", "title")):
                raise ValueError("pr-test cases need test.file and test.title")
            if test["file"] not in (data.get("files") or []):
                raise ValueError("pr-test files must be listed in files")
            continue
        checks = case.get("checks", [])
        if not checks or len({c["id"] for c in checks}) != len(checks):
            raise ValueError("Each case needs uniquely mapped checks")
        for check in checks:
            if any(not check.get(k) for k in ("id", "expected", "source")):
                raise ValueError("Checks need id, expected, source")
    files = data.get("files", [])
    if not isinstance(files, list) or not files:
        raise ValueError("List test/config/helper files in files")
    names = list(dict.fromkeys([str(suite.resolve().relative_to(root)), data["plan"], *files]))
    hashes = {name: digest(local(root, name)) for name in names}
    plan = local(root, data["plan"]).read_text(encoding="utf-8")
    plan_ids = re.findall(r"^## Case ([A-Za-z0-9_.-]+)\s+[—-]\s+", plan, re.M)
    if sorted(ids) != sorted(plan_ids):
        raise ValueError("Suite cases must exactly match Markdown cases")
    validator = Path(__file__).resolve().parents[1] / "validate_test_plan.py"
    checked = subprocess.run([sys.executable, str(validator), str(local(root, data["plan"]))], capture_output=True, text=True)
    if checked.returncode:
        raise ValueError(checked.stderr or checked.stdout)
    return data, hashes


def specs(node):
    yield from node.get("specs", [])
    for child in node.get("suites", []):
        yield from specs(child)


def attachment(bundle, value):
    if "body" in value:
        return base64.b64decode(value["body"], validate=True)
    return local(bundle, value["path"]).read_bytes()


def same_file(declared, reported):
    declared, reported = Path(declared).as_posix(), Path(reported).as_posix()
    return declared == reported or declared.endswith("/" + reported)


def native_tests(native, suite):
    existing = [c for c in suite["cases"] if c["kind"] == "pr-test"]
    tests = {}
    for spec in specs(native):
        owner = [c["id"] for c in existing if c["test"]["title"] == spec["title"] and same_file(c["test"]["file"], spec.get("file", ""))]
        match = re.search(r"\[([A-Za-z0-9_.-]+)\]", spec["title"])
        case_id = owner[0] if len(owner) == 1 else match[1] if match else None
        if not case_id or case_id in tests or len(spec.get("tests", [])) != 1:
            raise ValueError("Undeclared, duplicate, or multi-project test")
        tests[case_id] = spec["tests"][0]
    if set(tests) - {c["id"] for c in suite["cases"]}:
        raise ValueError("Native output contains undeclared cases")
    return tests


def observation_document(run, attempt):
    """Parse the unique runtime-observations attachment of an attempt, or return None."""
    found = [a for a in attempt.get("attachments", []) if a.get("name") == "runtime-observations"]
    if len(found) != 1:
        return None
    try:
        observed = json.loads(attachment(run, found[0]))
    except ValueError:
        return None
    return observed if isinstance(observed, dict) else None


def checks_of(row):
    checks = (row.get("observations") or {}).get("checks")
    if not isinstance(checks, list):
        return {}
    return {c["id"]: c for c in checks if isinstance(c, dict) and isinstance(c.get("id"), str)}


def normalized(value, rules):
    """Apply the suite's normalization rules to every string inside an observed value."""
    if isinstance(value, str):
        for rule in rules:
            value = re.sub(rule["pattern"], rule["replacement"], value)
        return value
    if isinstance(value, list):
        return [normalized(item, rules) for item in value]
    if isinstance(value, dict):
        return {key: normalized(item, rules) for key, item in value.items()}
    return value


def base_diff(head, base, rules):
    """List checks whose actual values still differ between head and base after normalization."""
    head_checks, base_checks = checks_of(head), checks_of(base)
    return [{"id": i, "base": base_checks[i].get("actual"), "head": head_checks[i].get("actual")}
            for i in sorted(set(head_checks) & set(base_checks))
            if normalized(head_checks[i].get("actual"), rules) != normalized(base_checks[i].get("actual"), rules)]


def score_run(run, suite):
    """Score one execution directory: the bundle itself (head) or its base/ directory."""
    manifest = load(run / "run-manifest.json")
    if not (run / "native-raw.json").exists():
        return {}, []
    native = load(run / "native.json")
    if normalize(run, load(run / "native-raw.json"), Path(manifest["projectRoot"])) != native:
        raise ValueError("Normalized results disagree with original native report")
    tests = native_tests(native, suite)
    rows = {}
    for case in suite["cases"]:
        test = tests.get(case["id"], {})
        attempts = test.get("results", [])
        row = {"caseId": case["id"], "result": "NOT_RUN", "attempts": len(attempts), "reasons": []}
        rows[case["id"]] = row
        if not attempts or all(a["status"] == "skipped" for a in attempts):
            row["reasons"].append("Absent or skipped test")
            continue
        if test.get("expectedStatus", "passed") != "passed" or len(attempts) != 1 or attempts[0]["status"] != "passed":
            error = next((str(a["error"].get("message", ""))[:300] for a in attempts if isinstance(a.get("error"), dict)), "")
            row.update(result="FAIL", reasons=["Native failure, expected failure, or retry/flaky execution"],
                       passedAttempt=any(a["status"] == "passed" for a in attempts), error=error)
            observed = observation_document(run, attempts[0]) if case["kind"] != "pr-test" else None
            if observed is not None:
                row["observations"] = observed
            continue
        attachments = attempts[0].get("attachments", [])
        for item in attachments:
            if "path" in item and (not item["path"].startswith("artifacts/") or not attachment(run, item)):
                raise ValueError("Missing or invalid artifact attachment")
        if case["kind"] == "pr-test":
            row.update(result="PASS", reasons=["Existing PR test; native result only, no runtime observations"])
            continue
        observations = [a for a in attachments if a["name"] == "runtime-observations"]
        if len(observations) != 1:
            row.update(result="BLOCKED", reasons=["Missing unique structured observations"])
            continue
        observed = json.loads(attachment(run, observations[0]))
        row["observations"] = observed
        checks = observed.get("checks", [])
        by_id = {c["id"]: c for c in checks}
        if len(by_id) != len(checks) or set(by_id) != {c["id"] for c in case["checks"]}:
            row.update(result="BLOCKED", reasons=["Observation checks do not match contract"])
            continue
        if any("actual" not in c or "expected" not in c or not c.get("source") for c in checks):
            row.update(result="BLOCKED", reasons=["Missing expected/actual/source"])
            continue
        if any(c["actual"] != c["expected"] for c in checks):
            row.update(result="FAIL", reasons=["Observed expected/actual mismatch"],
                       error="; ".join(c["id"] for c in checks if c["actual"] != c["expected"]) + " mismatched")
            continue
        if not observed.get("actualPath") or observed.get("cleanup") not in {"COMPLETE", "NOT_REQUIRED"}:
            row.update(result="BLOCKED", reasons=["Missing runtime path or completed cleanup"])
            continue
        if case["kind"] == "browser" and not any(a["name"] == "trace" and a.get("path") for a in attachments):
            row.update(result="BLOCKED", reasons=["Browser case lacks trace"])
            continue
        row["result"] = "PASS"
    return rows, native.get("errors", [])


def base_status(bundle, suite):
    if suite.get("base") is None:
        return None, {}
    base = bundle / "base"
    manifest = load(base / "run-manifest.json")
    degraded = manifest.get("degraded")
    rows, errors = ({}, []) if degraded else score_run(base, suite)
    probes = [c["id"] for c in suite["cases"] if c.get("classification") == "invariant"]
    if not degraded and probes and not any(rows[i]["result"] == "PASS" for i in probes):
        # Invariant cases double as a health probe: if none passes, the base app was not really exercised.
        degraded = "No invariant case passed on base; the base runtime may not have run"
    if not degraded and errors:
        degraded = "Base run reported global errors: " + str(errors[0].get("message", errors[0]))[:300]
    status = {"revision": manifest["revision"], "gitHead": manifest.get("gitHead", ""), "exitCode": manifest.get("exitCode"), "nativeErrors": errors, "degraded": degraded}
    return status, rows


def proof(case, head, base, base_rows, rules):
    """Classify whether a passing head case is shown able to fail on base."""
    if head["result"] != "PASS":
        return "NOT_EVALUATED", "Head result is not PASS"
    if case.get("classification", "new-behavior") == "invariant":
        return "NOT_REQUIRED", "Invariant case; expected to pass on base too"
    if base is None:
        return "NOT_PROVEN", "Ability to fail not proven: no base revision declared"
    if base["degraded"]:
        return "NOT_PROVEN", "Ability to fail not proven: " + base["degraded"]
    row = base_rows[case["id"]]
    result = row["result"]
    if result == "FAIL" and row.get("passedAttempt"):
        return "NOT_PROVEN", "Ability to fail not proven: flaky on base (an attempt passed)"
    mismatched = [c for c in checks_of(row).values() if c.get("actual") != c.get("expected")]
    if result == "FAIL" and mismatched and all(normalized(c.get("actual"), rules) == normalized(c.get("expected"), rules) for c in mismatched):
        names = ", ".join(c["id"] for c in mismatched)
        return "NOT_PROVEN", f"Ability to fail not proven: base differs only in normalized values ({names})"
    if result == "FAIL":
        detail = f" ({row['error']})" if row.get("error") else ""
        return "PROVEN", f"Fails on base{detail} and passes on head"
    if result == "PASS":
        return "NON_PROVING", "Passes on base too; does not prove the change"
    return "NOT_PROVEN", f"Ability to fail not proven: base result {result}"


def score(bundle):
    manifest = load(bundle / "run-manifest.json")
    suite = load(local(bundle / "inputs", manifest["suite"]))
    head, errors = score_run(bundle, suite)
    base, base_rows = base_status(bundle, suite)
    det = suite.get("determinism")
    rules = (det or {}).get("normalize", [])
    rows = []
    for case in suite["cases"]:
        row = head[case["id"]]
        row["proof"], row["proofReason"] = proof(case, row, base, base_rows, rules)
        if base_rows:
            row["baseResult"] = base_rows[case["id"]]["result"]
            if "observations" in row and "observations" in base_rows[case["id"]]:
                row["baseDiff"] = base_diff(row, base_rows[case["id"]], rules)
        rows.append(row)
    return {"cases": rows, "exitCode": manifest["exitCode"], "nativeErrors": errors, "base": base, "determinism": det}


def summary(result):
    lines = ["# Runtime E2E results", "", "Mechanical proof only; semantic audit still required.", ""]
    for row in result["cases"]:
        lines.append(f"- {row['caseId']}: {row['result']} ({row['attempts']} attempt(s)); {'; '.join(row['reasons'])}")
        lines.append(f"  - Can-fail: {row['proof']}; {row['proofReason']}")
        if "baseDiff" in row:
            diff = "; ".join(f"{d['id']}: base {json.dumps(d['base'], ensure_ascii=False)[:80]} vs head {json.dumps(d['head'], ensure_ascii=False)[:80]}" for d in row["baseDiff"])
            lines.append(f"  - Base diff after normalization: {diff or 'none'}")
    lines += ["", f"Execution exit code: {result['exitCode']}", f"Native global errors: {len(result['nativeErrors'])}"]
    base = result["base"]
    if base is None:
        lines.append("Base: not declared; no case has proven ability to fail")
    else:
        lines.append(f"Base revision: {base['revision']} ({base['gitHead'] or 'unresolved'})")
        lines.append(f"Base run: {'DEGRADED: ' + base['degraded'] if base['degraded'] else 'completed'}")
    det = result["determinism"]
    if det is None:
        lines.append("Determinism: not declared; time, seed data, randomness, and IDs are uncontrolled")
    else:
        lines.append(f"Determinism env: {', '.join(sorted(det.get('env', {}))) or 'none'}; normalization rules: {len(det.get('normalize', []))}")
        lines.append(f"Determinism limits: {'; '.join(det.get('limits', [])) or 'none stated'}")
    non_proving = [r["caseId"] for r in result["cases"] if r["proof"] == "NON_PROVING"]
    lines.append(f"Non-proving PASS: {', '.join(non_proving) if non_proving else 'none'}")
    return "\n".join(lines) + "\n"


def inventory(bundle):
    if any(p.is_symlink() for p in bundle.rglob("*")):
        raise ValueError("Evidence bundle must not contain symlinks")
    return {str(p.relative_to(bundle)): digest(p) for p in sorted(bundle.rglob("*")) if p.is_file() and p.name != "integrity.json"}


def audit(bundle):
    if inventory(bundle) != load(bundle / "integrity.json"):
        raise ValueError("Bundle integrity mismatch")
    approval = load(bundle / "approval.json")
    manifest = load(bundle / "run-manifest.json")
    suite = load(local(bundle / "inputs", manifest["suite"]))
    required = {manifest["suite"], suite["plan"], *suite["files"]}
    if set(approval["hashes"]) != required or not approval.get("reviewer"):
        raise ValueError("Approval does not cover declared inputs")
    if manifest["command"][:-2] != suite["command"] or manifest["command"][-2] != "--reporter=json":
        raise ValueError("Recorded command disagrees with approved command")
    if any(manifest[k] != suite[k] for k in ("environment", "revision")):
        raise ValueError("Recorded environment/revision disagrees with approved suite")
    if suite.get("base") is not None:
        base = load(bundle / "base" / "run-manifest.json")
        if base["revision"] != suite["base"]["revision"]:
            raise ValueError("Recorded base revision disagrees with approved suite")
        if "command" in base and (base["command"][:-2] != suite["command"] or base["command"][-2] != "--reporter=json"):
            raise ValueError("Recorded base command disagrees with approved command")
    for name, value in approval["hashes"].items():
        if digest(local(bundle / "inputs", name)) != value:
            raise ValueError("Approved input snapshot mismatch")
    result = score(bundle)
    if result != load(bundle / "results.json") or summary(result) != (bundle / "summary.md").read_text():
        raise ValueError("Generated report disagrees with native evidence")
    print(summary(result))
    unresolved = [c["caseId"] for c in result["cases"] if c["result"] != "PASS" or c["proof"] == "NON_PROVING"]
    clean = result["exitCode"] == 0 and not result["nativeErrors"] and not unresolved
    # Exit 1 means the evidence is consistent but the suite is not done; inconsistent evidence exits 2.
    print("Audit: evidence consistent; " + ("all cases resolved" if clean else
          f"unresolved: {', '.join(unresolved) or 'native exit code or global errors'}"))
    return 0 if clean else 1


def normalize(run, native, root):
    original = load(run / "run-manifest.json")["artifactRoot"]
    for spec in specs(native):
        for test in spec.get("tests", []):
            for attempt in test.get("results", []):
                for item in attempt.get("attachments", []):
                    if "path" in item:
                        path = Path(item["path"])
                        path = path.resolve() if path.is_absolute() else (root / path).resolve()
                        # Original reports use absolute paths; locate them in a moved bundle too.
                        relative = path.relative_to(original)
                        stored = local(run / "artifacts", str(relative))
                        if not stored.is_file():
                            raise ValueError("Missing artifact attachment")
                        item["path"] = str(stored.relative_to(run))
    return native


def execute(run, cwd, command, extra_env, manifest):
    """Run the approved command once and store its native report under run/."""
    env = os.environ.copy()
    env.update(extra_env, PLAYWRIGHT_JSON_OUTPUT_NAME=str(run / "native.json"))
    command = command + ["--reporter=json", "--output=" + str(run / "artifacts")]
    manifest.update(artifactRoot=str(run / "artifacts"), command=command, startedAt=datetime.now(timezone.utc).isoformat())
    write(run / "run-manifest.json", manifest)
    with (run / "stdout.log").open("wb") as stdout, (run / "stderr.log").open("wb") as stderr:
        try:
            execution = subprocess.run(command, cwd=cwd, env=env, stdout=stdout, stderr=stderr)
            manifest["exitCode"] = execution.returncode
        except OSError as error:
            stderr.write(str(error).encode())
            manifest["exitCode"] = 127
    manifest["finishedAt"] = datetime.now(timezone.utc).isoformat()
    write(run / "run-manifest.json", manifest)
    native_path = run / "native.json"
    if not native_path.exists():
        write(native_path, {"suites": [], "errors": [{"message": "Native output missing; inspect stderr.log"}]})
    (run / "native-raw.json").write_bytes(native_path.read_bytes())
    write(native_path, normalize(run, load(native_path), cwd))


def run_base(bundle, root, data, run_id):
    """Run the approved tests against the base revision in a separate worktree."""
    run = bundle / "base"
    run.mkdir()
    base = data["base"]
    fixed = (data.get("determinism") or {}).get("env", {})
    manifest = {"revision": base["revision"], "projectRoot": "", "gitHead": "", "setup": []}
    resolved = subprocess.run(["git", "rev-parse", "--verify", base["revision"] + "^{commit}"], cwd=root, capture_output=True, text=True)
    if resolved.returncode:
        manifest["degraded"] = f"Base revision {base['revision']} cannot be resolved"
        write(run / "run-manifest.json", manifest)
        return
    manifest["gitHead"] = resolved.stdout.strip()
    tree = Path(tempfile.mkdtemp(prefix="runtime-e2e-base-"))
    try:
        added = subprocess.run(["git", "worktree", "add", "--detach", str(tree), manifest["gitHead"]], cwd=root, capture_output=True, text=True)
        if added.returncode:
            manifest["degraded"] = "Base worktree could not be created: " + added.stderr.strip()[:300]
            return
        manifest["projectRoot"] = str(tree)
        # Tests come from the approved head snapshot; the application and kept files stay at base.
        for name in data["files"]:
            if name in base.get("keep", []):
                continue
            dest = local(tree, name)
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(local(bundle / "inputs", name).read_bytes())
        with (run / "setup.log").open("w", encoding="utf-8") as log:
            for step in base.get("setup", []):
                try:
                    # Setup steps are human-approved argument arrays (hashed with the suite) and run without a shell.
                    done = subprocess.run(step, cwd=tree, env={**os.environ, **fixed, **base["env"]}, capture_output=True, text=True, timeout=SETUP_TIMEOUT)  # nosemgrep: python.lang.security.audit.dangerous-subprocess-use-audit
                    code, output = done.returncode, done.stdout + done.stderr
                except subprocess.TimeoutExpired:
                    code, output = 124, f"timed out after {SETUP_TIMEOUT}s"
                except OSError as error:
                    code, output = 127, str(error)
                log.write(f"$ {step}\n{output}\n[exit {code}]\n")
                manifest["setup"].append({"command": step, "exitCode": code})
                if code:
                    manifest["degraded"] = f"Base setup {step} exited {code}; see base/setup.log"
                    return
        try:
            execute(run, tree, data["command"], {**fixed, **base["env"], "RUNTIME_E2E_RUN_ID": run_id + "-base"}, manifest)
        except ValueError as error:
            manifest["degraded"] = f"Base native report unusable: {error}"[:300]
    finally:
        removed = subprocess.run(["git", "worktree", "remove", "--force", str(tree)], cwd=root, capture_output=True, text=True)
        shutil.rmtree(tree, ignore_errors=True)
        subprocess.run(["git", "worktree", "prune"], cwd=root, capture_output=True)
        listed = subprocess.run(["git", "worktree", "list", "--porcelain"], cwd=root, capture_output=True, text=True).stdout
        left = tree.exists() or f"worktree {tree}" in listed
        manifest["worktreeCleanup"] = "INCOMPLETE: " + removed.stderr.strip()[:300] if left else "COMPLETE"
        write(run / "run-manifest.json", manifest)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=["validate", "approve", "run", "audit"])
    parser.add_argument("target", type=Path)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--reviewer")
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    if args.mode == "audit":
        return audit(args.target.resolve())
    root, suite = args.root.resolve(), args.target.resolve()
    data, hashes = contract(suite, root)
    approval_path = suite.with_name(suite.name + ".approval.json")
    if args.mode == "validate":
        print("Suite and Markdown contract valid")
        return 0
    if args.mode == "approve":
        if not args.reviewer:
            raise ValueError("Explicit human reviewer required")
        write(approval_path, {"reviewer": args.reviewer, "approvedAt": datetime.now(timezone.utc).isoformat(), "hashes": hashes})
        return 0
    approval = load(approval_path)
    if approval["hashes"] != hashes or not approval.get("reviewer"):
        raise ValueError("Approval missing or stale; human reapproval required")
    if args.out is None:
        raise ValueError("--out must name a new run directory")
    bundle = args.out.resolve()
    bundle.mkdir(parents=True, exist_ok=False)
    for name in hashes:
        dest = local(bundle / "inputs", name)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(local(root, name).read_bytes())
    write(bundle / "approval.json", approval)
    run_id = str(uuid.uuid4())
    git = subprocess.run(["git", "rev-parse", "HEAD"], cwd=root, capture_output=True, text=True)
    dirty = subprocess.run(["git", "status", "--porcelain"], cwd=root, capture_output=True, text=True)
    manifest = {"runId": run_id, "suite": str(suite.relative_to(root)), "projectRoot": str(root), "environment": data["environment"], "revision": data["revision"], "gitHead": git.stdout.strip(), "gitStatus": dirty.stdout}
    fixed = (data.get("determinism") or {}).get("env", {})
    execute(bundle, root, data["command"], {**fixed, "RUNTIME_E2E_RUN_ID": run_id}, manifest)
    if data.get("base") is not None:
        run_base(bundle, root, data, run_id)
    result = score(bundle)
    write(bundle / "results.json", result)
    (bundle / "summary.md").write_text(summary(result), encoding="utf-8")
    write(bundle / "integrity.json", inventory(bundle))
    return audit(bundle)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(2)
