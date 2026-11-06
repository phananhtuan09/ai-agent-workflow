#!/usr/bin/env python3
"""Detect, prove, and record how this project's runtime starts: the main stack and a parallel instance of another ref."""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import instance  # noqa: E402
from evidence import LOCAL_HOSTS  # noqa: E402

SAMPLE_TIMEOUT = 600
SETUP_TIMEOUT = 1800
START_WORDS = re.compile(r"^(dev|start|serve|up|run|server|start:dev|dev:.*)$")
TEST_WORDS = re.compile(r"^(test|e2e|smoke|test:.*|e2e:.*)$")
FIXTURE_WORDS = re.compile(r"(seed|reset|fixture|migrate|db:)")
COMMAND_LINE = re.compile(r"^\s*(?:\$\s*)?((?:npm|pnpm|yarn|npx|make|docker|docker-compose|python3?|pip|bundle|rails|php|composer|go|cargo|uv|poetry)\b.*)$")
DESTRUCTIVE = re.compile(r"(drop|truncate|reset|wipe|destroy|rm\s+-rf|down\s+-v|--force)", re.I)
RECIPE_KEYS = instance.RECIPE_KEYS | {"sample", "requires", "sources"}
RESOURCE_TEXT = {
    "shared": "shared, chosen by the human: worktree instances use the local stack's ports, database, and services, so each runs only while the local stack is stopped",
    "isolated": "isolated, chosen by the human: worktree instances get fresh ports and their own data, beside the local stack",
}


def write(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def detect(root):
    """Candidate commands and variable names, each with the file and line it came from; nothing is run."""
    found = []

    def add(field, value, path, line):
        found.append({"field": field, "value": value, "source": f"{path.relative_to(root)}:{line}"})

    for path in sorted(root.glob("**/package.json")):
        if "node_modules" in path.parts:
            continue
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        try:
            scripts = json.loads("\n".join(lines)).get("scripts", {})
        except (ValueError, AttributeError):
            continue
        for name, body in scripts.items():
            line = next((i for i, text in enumerate(lines, 1) if f'"{name}"' in text), 0)
            field = "start" if START_WORDS.match(name) else "test" if TEST_WORDS.match(name) else "fixtures" if FIXTURE_WORDS.search(name) else None
            if field:
                add(field, f"npm run {name}  # {body}", path, line)
    for path in sorted(root.glob("Makefile")):
        for i, text in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            m = re.match(r"^([A-Za-z0-9_.-]+)\s*:(?!=)", text)
            if m:
                name = m[1]
                field = "start" if START_WORDS.match(name) else "test" if TEST_WORDS.match(name) else "fixtures" if FIXTURE_WORDS.search(name) else None
                if field:
                    add(field, f"make {name}", path, i)
    for path in sorted(list(root.glob("docker-compose*.y*ml")) + list(root.glob("compose*.y*ml"))):
        add("start", f"docker compose -f {path.name} up -d", path, 1)
        for i, text in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            if re.match(r"^\s+-\s*[\"']?\d+:\d+", text) or "healthcheck" in text:
                add("ready" if "healthcheck" in text else "ports", text.strip(), path, i)
    for path in sorted(root.glob("playwright.config.*")):
        for i, text in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            if re.search(r"\b(command|url|baseURL|port)\s*:", text):
                add("ready" if "url" in text.lower() or "port" in text else "start", text.strip(), path, i)
    # Env files are read for names only; a value never leaves this function.
    for path in sorted(root.glob(".env*")):
        if path.is_file():
            for name in instance.env_names(path):
                add("env", name, path, next(i for i, t in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1) if instance.ENV_LINE.match(t) and instance.ENV_LINE.match(t)[1] == name))
    docs = [root / "README.md"] + sorted(p for p in (root / "docs" / "runbooks").glob("*.md") if p.name != "README.md")
    for path in docs:
        if not path.is_file():
            continue
        if path.parent.name == "runbooks":
            add("runbook", path.name, path, 1)
        fenced = False
        for i, text in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            if text.lstrip().startswith("```"):
                fenced = not fenced
                continue
            m = COMMAND_LINE.match(text) if fenced else None
            if m:
                add("command", m[1].strip(), path, i)
    for item in found:
        if DESTRUCTIVE.search(item["value"]) and item["field"] != "env":
            item["warning"] = "destructive-looking; never run it during setup"
    return {"candidates": found}


