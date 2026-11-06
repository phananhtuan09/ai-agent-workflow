"""Start, wait for, and stop one app instance from a proven recipe, on its own free ports."""
import os
import re
import signal
import socket
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

RECIPE_KEYS = {"name", "cwd", "resources", "copy", "start", "ready", "stop", "ports", "env", "setup", "timeout", "shares"}
RESOURCES = {"shared", "isolated"}
SECRET_VALUES = re.compile(r"(sk_live_[0-9A-Za-z]{8,}|AKIA[0-9A-Z]{16}|gh[pousr]_[0-9A-Za-z]{30,}|xox[abprs]-[0-9A-Za-z-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)")
SECRET_NAMES = re.compile(r"(TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY|APP_?KEY|PRIVATE_KEY|ACCESS_KEY|CREDENTIAL|DSN|DATABASE_URL)", re.I)
ENV_LINE = re.compile(r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$")
TEMPLATE = re.compile(r"\{([A-Za-z_][A-Za-z0-9_]*)\}")
STOP_TIMEOUT = 60


def argv(value):
    return isinstance(value, list) and bool(value) and all(isinstance(x, str) and x for x in value)


def validate(recipe):
    """Reject a recipe the tool cannot run as written; it is copied verbatim from the project runtime reference."""
    if not isinstance(recipe, dict) or set(recipe) - RECIPE_KEYS:
        raise ValueError("instance takes only " + ", ".join(sorted(RECIPE_KEYS)))
    if not isinstance(recipe.get("cwd", "."), str) or Path(recipe.get("cwd", ".")).is_absolute() or ".." in Path(recipe.get("cwd", ".")).parts:
        raise ValueError("instance cwd is a directory relative to the project root")
    if not argv(recipe.get("start")):
        raise ValueError("instance start must be a nonempty argument array")
    ready = recipe.get("ready")
    if not isinstance(ready, dict) or len(ready) != 1 or not isinstance(next(iter(ready.values())), str) or next(iter(ready)) not in ("url", "log"):
        raise ValueError("instance ready is {\"url\": ...} or {\"log\": <regex>}")
    if "stop" in recipe and not argv(recipe["stop"]):
        raise ValueError("instance stop must be a nonempty argument array")
    ports = recipe.get("ports", {})
    if not isinstance(ports, dict) or any(not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", k) or not isinstance(v, str) for k, v in ports.items()):
        raise ValueError("instance ports map variable names to the main stack's values")
    env = recipe.get("env", {})
    if not isinstance(env, dict) or any(not isinstance(k, str) or not isinstance(v, str) for k, v in env.items()):
        raise ValueError("instance env must map names to string values")
    if set(env) & set(ports):
        raise ValueError("instance env must not repeat a port variable")
    if any(not argv(step) for step in recipe.get("setup", [])):
        raise ValueError("instance setup steps must be nonempty argument arrays")
    if not isinstance(recipe.get("timeout", 120), int) or recipe.get("timeout", 120) <= 0:
        raise ValueError("instance timeout is a positive number of seconds")
    shares = recipe.get("shares")
    if not isinstance(shares, list) or any(not isinstance(x, str) or not x.strip() for x in shares):
        raise ValueError("instance shares lists what it shares with the main stack (database, queues, storage), or []")
    if recipe.get("resources") not in RESOURCES:
        raise ValueError("instance resources is the human's setup choice: shared (the local stack's ports, database, and services) or isolated (fresh ports and its own data)")
    copy = recipe.get("copy", [])
    if not isinstance(copy, list) or any(not isinstance(x, str) or not x or Path(x).is_absolute() or ".." in Path(x).parts for x in copy):
        raise ValueError("instance copy lists local files, relative to the project root, to copy into each worktree")
    return recipe


def env_names(path):
    """Variable names defined in an env file; values are never returned."""
    if not path.is_file():
        return []
    return [m[1] for m in map(ENV_LINE.match, path.read_text(encoding="utf-8", errors="replace").splitlines()) if m]


def secret_values(cwd):
    """Values that must never reach a log excerpt: credential-named variables and every value in a local env file."""
    values = {v for k, v in os.environ.items() if SECRET_NAMES.search(k)}
    for path in Path(cwd).glob(".env*"):
        if path.is_file():
            for m in map(ENV_LINE.match, path.read_text(encoding="utf-8", errors="replace").splitlines()):
                if m:
                    values.add(m[2].strip().strip("'\""))
    return sorted((v for v in values if len(v) >= 4), key=len, reverse=True)


def redact(text, values):
    for value in values:
        text = text.replace(value, "[REDACTED]")
    text = SECRET_VALUES.sub("[REDACTED]", text)
    return re.sub(r"(?im)^(\s*(?:export\s+)?[A-Za-z0-9_]*(?:" + SECRET_NAMES.pattern[1:-1] + r")[A-Za-z0-9_]*\s*[=:]\s*)\S.*$", r"\1[REDACTED]", text)


def excerpt(text, values, lines=20):
    return redact("\n".join(text.splitlines()[-lines:]), values)


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return str(sock.getsockname()[1])


def port_open(port):
    with socket.socket() as sock:
        sock.settimeout(0.5)
        return sock.connect_ex(("127.0.0.1", int(port))) == 0


def fill(value, names):
    return TEMPLATE.sub(lambda m: names.get(m[1], m[0]), value)


def instance_env(recipe, tree, fresh=None):
    """Ports: the local stack's values (shared resources) or fresh free ones (isolated); other values may name a port or {tree}."""
    if fresh is None:
        fresh = recipe.get("resources") == "isolated"
    ports = {k: (free_port() if fresh else v) for k, v in recipe.get("ports", {}).items()}
    names = {**ports, "tree": str(tree)}
    return {**ports, **{k: fill(v, names) for k, v in recipe.get("env", {}).items()}}


def busy_ports(recipe, env):
    return [f"{k}={env[k]}" for k in recipe.get("ports", {}) if port_open(env[k])]


def copy_local(root, tree, recipe):
    """Copy the human's untracked local files (such as .env) into a worktree; their content is never read."""
    copied, missing = [], []
    for name in recipe.get("copy", []):
        source = Path(root) / name
        if source.is_file():
            dest = Path(tree) / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(source.read_bytes())
            copied.append(name)
        else:
            missing.append(name)
    return {"copied": copied, "missing": missing}


def is_ready(recipe, env, log_path):
    kind, target = next(iter(recipe["ready"].items()))
    if kind == "log":
        return log_path.is_file() and re.search(target, log_path.read_text(encoding="utf-8", errors="replace")) is not None
    try:
        with urllib.request.urlopen(fill(target, env), timeout=2) as response:  # nosec B310: local recipe URL
            return response.status < 500
    except urllib.error.HTTPError as error:
        return error.code < 500
    except (urllib.error.URLError, OSError, ValueError):
        return False


class Instance:
    """One started instance; always call stop(), which records whether its ports were released."""

    def __init__(self, recipe, cwd, env, log_path):
        self.recipe, self.cwd, self.env, self.log_path = recipe, Path(cwd), env, Path(log_path)
        self.process, self.record = None, {"ports": {k: env[k] for k in recipe.get("ports", {})}, "ready": False}

    def start(self, extra_env=None):
        """Start and wait for the ready signal; returns None when ready, else the reason."""
        full = {**os.environ, **(extra_env or {}), **self.env}
        self.full_env = full
        busy = busy_ports(self.recipe, self.env)
        if busy:
            return "port already in use: " + ", ".join(busy)
        log = self.log_path.open("w", encoding="utf-8")
        try:
            # The start command is a human-reviewed argument array from the project runtime reference; no shell.
            self.process = subprocess.Popen(self.recipe["start"], cwd=self.cwd, env=full, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)  # nosemgrep: python.lang.security.audit.dangerous-subprocess-use-audit
        except OSError as error:
            log.write(str(error))
            log.close()
            return f"start failed: {error}"
        log.close()
        deadline = time.monotonic() + self.recipe.get("timeout", 120)
        started = time.monotonic()
        while time.monotonic() < deadline:
            if is_ready(self.recipe, self.env, self.log_path):
                self.record.update(ready=True, readySeconds=round(time.monotonic() - started, 1))
                return None
            code = self.process.poll()
            # A detaching start (e.g. `compose up -d`) exits 0 and keeps waiting; any other exit is a failure.
            if code not in (None, 0):
                return f"start exited {code} before the ready signal"
            time.sleep(0.5)
        return f"no ready signal within {self.recipe.get('timeout', 120)}s"

    def stop(self):
        stop = self.recipe.get("stop")
        if stop:
            try:
                done = subprocess.run(stop, cwd=self.cwd, env=getattr(self, "full_env", os.environ), capture_output=True, text=True, timeout=STOP_TIMEOUT)  # nosemgrep: python.lang.security.audit.dangerous-subprocess-use-audit
                self.record["stopExitCode"] = done.returncode
            except (OSError, subprocess.TimeoutExpired) as error:
                self.record["stopExitCode"] = None
                self.record["stopError"] = str(error)[:200]
        if self.process is not None and self.process.poll() is None:
            for sig, wait in ((signal.SIGTERM, 10), (signal.SIGKILL, 5)):
                try:
                    os.killpg(self.process.pid, sig)
                except (ProcessLookupError, PermissionError):
                    break
                try:
                    self.process.wait(wait)
                    break
                except subprocess.TimeoutExpired:
                    continue
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline and any(port_open(v) for v in self.record["ports"].values()):
            time.sleep(0.5)
        if self.log_path.is_file():
            # The app wrote its log raw; nothing leaves this step before the secret values in it are masked.
            values = set(secret_values(self.cwd)) | {v for k, v in getattr(self, "full_env", {}).items() if SECRET_NAMES.search(k) and len(v) >= 4}
            text = self.log_path.read_text(encoding="utf-8", errors="replace")
            self.log_path.write_text(redact(text, sorted(values, key=len, reverse=True)), encoding="utf-8")
        held = [k for k, v in self.record["ports"].items() if port_open(v)]
        self.record["portsReleased"] = not held
        if held:
            self.record["portsHeld"] = held
        return self.record