def load_recipe(path):
    recipe = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(recipe, dict) or set(recipe) - RECIPE_KEYS:
        raise ValueError("recipe takes only " + ", ".join(sorted(RECIPE_KEYS)))
    instance.validate({k: v for k, v in recipe.items() if k in instance.RECIPE_KEYS})
    if not instance.argv(recipe.get("sample")):
        raise ValueError("recipe sample is the one test or smoke request setup runs, as an argument array")
    req = recipe.get("requires", {})
    if not isinstance(req, dict) or set(req) - {"env", "writable", "siblings"}:
        raise ValueError("requires takes only env, writable, and siblings")
    if any(not isinstance(x, str) for x in req.get("env", []) + req.get("writable", [])):
        raise ValueError("requires env and writable list names and paths")
    if any(not isinstance(s, dict) or set(s) != {"name", "url"} for s in req.get("siblings", [])):
        raise ValueError("each sibling needs a name and a url")
    urls = ([recipe["ready"]["url"]] if "url" in recipe["ready"] else []) + [s["url"] for s in req.get("siblings", [])]
    for url in urls:
        host = re.match(r"https?://(\[[^\]]*\]|[^:/?#]*)", url)
        if not host or not LOCAL_HOSTS.fullmatch(host[1].lower()):
            raise ValueError(f"setup proves local targets only; refusing {url}")
    for command in [recipe["start"], recipe.get("stop") or [], recipe.get("identity") or [], recipe["sample"], *recipe.get("setup", [])]:
        if DESTRUCTIVE.search(" ".join(command)):
            raise ValueError(f"refusing a destructive-looking command during setup: {command}")
    return recipe


def prerequisites(recipe, cwd, env):
    """Everything an instance needs to boot besides its start command; variables are checked by name only."""
    req = recipe.get("requires", {})
    defined = set(os.environ) | set(env)
    for path in Path(cwd).glob(".env*"):
        if path.is_file() and not path.name.endswith((".example", ".sample", ".template", ".dist")):
            defined |= set(instance.env_names(path))
    missing = [n for n in req.get("env", []) if n not in defined]
    unwritable = [p for p in req.get("writable", []) if not os.access(Path(cwd) / instance.fill(p, env), os.W_OK)]
    down = [s["name"] for s in req.get("siblings", []) if not instance.is_ready({"ready": {"url": s["url"]}}, env, Path(os.devnull))]
    problems = ([f"missing variables: {', '.join(missing)}"] if missing else []) + \
               ([f"not writable: {', '.join(unwritable)}"] if unwritable else []) + \
               ([f"sibling not reachable: {', '.join(down)}"] if down else [])
    return {"envPresent": sorted(n for n in req.get("env", []) if n in defined), "envMissing": missing,
            "unwritable": unwritable, "siblingsDown": down}, problems


def run_step(name, command, cwd, env, out, secrets, timeout):
    started = time.monotonic()
    try:
        # Recipe commands are reviewed argument arrays, shown to the human before setup runs them; no shell.
        done = subprocess.run(command, cwd=cwd, env={**os.environ, **env}, capture_output=True, text=True, timeout=timeout)  # nosemgrep: python.lang.security.audit.dangerous-subprocess-use-audit
        code, output = done.returncode, done.stdout + done.stderr
    except subprocess.TimeoutExpired:
        code, output = 124, f"timed out after {timeout}s"
    except OSError as error:
        code, output = 127, str(error)
    (out / f"{name}.log").write_text(instance.redact(output, secrets), encoding="utf-8")
    return {"step": name, "command": command, "exitCode": code, "seconds": round(time.monotonic() - started, 1),
            "log": f"{name}.log", "excerpt": instance.excerpt(output, secrets)}


def prove(root, recipe_path, out, ref):
    """Run the recipe for real and record what happened; READY only from steps that executed and passed."""
    recipe = load_recipe(recipe_path)
    out.mkdir(parents=True, exist_ok=False)
    evidence = {"kind": "parallel" if ref else "main", "ref": ref, "gitHead": None, "recipe": str(recipe_path),
                "recipeDigest": hashlib.sha256(recipe_path.read_bytes()).hexdigest(), "recipeContent": recipe, "startedAt": now(), "steps": []}
    secrets = instance.secret_values(root / recipe.get("cwd", "."))
    tree = None
    main_ready_before = instance.stack_up(recipe, instance.instance_env(recipe, root, fresh=False))

    def finish(status, step=None, reason=None):
        evidence.update(status=status, failedStep=step, reason=reason, finishedAt=now())
        if ref:
            evidence["mainStackUntouched"] = instance.stack_up(recipe, instance.instance_env(recipe, root, fresh=False)) == main_ready_before
        write(out / "setup-evidence.json", evidence)
        print(f"{evidence['kind']}: {status}" + (f" at {step}: {reason}" if step else "") + f"; evidence {out / 'setup-evidence.json'}")
        return 0 if status == "READY" else 1

    handle = None
    try:
        if ref:
            head = subprocess.run(["git", "rev-parse", "--verify", ref + "^{commit}"], cwd=root, capture_output=True, text=True)
            if head.returncode:
                return finish("BLOCKED", "worktree", f"ref {ref} cannot be resolved")
            evidence["gitHead"] = head.stdout.strip()
            tree = Path(tempfile.mkdtemp(prefix="runtime-e2e-setup-"))
            added = subprocess.run(["git", "worktree", "add", "--detach", str(tree), evidence["gitHead"]], cwd=root, capture_output=True, text=True)
            if added.returncode:
                return finish("BLOCKED", "worktree", added.stderr.strip()[:300])
            cwd = tree / recipe.get("cwd", ".")
            evidence["copied"] = instance.copy_local(root, tree, recipe)
        else:
            evidence["gitHead"] = subprocess.run(["git", "rev-parse", "HEAD"], cwd=root, capture_output=True, text=True).stdout.strip() or None
            cwd = root / recipe.get("cwd", ".")
        env = instance.instance_env(recipe, tree or root, fresh=bool(ref) and recipe["resources"] == "isolated")
        evidence["ports"] = {k: env[k] for k in recipe.get("ports", {})}
        evidence["envNames"] = sorted(env)
        if recipe["resources"] == "shared" and (ref or not main_ready_before):
            # Held until this process exits: no other run starts an instance on the same local ports meanwhile.
            lock = instance.lock_shared(root)  # noqa: F841
            if lock is None:
                return finish("BLOCKED", "lock", instance.SHARED_LOCK_HELD)
        busy = instance.busy_ports(recipe, env) if ref else []
        if busy:
            # Shared resources run on the local stack's ports: say so before any setup step spends time.
            return finish("BLOCKED", "ports", f"shared resources use the local stack's ports and {', '.join(busy)} is in use; stop the local stack, or choose isolated resources")
        for i, step in enumerate(recipe.get("setup", []) if ref else []):
            row = run_step(f"setup-{i + 1}", step, cwd, env, out, secrets, SETUP_TIMEOUT)
            evidence["steps"].append(row)
            if row["exitCode"]:
                return finish("BLOCKED", row["step"], f"exited {row['exitCode']}; see {row['log']}")
        evidence["prerequisites"], problems = prerequisites(recipe, cwd, env)
        if problems:
            return finish("BLOCKED", "prerequisites", "; ".join(problems))
        if not ref and main_ready_before:
            # The human's stack is already up: prove against it, never restart or stop it.
            evidence["steps"].append({"step": "start", "skipped": "main stack already running; not restarted"})
        else:
            handle = instance.Instance(recipe, cwd, env, out / "start.log")
            reason = handle.start()
            evidence["steps"].append({"step": "start", "command": recipe["start"], "log": "start.log", **handle.record})
            if reason:
                return finish("BLOCKED", "start", reason)
        if ref:
            mismatch = instance.check_identity(recipe, cwd, env)
            evidence["identity"] = "NOT_DECLARED" if "identity" not in recipe else "MISMATCH" if mismatch else "MATCH"
            if mismatch:
                return finish("BLOCKED", "identity", mismatch)
        row = run_step("sample", recipe["sample"], cwd, env, out, secrets, SAMPLE_TIMEOUT)
        evidence["steps"].append(row)
        if row["exitCode"]:
            return finish("BLOCKED", "sample", f"exited {row['exitCode']}; see {row['log']}")
        stopped = handle.stop() if handle else None
        handle = None
        if stopped:
            evidence["steps"].append({"step": "stop", "command": recipe.get("stop") or "terminate process group", **stopped})
            if not stopped["portsReleased"] or stopped.get("stopExitCode") not in (None, 0):
                return finish("BLOCKED", "stop", "ports still held: " + ", ".join(stopped.get("portsHeld", [])) if not stopped["portsReleased"] else f"stop exited {stopped['stopExitCode']}")
        return finish("READY")
    finally:
        if handle:
            evidence["steps"].append({"step": "stop", "command": recipe.get("stop") or "terminate process group", **handle.stop()})
            write(out / "setup-evidence.json", evidence)
        if tree:
            # Every log is written to out/, so the worktree is removed whatever happened.
            subprocess.run(["git", "worktree", "remove", "--force", str(tree)], cwd=root, capture_output=True)
            shutil.rmtree(tree, ignore_errors=True)
            subprocess.run(["git", "worktree", "prune"], cwd=root, capture_output=True)
            evidence["worktreeCleanup"] = "COMPLETE" if not tree.exists() else "INCOMPLETE"
            write(out / "setup-evidence.json", evidence)


def code(value):
    return "`" + (" ".join(value) if isinstance(value, list) else str(value)) + "`"


def replace_line(text, prefix, value):
    pattern = re.compile(r"^- " + re.escape(prefix) + r":.*$", re.M)
    line = f"- {prefix}: {value}"
    return pattern.sub(lambda _: line, text, count=1) if pattern.search(text) else text


def section(text, heading, body):
    """Replace the body of `## heading` up to the next `## ` heading, or append the section."""
    m = re.search(r"^## " + re.escape(heading) + r"\n.*?(?=^## |\Z)", text, re.M | re.S)
    block = f"## {heading}\n\n{body}\n"
    if not m:
        return text.rstrip("\n") + "\n\n" + block
    return text[:m.start()] + block + ("\n" if m.end() < len(text) else "") + text[m.end():]


def metadata(text, prefix, value, after):
    """Set `- prefix: value`, adding the line after `- after:` when the file has none yet."""
    if re.search(r"^- " + re.escape(prefix) + r":", text, re.M):
        return replace_line(text, prefix, value)
    return re.sub(r"^(- " + re.escape(after) + r":.*)$", lambda m: m[1] + f"\n- {prefix}: {value}", text, count=1, flags=re.M)


def fill_reference(reference, main_dir, parallel_dirs):
    """Write only what the evidence proves; an unchanged result leaves the file untouched."""
    main = json.loads((main_dir / "setup-evidence.json").read_text(encoding="utf-8"))
    if main["kind"] != "main":
        raise ValueError("--main must be a main-stack setup run")
    parallel = [json.loads((d / "setup-evidence.json").read_text(encoding="utf-8")) for d in parallel_dirs]
    if any(p["kind"] != "parallel" for p in parallel):
        raise ValueError("--parallel must be parallel-instance setup runs")
    if any(p["recipeDigest"] != main["recipeDigest"] for p in parallel):
        raise ValueError("every setup run must use the same recipe")
    recipe = main["recipeContent"]
    old = reference.read_text(encoding="utf-8")
    if main["status"] != "READY":
        # Unproven fields stay as they are; only the status and its reason change.
        blocked = f"BLOCKED — {main['failedStep']}: {main['reason']}"
        text = replace_line(old, "Status", blocked)
        # A base instance proven earlier is withdrawn too: evidence.py reads only this line.
        text = replace_line(text, "Base instance", blocked.replace("BLOCKED — ", "BLOCKED — main stack: ", 1))
    else:
        text = replace_line(old, "Status", "READY")
        ready = next(iter(recipe["ready"].items()))
        stop = code(recipe["stop"]) if recipe.get("stop") else "terminate the start process group"
        row = f"| `{recipe.get('name', 'app')}` | `{recipe.get('cwd', '.')}` | {code(recipe['start'])} | {ready[0]} {code(ready[1])} | {stop} | `start.log` in the setup evidence |"
        text = re.sub(r"(\| Service \|.*\n\| --- .*\n)(?:\|.*\n)*", lambda m: m[1] + row + "\n", text, count=1)
        names = sorted(set(recipe.get("requires", {}).get("env", [])))
        if names:
            text = replace_line(text, "Required variable names", ", ".join(f"`{n}`" for n in names))
        text = metadata(text, "Setup sample", code(recipe["sample"]), "Applies to")
        failed = [p for p in parallel if p["status"] != "READY" or not p.get("mainStackUntouched", True)]
        if not parallel:
            state = "BLOCKED — no parallel instance was proven"
        elif failed:
            p = failed[0]
            state = f"BLOCKED — {p['ref']}: " + (f"{p['failedStep']}: {p['reason']}" if p["status"] != "READY" else "the main stack changed state while it ran")
        else:
            state = "READY"
        block = {k: v for k, v in recipe.items() if k in instance.RECIPE_KEYS}
        body = ("Used when a suite declares `base` to prove that new-behavior tests can fail.\n"
                "A suite uses it with `\"instance\": \"project-runtime\"`; `evidence.py` reads the JSON below and serves each worktree from it.\n\n"
                f"- Base instance: {state}\n"
                f"- Resources: {RESOURCE_TEXT[recipe['resources']]}\n"
                f"- Proven refs: {', '.join(p['ref'] for p in parallel) or 'none'}\n"
                f"- Shares with the main stack: {', '.join(recipe.get('shares', [])) or 'nothing'}\n\n"
                "```json\n" + json.dumps(block, indent=2, ensure_ascii=False) + "\n```")
        text = section(text, "Base instance", body)
    if text == old:
        print(f"{reference}: unchanged")
        return 0
    text = replace_line(text, "Last verified", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    text = metadata(text, "Setup evidence", ", ".join(f"`{d}`" for d in [main_dir, *parallel_dirs]), "Last verified")
    reference.write_text(text, encoding="utf-8")
    print(f"{reference}: updated")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="mode", required=True)
    d = sub.add_parser("detect", help="list candidate commands and variable names with their sources; runs nothing")
    d.add_argument("--root", type=Path, default=Path.cwd())
    p = sub.add_parser("prove", help="run a recipe: the main stack, or with --ref a parallel instance on its own ports")
    p.add_argument("recipe", type=Path)
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--ref")
    p.add_argument("--root", type=Path, default=Path.cwd())
    f = sub.add_parser("fill", help="write proven fields into project-runtime.md")
    f.add_argument("reference", type=Path)
    f.add_argument("--main", type=Path, required=True)
    f.add_argument("--parallel", type=Path, action="append", default=[])
    args = parser.parse_args()
    if args.mode == "detect":
        print(json.dumps(detect(args.root.resolve()), indent=2, ensure_ascii=False))
        return 0
    if args.mode == "prove":
        return prove(args.root.resolve(), args.recipe.resolve(), args.out.resolve(), args.ref)
    return fill_reference(args.reference.resolve(), args.main.resolve(), [d.resolve() for d in args.parallel])


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(2)
