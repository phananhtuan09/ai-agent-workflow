#!/usr/bin/env python3
"""Deterministic checks for security-performance-check finding JSON and run summaries."""
import argparse
import base64
import hashlib
import json
import math
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

REF_DIR = Path(__file__).resolve().parents[1] / "references"
SIGNALS = REF_DIR / "security-signals.md"
PERF_SIGNALS = REF_DIR / "performance-signals.md"
TRACKS = ("security", "performance", "both")
SEVERITIES = ("high", "med", "low")
STATUSES = ("exploited", "hypothesis", "unclear")
INTRODUCED = (True, False, "unknown")
VALIDATORS = ("deterministic", "agent", "none")
RISKS = ("high", "med", "low")
TRIGGERS_ALWAYS = "always"
METRIC_CLASSES = ("exact", "noisy")
DIRECTIONS = ("lower_better", "higher_better")
AGGREGATIONS = ("median", "count", "max", "min", "sum")
LEVELS = ("off", "warn", "error")
SOURCES = ("playwright", "http", "build", "lighthouse")
# Project types for the performance track and the collectors each one may use.
PROJECT_TYPES = {
    "web-ui": ("playwright", "http", "build", "lighthouse"),
    "api-only": ("http",),
    "cli": (),
    "mobile": (),
    "library": (),
}
COVERAGE_DECISIONS = ("applies", "skipped")
PROBE_OUTCOMES = ("exploited", "not_exploited", "unclear", "not_run")
# Performance rows whose metric is a request count read straight from the base and head HARs.
HAR_COUNT_SIGNALS = frozenset({"request-count", "background-requests"})
BACKGROUND_WINDOW_MS = 15000
VERDICTS = ("pass", "fail", "informational", "inconclusive")
ACCESS_EXPECTATIONS = ("allow", "deny")
ACCESS_OBSERVED = ("allow", "deny", "unclear")
ACCESS_VERDICTS = ("allowed", "enforced", "bypassed", "unclear")
FINDING_SCHEMA = "security-performance-check/finding@1"
SUMMARY_SCHEMA = "security-performance-check/summary@1"
DEFAULT_AA_MULTIPLIER = 2.5
NOISY_MIN_RUNS = 5
# aa_multiplier * aa_spread must stay within this widening; beyond it the floor is unusable.
MAX_AA_WIDENING = 1.0
# Clamp for higher_better relative factors so base*factor never goes non-positive.
MIN_HIGHER_BETTER_FACTOR = 0.01
# In-place body redaction marker (see references/evidence-contract.md).
REDACTION_MARKER = "«REDACTED»"
# Paths that never count as a hint for a row (tests, fixtures, i18n, …). Rows still always load.
DEFAULT_PATH_EXCLUDES = (
    "**/__tests__/**",
    "**/__mocks__/**",
    "**/__fixtures__/**",
    "**/test/**",
    "**/tests/**",
    "**/spec/**",
    "**/fixtures/**",
    "**/test-utils/**",
    "**/test-helpers/**",
    "**/*test-utils*",
    "**/*test_utils*",
    "**/*test-helpers*",
    "**/*test_helpers*",
    "**/cypress/**",
    "**/e2e/**",
    "**/playwright/**",
    "**/*.test.*",
    "**/*.spec.*",
    "**/*.cy.*",
    "**/*.stories.*",
    "**/storybook/**",
    "**/.storybook/**",
    "**/i18n/**",
    "**/locale/**",
    "**/locales/**",
    "**/lang/**",
    "**/langs/**",
    "**/translation/**",
    "**/translations/**",
    "**/messages/*.json",
    "**/messages/**/*.json",
    "**/*.po",
    "**/*.pot",
)
# Signals that require expected_access / observed_access / access_verdict on every request.
ACCESS_REQUIRED_SIGNALS = frozenset({"authz-route", "object-id-access"})
# Sensitive keys (normalized: alnum only) that must never be allow-listed away.
NEVER_EXEMPTABLE_KEYS = frozenset({
    "password", "passwd", "passwordhash", "pwdhash",
    "privatekey",
})
NEVER_EXEMPTABLE_SHAPES = frozenset({"bcrypt_hash", "argon2_hash", "pem_private_key"})
# MIME types that always require a full stored body under the evidence contract.
TEXTISH_MIME_PREFIXES = ("text/",)
TEXTISH_MIME_EXACT = frozenset({
    "application/json",
    "application/xml",
    "application/javascript",
    "application/xhtml+xml",
    "application/x-www-form-urlencoded",
    "application/graphql",
    "application/ld+json",
})
# Asset bodies skipped by scan-bodies raw-text fallback (and not full-body-enforced unless probed).
ASSET_MIME_PREFIXES = (
    "image/", "font/", "audio/", "video/", "application/font-", "application/octet-stream",
)
ASSET_MIME_EXACT = frozenset({
    "text/css",
    "application/wasm",
    "application/pdf",
    "application/zip",
})
ASSET_URL_SUFFIXES = (
    ".css", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".mp3", ".mp4", ".webm", ".wav", ".pdf", ".map",
)

THRESHOLD_RE = re.compile(
    r"^(?P<left>median|count|max|min|sum)\s*(?P<op><=|>=|<|>)\s*(?P<right>base(?:\s*\*\s*(?P<factor>[0-9]+(?:\.[0-9]+)?))?|(?P<abs_only>-?[0-9]+(?:\.[0-9]+)?))$"
)
ABS_BUDGET_RE = re.compile(
    r"^abs\s*(?P<op><=|>=|<|>)\s*(?P<value>-?[0-9]+(?:\.[0-9]+)?)$"
)
# Placeholder body hashes that mean the agent omitted or reconstructed the body.
PLACEHOLDER_BODY_HASH = re.compile(
    r"^(?:sha256:)?(?:omitted|redacted|truncated|preview|n/?a|\.\.\.|xxx+|0+)$",
    re.IGNORECASE,
)
SHA256_HEX = re.compile(r"^sha256:[0-9a-f]{64}$", re.IGNORECASE)

# Sensitive JSON/key names (case-insensitive) scanned in every saved response body.
SENSITIVE_KEY_NAMES = (
    "password", "passwd", "passwordhash", "password_hash", "pwdhash", "pwd_hash",
    "secret", "clientsecret", "client_secret", "appsecret", "app_secret",
    "apikey", "api_key", "apisecret", "api_secret",
    "accesstoken", "access_token", "refreshtoken", "refresh_token",
    "idtoken", "id_token", "authtoken", "auth_token", "bearertoken",
    "privatekey", "private_key", "secretkey", "secret_key",
    "sessionid", "session_id", "sessiontoken", "session_token",
    "csrftoken", "csrf_token", "verificationtoken", "verification_token",
    "ssn", "socialsecuritynumber", "creditcard", "cardnumber", "pan",
    "cvv", "cvc", "authorization",
)
# Value shapes that are sensitive even under generic keys.
SENSITIVE_VALUE_SHAPES = (
    ("bcrypt_hash", re.compile(r"^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$")),
    ("argon2_hash", re.compile(r"^\$argon2(?:id|i|d)\$")),
    ("jwt", re.compile(r"^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$")),
    ("aws_access_key", re.compile(r"^AKIA[0-9A-Z]{16}$")),
    ("pem_private_key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
)


class Inconsistent(ValueError):
    """A finding or summary file does not match its contract."""


def load(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise Inconsistent(f"{path}: {error}") from None


def text(value):
    return isinstance(value, str) and bool(value.strip())


def cells(line):
    """Split a Markdown table row on unescaped pipes and unescape `\\|`."""
    parts = re.split(r"(?<!\\)\|", line.strip().strip("|"))
    return [p.strip().replace("\\|", "|") for p in parts]


def glob_regex(pattern):
    """A glob where `**` crosses directories and `*` does not; a pattern without `/` matches the file name.

    Matching is case-insensitive so `**/*login*` matches `LoginPage.tsx` on any file system.
    """
    out, i = "", 0
    while i < len(pattern):
        if pattern.startswith("**/", i):
            out, i = out + "(?:.*/)?", i + 3
        elif pattern.startswith("**", i):
            out, i = out + ".*", i + 2
        elif pattern[i] == "*":
            out, i = out + "[^/]*", i + 1
        elif pattern[i] == "?":
            out, i = out + "[^/]", i + 1
        else:
            out, i = out + re.escape(pattern[i]), i + 1
    return re.compile(("(?:^|.*/)" if "/" not in pattern else "^") + out + "$", re.IGNORECASE)


def matcher(patterns):
    compiled = [glob_regex(p) for p in patterns]
    return lambda path: any(r.match(path) for r in compiled)


_EXCLUDE_MATCHER = None


def default_exclude_matcher():
    """Compiled matcher for DEFAULT_PATH_EXCLUDES (tests, fixtures, i18n, …)."""
    global _EXCLUDE_MATCHER
    if _EXCLUDE_MATCHER is None:
        _EXCLUDE_MATCHER = matcher(list(DEFAULT_PATH_EXCLUDES))
    return _EXCLUDE_MATCHER


def is_excluded_path(path, exclude=None):
    """True when path is a default-excluded non-handler asset (or matches exclude)."""
    check = exclude if exclude is not None else default_exclude_matcher()
    return bool(check(path))


def filter_matchable_paths(paths, exclude=None):
    """Drop default-excluded paths before signal matching."""
    return [p for p in paths if not is_excluded_path(p, exclude=exclude)]


def expand_braces(pattern):
    """Expand one `{a,b}` alternative in a glob; call repeatedly for multiple groups."""
    match = re.search(r"\{([^{}]+)\}", pattern)
    if not match:
        return [pattern]
    expanded = []
    for option in match.group(1).split(","):
        expanded.extend(expand_braces(pattern[: match.start()] + option + pattern[match.end() :]))
    return expanded


def split_comma_outside_braces(cell):
    """Split on commas that are not inside `{...}`."""
    parts, buf, depth = [], [], 0
    for ch in cell:
        if ch == "{":
            depth += 1
            buf.append(ch)
        elif ch == "}":
            depth = max(0, depth - 1)
            buf.append(ch)
        elif ch == "," and depth == 0:
            parts.append("".join(buf))
            buf = []
        else:
            buf.append(ch)
    parts.append("".join(buf))
    return parts


def parse_patterns(cell):
    raw = [p.strip().strip("`") for p in split_comma_outside_braces(cell) if p.strip()]
    out = []
    for pattern in raw:
        out.extend(expand_braces(pattern))
    return out


def load_signals(path=SIGNALS):
    """Parse the Signals table from security-signals.md into row dicts."""
    content = Path(path).read_text(encoding="utf-8")
    rows, in_table = [], False
    for line in content.splitlines():
        if line.startswith("## Signals"):
            in_table = True
            continue
        if in_table and line.startswith("## "):
            break
        if not in_table or not line.startswith("|"):
            continue
        cols = cells(line)
        if len(cols) < 8 or cols[0] in ("id", "---") or cols[0].startswith("---"):
            continue
        if all(set(c) <= {"-", " "} for c in cols):
            continue
        # 9 columns: id, trigger, path hints, content hints, risk, …; an older 8-column copy has no content hints.
        content_hints = parse_content_hints(cols[3]) if len(cols) >= 9 else []
        if len(cols) >= 9:
            cols = cols[:3] + cols[4:]
        signal_id = cols[0].strip().strip("`")
        trigger = cols[1].strip().strip("`")
        patterns = parse_patterns(cols[2])
        risk = cols[3].strip().strip("`")
        if risk not in RISKS:
            raise Inconsistent(f"{path}: signal {signal_id}: risk is one of {', '.join(RISKS)}")
        if trigger != TRIGGERS_ALWAYS and not trigger.startswith("tag:"):
            raise Inconsistent(f"{path}: signal {signal_id}: trigger is always or tag:<name>")
        rows.append({
            "id": signal_id,
            "trigger": trigger,
            "patterns": patterns,
            "content_hints": content_hints,
            "risk": risk,
            "static_check": cols[4].strip(),
            "runtime_probe": cols[5].strip(),
            "validator": cols[6].strip().strip("`"),
            "do_not_flag": cols[7].strip(),
        })
    if not rows:
        raise Inconsistent(f"{path}: no signal rows found")
    for row in rows:
        if row["validator"] not in VALIDATORS:
            raise Inconsistent(f"{path}: signal {row['id']}: validator is one of {', '.join(VALIDATORS)}")
    return rows


# Prose files never count as content hints: a README that says "login" changes no behavior.
CONTENT_HINT_SKIP = ("**/*.md", "**/*.mdx", "**/*.rst", "**/*.txt", "**/*.adoc", "**/docs/**",
                     "**/CHANGELOG*", "**/LICENSE*")

def parse_content_hints(cell):
    """Backticked literal tokens (case-insensitive substrings of changed lines)."""
    return [t for t in re.findall(r"`([^`]+)`", cell) if t.strip()]


def _is_prose(path):
    return matcher(list(CONTENT_HINT_SKIP))(path)


def row_hints(row, path_list, changes=None):
    """Paths that hint a row: a path pattern hit or a content token in that file's changed lines.

    Hints only rank rows for the agent; they never decide whether a row loads.
    """
    by_path = matcher(row["patterns"]) if row["patterns"] else (lambda _p: False)
    tokens = [t.lower() for t in row.get("content_hints") or []]
    hits = []
    for p in path_list:
        body = "" if _is_prose(p) else (changes or {}).get(p) or ""
        if by_path(p) or (tokens and any(t in body.lower() for t in tokens)):
            hits.append(p)
    return hits


def hinted_paths(rows, paths, changes=None, exclude=None):
    """{row id: [paths]} for rows with at least one hint."""
    path_list = filter_matchable_paths(list(paths), exclude=exclude)
    out = {}
    for row in rows:
        if row.get("level") == "off":
            continue
        hits = row_hints(row, path_list, changes)
        if hits:
            out[row["id"]] = hits
    return out


def match_signals(rows, paths, signals_file="references/security-signals.md", exclude=None, changes=None):
    """Build signals_loaded[]: every security row loads; matched_paths lists the hinted paths.

    `changes` maps a path to its changed diff lines so content hints work for any language.
    Paths under DEFAULT_PATH_EXCLUDES (tests, fixtures, i18n/locale, …) never count as a hint.
    """
    path_list = filter_matchable_paths(list(paths), exclude=exclude)
    return [
        {"id": row["id"], "file": signals_file, "matched_paths": row_hints(row, path_list, changes)}
        for row in rows
    ]


def load_performance_signals(path=PERF_SIGNALS):
    """Parse the Signals table from performance-signals.md into row dicts."""
    content = Path(path).read_text(encoding="utf-8")
    rows, in_table = [], False
    for line in content.splitlines():
        if line.startswith("## Signals"):
            in_table = True
            continue
        if in_table and line.startswith("## "):
            break
        if not in_table or not line.startswith("|"):
            continue
        cols = cells(line)
        if len(cols) < 10 or cols[0] in ("id", "---") or cols[0].startswith("---"):
            continue
        if all(set(c) <= {"-", " "} for c in cols):
            continue
        # 11 columns add content hints after route_pattern; an older 10-column copy has none.
        content_hints = parse_content_hints(cols[8]) if len(cols) >= 11 else []
        if len(cols) >= 11:
            cols = cols[:8] + cols[9:]
        signal_id = cols[0].strip().strip("`")
        metric_class = cols[1].strip().strip("`")
        sources = tuple(s.strip().strip("`") for s in cols[2].split(",") if s.strip())
        source = sources[0] if sources else ""
        direction = cols[3].strip().strip("`")
        aggregation = cols[4].strip().strip("`")
        threshold = cols[5].strip().strip("`")
        try:
            min_runs = int(cols[6].strip().strip("`"))
        except ValueError as error:
            raise Inconsistent(f"{path}: signal {signal_id}: min_runs_per_side is an integer") from error
        patterns = parse_patterns(cols[7])
        level = cols[8].strip().strip("`")
        fix_hint = cols[9].strip()
        if metric_class not in METRIC_CLASSES:
            raise Inconsistent(f"{path}: signal {signal_id}: metric_class is one of {', '.join(METRIC_CLASSES)}")
        if not sources or any(s not in SOURCES for s in sources):
            raise Inconsistent(f"{path}: signal {signal_id}: source lists one or more of {', '.join(SOURCES)}")
        if direction not in DIRECTIONS:
            raise Inconsistent(f"{path}: signal {signal_id}: direction is one of {', '.join(DIRECTIONS)}")
        if aggregation not in AGGREGATIONS:
            raise Inconsistent(f"{path}: signal {signal_id}: aggregation is one of {', '.join(AGGREGATIONS)}")
        if level not in LEVELS:
            raise Inconsistent(f"{path}: signal {signal_id}: level is one of {', '.join(LEVELS)}")
        if min_runs < 1:
            raise Inconsistent(f"{path}: signal {signal_id}: min_runs_per_side is at least 1")
        if metric_class == "noisy" and min_runs < NOISY_MIN_RUNS:
            raise Inconsistent(f"{path}: signal {signal_id}: noisy metrics need min_runs_per_side >= {NOISY_MIN_RUNS}")
        parse_threshold(threshold)  # validate grammar
        rows.append({
            "id": signal_id,
            "metric_class": metric_class,
            "source": source,
            "sources": sources,
            "direction": direction,
            "aggregation": aggregation,
            "threshold": threshold,
            "min_runs_per_side": min_runs,
            "patterns": patterns,
            "content_hints": content_hints,
            "level": level,
            "fix_hint": fix_hint,
        })
    if not rows:
        raise Inconsistent(f"{path}: no signal rows found")
    return rows


def match_performance_signals(rows, paths, signals_file="references/performance-signals.md",
                               exclude=None, changes=None):
    """Build signals_loaded[]: every row except `level: off` loads; matched_paths lists hinted paths."""
    path_list = filter_matchable_paths(list(paths), exclude=exclude)
    return [
        {"id": row["id"], "file": signals_file, "matched_paths": row_hints(row, path_list, changes)}
        for row in rows
        if row["level"] != "off"
    ]


def parse_unified_diff(diff_text):
    """{path: changed lines joined by newlines} from a unified diff (added and removed lines)."""
    changes, current, source = {}, None, None
    for line in diff_text.splitlines():
        if line.startswith("--- "):
            raw = line[4:].strip().split("\t")[0]
            source = None if raw == "/dev/null" else re.sub(r"^a/", "", raw)
            continue
        if line.startswith("+++ "):
            raw = line[4:].strip().split("\t")[0]
            current = source if raw == "/dev/null" else re.sub(r"^b/", "", raw)
            if current is not None:
                changes.setdefault(current, "")
            continue
        if current is None:
            continue
        if line.startswith(("+", "-")):
            changes[current] += line[1:] + "\n"
    return changes


def parse_threshold(text_value):
    """Parse `median < base*1.10` / `count <= base` plus optional `; abs < N` budget."""
    if not text(text_value):
        raise Inconsistent("threshold is a nonempty string")
    parts = [p.strip() for p in text_value.split(";") if p.strip()]
    if not parts:
        raise Inconsistent(f"threshold grammar invalid: {text_value!r}")
    primary = THRESHOLD_RE.match(parts[0])
    if not primary:
        raise Inconsistent(
            f"threshold grammar invalid: {parts[0]!r}; expected e.g. median < base*1.10 or count <= base"
        )
    result = {
        "left": primary.group("left"),
        "op": primary.group("op"),
        "relative_to_base": primary.group("right").startswith("base"),
        "factor": float(primary.group("factor")) if primary.group("factor") else (1.0 if primary.group("right").startswith("base") else None),
        "absolute_only": float(primary.group("abs_only")) if primary.group("abs_only") is not None else None,
        "abs_budget": None,
    }
    if len(parts) > 2:
        raise Inconsistent(f"threshold has at most one absolute budget clause: {text_value!r}")
    if len(parts) == 2:
        budget = ABS_BUDGET_RE.match(parts[1])
        if not budget:
            raise Inconsistent(f"absolute budget grammar invalid: {parts[1]!r}; expected e.g. abs < 2500")
        result["abs_budget"] = {"op": budget.group("op"), "value": float(budget.group("value"))}
    return result


def median(values):
    """Return the median of a nonempty numeric sequence."""
    data = sorted(float(v) for v in values)
    if not data:
        raise Inconsistent("median needs at least one value")
    mid = len(data) // 2
    if len(data) % 2:
        return data[mid]
    return (data[mid - 1] + data[mid]) / 2.0


def value_range(values):
    """Return (min, max) for a nonempty numeric sequence."""
    data = [float(v) for v in values]
    if not data:
        raise Inconsistent("range needs at least one value")
    return min(data), max(data)


def aggregate_values(values, how):
    """Aggregate sample values. For `count`, values are already per-run counts (median when n>1)."""
    data = [float(v) for v in values]
    if not data:
        raise Inconsistent(f"{how} needs at least one value")
    if how == "median":
        return median(data)
    if how == "count":
        return median(data) if len(data) > 1 else data[0]
    if how == "max":
        return max(data)
    if how == "min":
        return min(data)
    if how == "sum":
        return float(sum(data))
    raise Inconsistent(f"aggregation is one of {', '.join(AGGREGATIONS)}")


def side_stats(values, how="median"):
    data = [float(v) for v in values]
    if not data:
        raise Inconsistent("side stats need at least one value")
    low, high = value_range(data)
    return {
        "median": median(data),
        "min": low,
        "max": high,
        "n": len(data),
        "value": aggregate_values(data, how),
    }


def delta_pct(base_value, head_value):
    base_value = float(base_value)
    head_value = float(head_value)
    if base_value == 0:
        if head_value == 0:
            return 0.0
        return math.inf if head_value > 0 else -math.inf
    return ((head_value - base_value) / abs(base_value)) * 100.0


def compare(op, left, right):
    if op == "<":
        return left < right
    if op == "<=":
        return left <= right
    if op == ">":
        return left > right
    if op == ">=":
        return left >= right
    raise Inconsistent(f"unsupported operator {op}")


def aa_spread(values_a, values_b, how="median"):
    """Relative spread between two A/A sides: |a-b| / max(|a|, |b|, 1)."""
    a = aggregate_values(values_a, how)
    b = aggregate_values(values_b, how)
    denom = max(abs(a), abs(b), 1.0)
    return abs(a - b) / denom


def direction_from_op(op):
    """Infer lower_better / higher_better from the threshold comparison operator."""
    if op in ("<", "<="):
        return "lower_better"
    if op in (">", ">="):
        return "higher_better"
    raise Inconsistent(f"unsupported operator {op}")


def effective_relative_factor(parsed, aa_spread_value=None, aa_multiplier=DEFAULT_AA_MULTIPLIER):
    """Return the relative factor used for base*factor after applying the A/A floor."""
    if not parsed["relative_to_base"]:
        return None
    configured = parsed["factor"] if parsed["factor"] is not None else 1.0
    if aa_spread_value is None:
        return configured
    widening = aa_multiplier * float(aa_spread_value)
    # For lower_better thresholds like median < base*1.10, factor is > 1.
    # For higher_better like median > base*0.90, factor is < 1; floor from A/A still widens the band.
    if configured >= 1.0:
        return max(configured, 1.0 + widening)
    # higher_better: widen downward, but never to a non-positive factor.
    return max(MIN_HIGHER_BETTER_FACTOR, min(configured, 1.0 - widening))


def evaluate_threshold(base_values, head_values, threshold_text, direction=None,
                       metric_class="exact", min_runs=1, aa_values=None, aa_multiplier=DEFAULT_AA_MULTIPLIER,
                       aggregation=None):
    """Compare head to base (and optional abs budget) with an A/A noise floor for noisy metrics."""
    parsed = parse_threshold(threshold_text)
    expr_agg = parsed["left"]
    if aggregation is not None and aggregation != expr_agg:
        raise Inconsistent(
            f"--aggregation {aggregation} conflicts with expression aggregate {expr_agg}"
        )
    how = aggregation or expr_agg
    if how not in AGGREGATIONS:
        raise Inconsistent(f"aggregation is one of {', '.join(AGGREGATIONS)}")
    inferred_direction = direction_from_op(parsed["op"])
    if direction is not None and direction != inferred_direction:
        raise Inconsistent(
            f"--direction {direction} conflicts with expression operator {parsed['op']} "
            f"(implies {inferred_direction})"
        )
    if len(base_values) < min_runs or len(head_values) < min_runs:
        return {
            "verdict": "inconclusive",
            "reason": f"need at least {min_runs} run(s) per side; got base={len(base_values)} head={len(head_values)}",
            "base": side_stats(base_values, how) if base_values else None,
            "head": side_stats(head_values, how) if head_values else None,
            "delta_pct": None,
            "threshold": threshold_text,
            "effective_factor": None,
            "aa_spread": None,
        }
    base = side_stats(base_values, how)
    head = side_stats(head_values, how)
    base_value = base["value"]
    head_value = head["value"]
    spread = None
    if aa_values is not None:
        if len(aa_values) < 2:
            raise Inconsistent("aa_values needs two nonempty sides: [[a...],[b...]]")
        side_a, side_b = aa_values[0], aa_values[1]
        if not side_a or not side_b:
            raise Inconsistent("aa_values sides must be nonempty")
        spread = aa_spread(side_a, side_b, how)

    # Excessive A/A floor is unusable: report inconclusive instead of silently passing.
    if spread is not None and (aa_multiplier * float(spread)) >= MAX_AA_WIDENING:
        return {
            "verdict": "inconclusive",
            "reason": (
                f"A/A spread {spread:.6g} with multiplier {aa_multiplier} exceeds usable noise floor "
                f"(max widening {MAX_AA_WIDENING})"
            ),
            "base": base,
            "head": head,
            "delta_pct": delta_pct(base_value, head_value),
            "threshold": threshold_text,
            "effective_factor": None,
            "aa_spread": spread,
        }

    effective_factor = effective_relative_factor(parsed, spread, aa_multiplier)
    if parsed["relative_to_base"]:
        right = base_value * effective_factor
    else:
        right = parsed["absolute_only"]

    # Relative thresholds with base 0: base*factor is 0, so strict `<` / `>` reject equal zeros
    # (`0 < 0`). Use non-strict equality for that zero-base case so identical samples pass;
    # any nonzero head still fails a lower_better relative threshold (and must clear `>` / `>=`
    # for higher_better). See performance-signals.md.
    op = parsed["op"]
    if parsed["relative_to_base"] and base_value == 0.0:
        if op == "<":
            op = "<="
        elif op == ">":
            op = ">="

    relative_ok = compare(op, head_value, right)
    abs_ok = True
    if parsed["abs_budget"] is not None:
        abs_ok = compare(parsed["abs_budget"]["op"], head_value, parsed["abs_budget"]["value"])

    # Noisy metric inside the A/A-widened band (fails raw configured factor, passes floor) → informational.
    inside_noise = False
    if metric_class == "noisy" and spread is not None and parsed["relative_to_base"]:
        configured = parsed["factor"] if parsed["factor"] is not None else 1.0
        raw_op = parsed["op"]
        if base_value == 0.0:
            if raw_op == "<":
                raw_op = "<="
            elif raw_op == ">":
                raw_op = ">="
        raw_ok = compare(raw_op, head_value, base_value * configured)
        if (not raw_ok) and relative_ok:
            inside_noise = True

    ok = relative_ok and abs_ok
    if inside_noise and abs_ok:
        verdict = "informational"
    elif ok:
        verdict = "pass"
    else:
        verdict = "fail"

    return {
        "verdict": verdict,
        "reason": None,
        "base": base,
        "head": head,
        "delta_pct": delta_pct(base_value, head_value),
        "threshold": threshold_text,
        "effective_factor": effective_factor,
        "aa_spread": spread,
        "relative_ok": relative_ok,
        "abs_ok": abs_ok,
    }


SENSITIVE_HEADERS = ("cookie", "authorization", "set-cookie")
# Header values that look like intentional redaction placeholders.
PLACEHOLDER_VALUE = re.compile(
    r"^(?:<[^<>]+>|\$[A-Za-z_][A-Za-z0-9_]*|\*{2,}|REDACTED)$",
    re.IGNORECASE,
)
# Cookie / Authorization / Set-Cookie appearances in repro_curl (e.g. -H 'Cookie: …').
SENSITIVE_IN_CURL = re.compile(
    r"(?i)(?:^|[\s\"'])(Cookie|Authorization|Set-Cookie)\s*:\s*([^\r\n\"']+)"
)


def is_placeholder(value):
    """True when a sensitive header value is a placeholder, not a real secret."""
    if not isinstance(value, str):
        return False
    v = value.strip().strip("'\"")
    for prefix in ("Bearer ", "Basic ", "Token "):
        if v.lower().startswith(prefix.lower()):
            v = v[len(prefix) :].strip()
            break
    return bool(v) and bool(PLACEHOLDER_VALUE.fullmatch(v))


def check_sensitive_header(name, value, where):
    if name.lower() not in SENSITIVE_HEADERS:
        return
    if not is_placeholder(value):
        raise Inconsistent(
            f"{where}: {name} value must be a placeholder "
            f"(e.g. <redacted>, REDACTED, $TOKEN, ***); got {value!r}"
        )


def check_repro_curl(curl, where):
    if not text(curl):
        return
    for match in SENSITIVE_IN_CURL.finditer(curl):
        check_sensitive_header(match.group(1), match.group(2).strip(), where)


def body_sha256(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()


def utf8_size(text_value: str) -> int:
    return len(text_value.encode("utf-8"))


def is_placeholder_body_hash(value):
    if not isinstance(value, str) or not value.strip():
        return True
    return bool(PLACEHOLDER_BODY_HASH.fullmatch(value.strip()))


def derive_access_verdict(expected_access, observed_access):
    """Derive access_verdict from expected vs observed; None when observed is unclear."""
    if expected_access not in ACCESS_EXPECTATIONS or observed_access not in ACCESS_OBSERVED:
        return None
    if observed_access == "unclear":
        return "unclear"
    if expected_access == "allow" and observed_access == "allow":
        return "allowed"
    if expected_access == "deny" and observed_access == "deny":
        return "enforced"
    if expected_access == "deny" and observed_access == "allow":
        return "bypassed"
    # expected allow, observed deny — unexpected deny, not a bypass
    return "enforced"


def check_access_classification(entry, where, *, require_access_fields=False):
    """Validate expected_access / observed_access / access_verdict consistency.

    When require_access_fields is true (authz-route / object-id-access), role is already
    required by check_request, and expected_access, observed_access, and access_verdict
    must all be present and consistent with the derivation table.
    """
    expected = entry.get("expected_access")
    observed = entry.get("observed_access")
    verdict = entry.get("access_verdict")
    authorized = entry.get("caller_authorized")

    if require_access_fields:
        if expected is None:
            raise Inconsistent(f"{where}: expected_access is required for this signal")
        if observed is None:
            raise Inconsistent(f"{where}: observed_access is required for this signal")
        if verdict is None:
            raise Inconsistent(f"{where}: access_verdict is required for this signal")

    if expected is not None and expected not in ACCESS_EXPECTATIONS:
        raise Inconsistent(f"{where}: expected_access is one of {', '.join(ACCESS_EXPECTATIONS)}")
    if observed is not None and observed not in ACCESS_OBSERVED:
        raise Inconsistent(f"{where}: observed_access is one of {', '.join(ACCESS_OBSERVED)}")
    if verdict is not None and verdict not in ACCESS_VERDICTS:
        raise Inconsistent(f"{where}: access_verdict is one of {', '.join(ACCESS_VERDICTS)}")
    if authorized is not None and not isinstance(authorized, bool):
        raise Inconsistent(f"{where}: caller_authorized is a boolean when present")

    if verdict is not None and (expected is None or observed is None):
        raise Inconsistent(
            f"{where}: access_verdict requires expected_access and observed_access"
        )

    if authorized is True:
        if expected is None:
            raise Inconsistent(f"{where}: caller_authorized true requires expected_access allow")
        if expected != "allow":
            raise Inconsistent(f"{where}: caller_authorized true requires expected_access allow")

    if verdict == "bypassed":
        if expected is None or observed is None:
            raise Inconsistent(
                f"{where}: access_verdict bypassed requires expected_access and observed_access"
            )
        if expected == "allow":
            raise Inconsistent(
                f"{where}: access_verdict bypassed is invalid when expected_access is allow "
                "(authorized callers are allowed, not bypassed)"
            )
        if authorized is True:
            raise Inconsistent(
                f"{where}: access_verdict bypassed is invalid when caller_authorized is true"
            )

    if expected is not None and observed is not None and observed != "unclear":
        derived = derive_access_verdict(expected, observed)
        if verdict is not None and verdict != derived:
            raise Inconsistent(
                f"{where}: access_verdict {verdict!r} disagrees with derived {derived!r} "
                f"from expected_access={expected!r} observed_access={observed!r}"
            )
    elif require_access_fields and expected is not None and observed == "unclear":
        if verdict != "unclear":
            raise Inconsistent(
                f"{where}: observed_access unclear requires access_verdict unclear"
            )


def check_request(entry, where, signal_id=None):
    if not isinstance(entry, dict):
        raise Inconsistent(f"{where}: each request is an object")
    if not text(entry.get("role")) or not text(entry.get("method")) or not text(entry.get("url")):
        raise Inconsistent(f"{where}: role, method, and url are required")
    if not isinstance(entry.get("status"), int) or isinstance(entry.get("status"), bool):
        raise Inconsistent(f"{where}: status is an HTTP status integer")
    if not isinstance(entry.get("length"), int) or isinstance(entry.get("length"), bool) or entry["length"] < 0:
        raise Inconsistent(f"{where}: length is a non-negative integer")
    body_hash = entry.get("body_hash")
    if not text(body_hash):
        raise Inconsistent(f"{where}: body_hash is a nonempty string")
    if is_placeholder_body_hash(body_hash):
        raise Inconsistent(
            f"{where}: body_hash must be the real sha256 of the stored body; "
            f"placeholder {body_hash!r} is rejected"
        )
    if not SHA256_HEX.fullmatch(body_hash.strip()):
        raise Inconsistent(
            f"{where}: body_hash must look like sha256:<64 hex chars>; got {body_hash!r}"
        )
    if entry["length"] == 0 and body_hash.strip().lower() != body_sha256(b"").lower():
        empty_digest = body_sha256(b"")
        raise Inconsistent(
            f"{where}: body_hash for length 0 must be the sha256 of empty bytes ({empty_digest})"
        )
    require_access = signal_id in ACCESS_REQUIRED_SIGNALS if signal_id else False
    check_access_classification(entry, where, require_access_fields=require_access)
    headers = entry.get("headers")
    if headers is not None:
        if not isinstance(headers, dict):
            raise Inconsistent(f"{where}: headers is an object when present")
        for name, value in headers.items():
            if not text(name):
                raise Inconsistent(f"{where}: header names are nonempty strings")
            if not isinstance(value, str):
                raise Inconsistent(f"{where}: header {name!r} value is a string")
            check_sensitive_header(name, value, where)


def check_redaction_meta(content, body_text, where):
    """Validate optional _spc_redaction on HAR content; return True when present."""
    meta = content.get("_spc_redaction")
    if meta is None:
        return False
    if not isinstance(meta, dict):
        raise Inconsistent(f"{where}: _spc_redaction is an object")
    marker = meta.get("marker")
    if marker != REDACTION_MARKER:
        raise Inconsistent(
            f"{where}: _spc_redaction.marker must be {REDACTION_MARKER!r}; got {marker!r}"
        )
    paths = meta.get("paths")
    ranges = meta.get("ranges")
    if not isinstance(paths, list) or any(not text(p) for p in paths):
        raise Inconsistent(f"{where}: _spc_redaction.paths is a nonempty-string list")
    if ranges is None:
        ranges = []
    if not isinstance(ranges, list):
        raise Inconsistent(f"{where}: _spc_redaction.ranges is a list when present")
    if ranges and not paths:
        raise Inconsistent(f"{where}: _spc_redaction.paths is required when ranges are listed")
    marker_len = len(REDACTION_MARKER)
    for i, span in enumerate(ranges):
        rwhere = f"{where}: _spc_redaction.ranges[{i}]"
        if (
            not isinstance(span, (list, tuple))
            or len(span) != 2
            or not all(isinstance(x, int) and not isinstance(x, bool) for x in span)
        ):
            raise Inconsistent(f"{rwhere}: is [start, end) of integers")
        start, end = span
        if start < 0 or end < start or end > len(body_text):
            raise Inconsistent(f"{rwhere}: offsets fall inside the stored body text")
        if end - start != marker_len or body_text[start:end] != REDACTION_MARKER:
            raise Inconsistent(
                f"{rwhere}: range must cover the marker {REDACTION_MARKER!r} in the stored text"
            )
    return True


def normalize_mime(mime):
    if not isinstance(mime, str):
        return ""
    return mime.lower().split(";")[0].strip()


def is_textish_mime(mime):
    """True for text / JSON / HTML / XML / form bodies that always need a full stored body."""
    m = normalize_mime(mime)
    if not m:
        return False
    if m in TEXTISH_MIME_EXACT or m.endswith("+json") or m.endswith("+xml"):
        return True
    return any(m.startswith(p) for p in TEXTISH_MIME_PREFIXES)


def is_asset_mime(mime):
    m = normalize_mime(mime)
    if not m:
        return False
    if m in ASSET_MIME_EXACT:
        return True
    return any(m.startswith(p) for p in ASSET_MIME_PREFIXES)


def is_asset_url(url):
    if not isinstance(url, str) or not url.strip():
        return False
    path = urlsplit(url).path.lower()
    return any(path.endswith(suf) for suf in ASSET_URL_SUFFIXES)


def normalize_url_for_match(url):
    """Normalize a request URL for finding↔HAR matching (scheme/host optional)."""
    if not isinstance(url, str):
        return ""
    raw = url.strip()
    if not raw:
        return ""
    parts = urlsplit(raw)
    if parts.scheme or parts.netloc:
        path = parts.path or "/"
        return urlunsplit(("", "", path, parts.query, ""))
    if raw.startswith("/"):
        return raw
    return raw


def urls_match(finding_url, har_url):
    if finding_url == har_url:
        return True
    a = normalize_url_for_match(finding_url)
    b = normalize_url_for_match(har_url)
    if a and b and a == b:
        return True
    if isinstance(finding_url, str) and isinstance(har_url, str):
        if har_url.endswith(finding_url) or finding_url.endswith(har_url):
            return True
    return False


def entry_needs_full_body(entry, *, force=False):
    """Full-body rules apply to probed entries and to text/JSON/HTML mime types."""
    if force:
        return True
    response = entry.get("response") if isinstance(entry, dict) else None
    content = response.get("content") if isinstance(response, dict) else None
    mime = (content or {}).get("mimeType") if isinstance(content, dict) else None
    if is_textish_mime(mime):
        return True
    request = entry.get("request") if isinstance(entry, dict) else None
    url = request.get("url") if isinstance(request, dict) else None
    # Non-textish static assets are not required to carry an embedded body.
    if is_asset_mime(mime) or is_asset_url(url):
        return False
    return False


def resolve_har_body_bytes(content, har_path, where):
    """Return (body_bytes|None, body_text|None) from HAR content.text / encoding / _file."""
    file_ref = content.get("_file")
    if file_ref is not None:
        if not text(file_ref):
            raise Inconsistent(f"{where}: content._file is a nonempty string when present")
        if not har_path or har_path == "<har>":
            raise Inconsistent(
                f"{where}: content._file {file_ref!r} requires a real HAR file path to resolve"
            )
        sidecar = Path(file_ref)
        if not sidecar.is_absolute():
            sidecar = Path(har_path).resolve().parent / file_ref
        if not sidecar.is_file():
            raise Inconsistent(
                f"{where}: content._file {file_ref!r} is missing (expected at {sidecar})"
            )
        body_bytes = sidecar.read_bytes()
        try:
            body_text = body_bytes.decode("utf-8")
        except UnicodeDecodeError:
            body_text = None
        return body_bytes, body_text

    body_text = content.get("text")
    if body_text is None:
        return None, None
    if not isinstance(body_text, str):
        raise Inconsistent(f"{where}: content.text is a string when present")
    encoding = content.get("encoding")
    if isinstance(encoding, str) and encoding.strip().lower() == "base64":
        try:
            body_bytes = base64.b64decode(body_text, validate=False)
        except (ValueError, TypeError) as error:
            raise Inconsistent(f"{where}: content.text is not valid base64: {error}") from None
        try:
            decoded_text = body_bytes.decode("utf-8")
        except UnicodeDecodeError:
            decoded_text = None
        return body_bytes, decoded_text
    if encoding is not None and not (isinstance(encoding, str) and encoding.strip() == ""):
        # Unknown encoding: treat text as opaque UTF-8 storage of the declared body.
        if not isinstance(encoding, str):
            raise Inconsistent(f"{where}: content.encoding is a string when present")
    return body_text.encode("utf-8"), body_text


def check_har_entry(entry, where, index=0, har_path="<har>", *, force_full_body=False):
    """Validate one HAR log.entries[] item against the evidence contract."""
    if not isinstance(entry, dict):
        raise Inconsistent(f"{where}: entry is an object")
    request = entry.get("request") if isinstance(entry.get("request"), dict) else {}
    response = entry.get("response")
    if not isinstance(response, dict):
        raise Inconsistent(f"{where}: response is an object")
    content = response.get("content")
    if not isinstance(content, dict):
        raise Inconsistent(f"{where}: response.content is an object")
    size = content.get("size")
    if not isinstance(size, int) or isinstance(size, bool) or size < 0:
        raise Inconsistent(f"{where}: content.size is a non-negative integer")

    needs_body = entry_needs_full_body(entry, force=force_full_body)
    body_bytes, body_text = resolve_har_body_bytes(content, har_path, where)

    if body_bytes is None:
        if size > 0 and needs_body:
            raise Inconsistent(
                f"{where}: content.text or content._file is required when content.size > 0 "
                "(full body required for probed / text-JSON-HTML responses; "
                "do not omit, truncate, or reconstruct)"
            )
        # Non-probed binary/asset entry without an embedded body: do not fail the HAR.
        return {
            "index": index,
            "method": request.get("method"),
            "url": request.get("url"),
            "status": response.get("status"),
            "mimeType": content.get("mimeType"),
            "text": "",
            "size": size,
            "sha256": body_sha256(b""),
            "body_present": False,
            "allow": [],
        }

    if size != len(body_bytes):
        encoding = content.get("encoding")
        via = "decoded base64 length" if (
            isinstance(encoding, str) and encoding.strip().lower() == "base64"
        ) else ("sidecar file length" if content.get("_file") else "stored body UTF-8 length")
        raise Inconsistent(
            f"{where}: content.size {size} differs from {via} {len(body_bytes)}"
        )

    scan_text = body_text if body_text is not None else ""
    if body_text is not None:
        has_meta = check_redaction_meta(content, body_text, where)
        markers = body_text.count(REDACTION_MARKER)
        if markers and not has_meta:
            raise Inconsistent(
                f"{where}: body holds {REDACTION_MARKER!r} but no _spc_redaction metadata "
                "(redact with check_findings.py redact)"
            )
        if has_meta and len(content["_spc_redaction"].get("ranges") or []) != markers:
            raise Inconsistent(
                f"{where}: _spc_redaction.ranges lists {len(content['_spc_redaction'].get('ranges') or [])} "
                f"span(s) but the stored body holds {markers} marker(s)"
            )
    elif content.get("_spc_redaction") is not None:
        raise Inconsistent(f"{where}: _spc_redaction requires a UTF-8 body text")

    allow = parse_scan_allow(content.get("_spc_scan_allow"), where)
    return {
        "index": index,
        "method": request.get("method"),
        "url": request.get("url"),
        "status": response.get("status"),
        "mimeType": content.get("mimeType"),
        "text": scan_text,
        "size": size,
        "sha256": body_sha256(body_bytes),
        "body_present": True,
        "allow": allow,
    }


def check_har(data, path="<har>", probed_requests=None):
    """Validate a HAR document; return normalized entry summaries.

    Full-body rules are enforced for text/JSON/HTML mime types and for entries that
    match probed_requests (list of finding request dicts with method/url).
    """
    if not isinstance(data, dict):
        raise Inconsistent(f"{path}: HAR must be an object")
    log = data.get("log")
    if not isinstance(log, dict):
        raise Inconsistent(f"{path}: log is an object")
    entries = log.get("entries")
    if not isinstance(entries, list) or not entries:
        raise Inconsistent(f"{path}: log.entries is a nonempty list")
    probed = list(probed_requests or [])
    summaries = []
    for i, entry in enumerate(entries):
        force = False
        if probed and isinstance(entry, dict):
            req = entry.get("request") if isinstance(entry.get("request"), dict) else {}
            method = (req.get("method") or "").upper()
            url = req.get("url")
            for pref in probed:
                if not isinstance(pref, dict):
                    continue
                if (pref.get("method") or "").upper() == method and urls_match(pref.get("url"), url):
                    force = True
                    break
        summaries.append(
            check_har_entry(
                entry,
                f"{path}: entries[{i}]",
                index=i,
                har_path=path,
                force_full_body=force,
            )
        )
    return summaries


def sensitive_value_is_empty(value):
    """True when a sensitive key's value is null/empty/false and must not count as a hit."""
    if value is None or value is False:
        return True
    if value == "" or value == [] or value == {}:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False


def normalize_sensitive_key(key):
    return re.sub(r"[^a-z0-9]", "", str(key).lower())


def parse_scan_allow(raw, where):
    """Parse _spc_scan_allow: [{key, reason}, ...] exemptions for scan-bodies."""
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise Inconsistent(f"{where}: _spc_scan_allow is a list when present")
    out = []
    for i, item in enumerate(raw):
        iwhere = f"{where}: _spc_scan_allow[{i}]"
        if not isinstance(item, dict):
            raise Inconsistent(f"{iwhere}: is an object with key and reason")
        key = item.get("key")
        reason = item.get("reason")
        if not text(key) or not text(reason):
            raise Inconsistent(f"{iwhere}: key and reason are nonempty strings")
        norm = normalize_sensitive_key(key)
        if norm in NEVER_EXEMPTABLE_KEYS:
            raise Inconsistent(
                f"{iwhere}: key {key!r} is never exemptable (password hashes / private keys)"
            )
        out.append({"key": key, "reason": reason, "norm": norm})
    return out


def key_is_allowed(key, allow_list):
    norm = normalize_sensitive_key(key)
    if norm in NEVER_EXEMPTABLE_KEYS:
        return False
    return any(a.get("norm") == norm for a in (allow_list or []))


def _walk_json_for_sensitive(node, path, hits, url, allow_list, *, skip_shapes=False):
    if isinstance(node, dict):
        for key, value in node.items():
            key_str = str(key)
            child_path = f"{path}.{key_str}" if path else key_str
            norm = normalize_sensitive_key(key_str)
            allowed_here = key_is_allowed(key_str, allow_list)
            if norm in SENSITIVE_KEY_NAMES:
                if sensitive_value_is_empty(value):
                    pass
                elif allowed_here:
                    pass
                else:
                    redacted = isinstance(value, str) and value == REDACTION_MARKER
                    hits.append({
                        "url": url,
                        "path": child_path,
                        "key": key_str,
                        "reason": "redacted_sensitive_key" if redacted else "sensitive_key",
                    })
            # Allowed keys skip value-shape hits on their immediate string/array values;
            # nested objects are still walked for other keys.
            _walk_json_for_sensitive(
                value, child_path, hits, url, allow_list, skip_shapes=allowed_here
            )
    elif isinstance(node, list):
        for i, item in enumerate(node):
            _walk_json_for_sensitive(
                item, f"{path}[{i}]", hits, url, allow_list, skip_shapes=skip_shapes
            )
    elif isinstance(node, str):
        if skip_shapes or not node or node == REDACTION_MARKER:
            return
        for shape_name, pattern in SENSITIVE_VALUE_SHAPES:
            if pattern.search(node):
                hits.append({
                    "url": url,
                    "path": path or "$",
                    "key": None,
                    "reason": shape_name,
                })
                break


def raw_sensitive_key_pattern(key):
    """Match a sensitive key only in JSON / query / form key context at a token boundary.

    Accepts `"key":`, `'key':`, `key=`, or `key:` when the key is not mid-token
    (so CSS like `span: 1px` does not match a short key, and prose stays quiet).
    """
    escaped = re.escape(key)
    return re.compile(
        rf'(?:^|[{{,;&\s?\n\r\[(])["\']?{escaped}["\']?\s*[:=]',
        re.IGNORECASE,
    )


def raw_sensitive_value_after_key(body_text, match):
    """Return the raw value text after a key match, or None when empty/null/false."""
    rest = body_text[match.end():].lstrip()
    if rest.lower().startswith("null") and (len(rest) == 4 or not rest[4].isalnum()):
        return None
    if rest.lower().startswith("false") and (len(rest) == 5 or not rest[5].isalnum()):
        return None
    if rest.startswith('""') or rest.startswith("''"):
        return None
    if rest.startswith('"'):
        end = rest.find('"', 1)
        return None if end == 1 else rest[1:end] if end != -1 else rest[1:]
    if rest.startswith("'"):
        end = rest.find("'", 1)
        return None if end == 1 else rest[1:end] if end != -1 else rest[1:]
    # Bare token up to delimiter.
    token = re.match(r"([^\s&,;}\]]+)", rest)
    if not token:
        return None
    value = token.group(1).rstrip(",")
    if value.lower() in ("null", "false", "undefined") or value == "":
        return None
    return value


def should_skip_raw_scan(mime, url):
    """Skip conservative raw-text scanning for CSS/HTML/JS assets and binary URLs."""
    m = normalize_mime(mime)
    if is_asset_mime(m) or m in ("text/html", "text/css", "application/javascript", "text/javascript"):
        return True
    if is_asset_url(url):
        return True
    if isinstance(url, str):
        path = urlsplit(url).path.lower()
        if path.endswith((".js", ".mjs", ".cjs", ".html", ".htm", ".css")):
            return True
    return False


def scan_body_text(body_text, url=None, *, mime=None, allow_list=None):
    """Return sensitive-field hits for one response body string."""
    hits = []
    if not body_text:
        return hits
    allow_list = allow_list or []
    # Prefer structured JSON walk; fall back to boundary-aware key regex on raw text.
    try:
        parsed = json.loads(body_text)
    except (ValueError, TypeError):
        parsed = None
    if parsed is not None:
        _walk_json_for_sensitive(parsed, "", hits, url, allow_list)
        return hits
    if should_skip_raw_scan(mime, url):
        return hits
    for key in SENSITIVE_KEY_NAMES:
        pattern = raw_sensitive_key_pattern(key)
        for match in pattern.finditer(body_text):
            value = raw_sensitive_value_after_key(body_text, match)
            if value is None:
                continue
            if key_is_allowed(key, allow_list):
                continue
            hits.append({
                "url": url,
                "path": key,
                "key": key,
                "reason": "redacted_sensitive_key" if value == REDACTION_MARKER else "sensitive_key",
            })
            break
    for shape_name, pattern in SENSITIVE_VALUE_SHAPES:
        if shape_name in NEVER_EXEMPTABLE_SHAPES:
            if pattern.search(body_text):
                hits.append({
                    "url": url,
                    "path": "$",
                    "key": None,
                    "reason": shape_name,
                })
            continue
        for match in pattern.finditer(body_text):
            # Suppress shape hits that sit in the value of an allow-listed key.
            prefix = body_text[max(0, match.start() - 96) : match.start()]
            if any(raw_sensitive_key_pattern(a["key"]).search(prefix) for a in allow_list):
                continue
            hits.append({
                "url": url,
                "path": "$",
                "key": None,
                "reason": shape_name,
            })
            break
    return hits


def scan_har_bodies(data, path="<har>", allow_list=None):
    """Scan every HAR response body for sensitive fields; return hit list."""
    summaries = check_har(data, path)
    hits = []
    global_allow = list(allow_list or [])
    for summary in summaries:
        if not summary.get("body_present"):
            continue
        if should_skip_raw_scan(summary.get("mimeType"), summary.get("url")):
            # Still scan when the body parses as JSON (API mistaken for asset mime).
            try:
                json.loads(summary["text"])
            except (ValueError, TypeError):
                continue
        merged_allow = list(global_allow) + list(summary.get("allow") or [])
        hits.extend(
            scan_body_text(
                summary["text"],
                url=summary.get("url"),
                mime=summary.get("mimeType"),
                allow_list=merged_allow,
            )
        )
    return {"path": path, "entries": len(summaries), "hits": hits}


SECRET_KEY_NORMS = frozenset(normalize_sensitive_key(k) for k in SENSITIVE_KEY_NAMES)
REDACT_SHAPES = tuple(SENSITIVE_VALUE_SHAPES)


# Redaction also covers any key naming a hash, token, secret, or password (e.g. api_token, reset_digest).
SECRET_KEY_SUFFIXES = ("password", "passwd", "secret", "token", "hash", "digest", "apikey", "privatekey")


def is_secret_key(key):
    norm = normalize_sensitive_key(key)
    return norm in SECRET_KEY_NORMS or norm.endswith(SECRET_KEY_SUFFIXES) or "password" in norm


def _secret_value(value):
    if isinstance(value, bool) or value is None:
        return False
    if isinstance(value, (int, float)):
        return True
    return isinstance(value, str) and value.strip() != "" and value != REDACTION_MARKER


def _redact_json(node, path, found):
    """Replace secret values in parsed JSON with the marker; return the new node."""
    if isinstance(node, dict):
        out = {}
        for key, value in node.items():
            child = f"{path}.{key}"
            if is_secret_key(key) and _secret_value(value):
                out[key] = REDACTION_MARKER
                found.append(child)
            else:
                out[key] = _redact_json(value, child, found)
        return out
    if isinstance(node, list):
        return [_redact_json(v, f"{path}[{i}]", found) for i, v in enumerate(node)]
    if isinstance(node, str) and node != REDACTION_MARKER and any(r.search(node) for _n, r in REDACT_SHAPES):
        found.append(path)
        return REDACTION_MARKER
    return node


def _redact_raw(body_text, found):
    out = body_text
    for key in SENSITIVE_KEY_NAMES:
        pattern = re.compile(
            rf'((?:^|[{{,;&\s?\[(])["\']?{re.escape(key)}["\']?\s*[:=]\s*["\']?)([^"\'&\s,;}}\]]+)',
            re.IGNORECASE,
        )
        def sub(match):
            if match.group(2) in (REDACTION_MARKER, "null", "false", "undefined"):
                return match.group(0)
            found.append(f"$raw.{key}")
            return match.group(1) + REDACTION_MARKER
        out = pattern.sub(sub, out)
    for name, pattern in REDACT_SHAPES:
        raw = re.compile(pattern.pattern.lstrip("^").rstrip("$"))
        if raw.search(out):
            found.append(f"$raw.{name}")
            out = raw.sub(REDACTION_MARKER, out)
    return out


def redact_body_text(body_text):
    """Return (redacted text, redacted paths). Field names stay; values become the marker."""
    found = []
    try:
        parsed = json.loads(body_text)
    except (ValueError, TypeError):
        parsed = None
    if parsed is not None and isinstance(parsed, (dict, list)):
        new = _redact_json(parsed, "$", found)
        return (json.dumps(new, ensure_ascii=False) if found else body_text), found
    new = _redact_raw(body_text, found)
    return new, found


def marker_ranges(body_text):
    out, start = [], body_text.find(REDACTION_MARKER)
    while start != -1:
        out.append([start, start + len(REDACTION_MARKER)])
        start = body_text.find(REDACTION_MARKER, start + len(REDACTION_MARKER))
    return out


def redact_har(data, path="<har>"):
    """Redact secret values in every stored response body; update size and _spc_redaction."""
    check_har(data, path)
    redacted = 0
    for i, entry in enumerate(data["log"]["entries"]):
        content = entry["response"]["content"]
        if content.get("_file") is not None:
            continue
        body_bytes, body_text = resolve_har_body_bytes(content, path, f"{path}: entries[{i}]")
        if body_text is None or not body_text:
            continue
        new_text, found = redact_body_text(body_text)
        if not found:
            continue
        content["text"] = new_text
        content.pop("encoding", None)
        content["size"] = utf8_size(new_text)
        meta = content.get("_spc_redaction") or {"marker": REDACTION_MARKER, "paths": []}
        meta["marker"] = REDACTION_MARKER
        meta["paths"] = list(dict.fromkeys(list(meta.get("paths") or []) + found))
        meta["ranges"] = marker_ranges(new_text)
        content["_spc_redaction"] = meta
        redacted += len(found)
    check_har(data, path)
    return redacted


def unredacted_secrets(body_text, mime=None, url=None):
    """Paths of secret values a stored body still holds in clear text."""
    found = []
    try:
        parsed = json.loads(body_text)
    except (ValueError, TypeError):
        parsed = None
    if parsed is not None and isinstance(parsed, (dict, list)):
        _redact_json(parsed, "$", found)
        return found
    if should_skip_raw_scan(mime, url):
        return found
    _redact_raw(body_text, found)
    return found


def check_stored_bodies_redacted(har_data, har_path):
    for summary in check_har(har_data, har_path):
        if not summary.get("body_present") or not summary.get("text"):
            continue
        leftover = unredacted_secrets(summary["text"], summary.get("mimeType"), summary.get("url"))
        if leftover:
            raise Inconsistent(
                f"{har_path}: entries[{summary['index']}] stores secret value(s) in clear text at "
                f"{', '.join(leftover[:5])}; run check_findings.py redact (field names stay, values become "
                f"{REDACTION_MARKER!r})"
            )


def parse_har_time(value, where):
    if not text(value):
        raise Inconsistent(f"{where}: startedDateTime is required (record the HAR with a browser or HTTP client)")
    raw = value.strip()
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        stamp = datetime.fromisoformat(raw)
    except ValueError:
        raise Inconsistent(f"{where}: startedDateTime {value!r} is not an ISO 8601 time") from None
    if stamp.tzinfo is None:
        raise Inconsistent(f"{where}: startedDateTime {value!r} needs a time zone")
    return stamp.timestamp() * 1000.0


def check_recorded_har(data, where):
    """A HAR written by a measuring tool: creator name and real per-request start times."""
    check_har(data, where)
    log = data["log"]
    creator = log.get("creator")
    if not isinstance(creator, dict) or not text(creator.get("name")):
        raise Inconsistent(
            f"{where}: log.creator.name is required; measurements come from a browser or HTTP client, "
            "not a hand-written HAR"
        )
    entries = log["entries"]
    times = [parse_har_time(e.get("startedDateTime"), f"{where}: entries[{i}]") for i, e in enumerate(entries)]
    if len(entries) > 1 and len(set(times)) == 1:
        raise Inconsistent(
            f"{where}: all {len(entries)} entries share the same startedDateTime; "
            "a recorded HAR has real request start times"
        )
    return times


def entry_is_asset(entry):
    request = entry.get("request") or {}
    content = (entry.get("response") or {}).get("content") or {}
    url = request.get("url") or ""
    mime = normalize_mime(content.get("mimeType"))
    if is_asset_mime(mime) or is_asset_url(url):
        return True
    path_part = urlsplit(url).path.lower()
    return mime in ("application/javascript", "text/javascript") or path_part.endswith((".js", ".mjs"))


def count_har_requests(data, times, request_filter, side, signal_id, where):
    """Count the requests the metric claims, using the finding's request_filter."""
    flt = request_filter or {}
    if not isinstance(flt, dict):
        raise Inconsistent(f"{where}: evidence.request_filter is an object")
    after = flt.get("after")
    window = flt.get("window_ms")
    if signal_id == "background-requests":
        if not isinstance(after, dict) or not text(after.get("base")) or not text(after.get("head")):
            raise Inconsistent(
                f"{where}: background-requests needs evidence.request_filter.after {{base, head}} "
                "(the time the page was navigated away from)"
            )
        if not isinstance(window, (int, float)) or isinstance(window, bool) or window < BACKGROUND_WINDOW_MS:
            raise Inconsistent(
                f"{where}: background-requests needs evidence.request_filter.window_ms >= {BACKGROUND_WINDOW_MS}"
            )
    start = None
    if after is not None:
        if not isinstance(after, dict) or not text(after.get(side)):
            raise Inconsistent(f"{where}: evidence.request_filter.after.{side} is an ISO time")
        start = parse_har_time(after[side], f"{where}: request_filter.after.{side}")
        if not any(t <= start for t in times):
            raise Inconsistent(
                f"{where}: {side} HAR has no request before request_filter.after; "
                "open the changed page first, then navigate away"
            )
    end = start + window if start is not None and isinstance(window, (int, float)) else None
    url_contains = flt.get("url_contains")
    methods = {m.upper() for m in flt.get("methods") or []}
    count = 0
    for entry, started in zip(data["log"]["entries"], times):
        if start is not None and started <= start:
            continue
        if end is not None and started > end:
            continue
        request = entry.get("request") or {}
        if url_contains and url_contains not in (request.get("url") or ""):
            continue
        if methods and (request.get("method") or "").upper() not in methods:
            continue
        if flt.get("exclude_assets") and entry_is_asset(entry):
            continue
        count += 1
    return count


def check_performance_evidence(run_dir, finding, path, scope):
    """Base and head HARs are recorded, and request counts equal the metric exactly."""
    evidence = finding.get("evidence") or {}
    signal_id = finding.get("signal_id")
    head_rel = evidence.get("har_path")
    base_rel = evidence.get("base_har_path")
    if signal_id in HAR_COUNT_SIGNALS and not head_rel:
        raise Inconsistent(f"{path}: {signal_id} needs evidence.har_path (head HAR)")
    if not head_rel:
        return
    if not base_rel:
        raise Inconsistent(
            f"{path}: a base-vs-head performance finding carries evidence.base_har_path (the base HAR)"
        )
    sides = {}
    for side, rel in (("base", base_rel), ("head", head_rel)):
        har_file = require_evidence_file(run_dir, rel, path, "base_har_path" if side == "base" else "har_path")
        data = load(har_file)
        sides[side] = (data, check_recorded_har(data, f"{path}: {side} HAR {rel}"))
    if signal_id not in HAR_COUNT_SIGNALS:
        return
    metric = finding["metric"]
    for side, (data, times) in sides.items():
        stats = metric[side]
        counted = count_har_requests(data, times, evidence.get("request_filter"), side, signal_id, path)
        if stats["n"] != 1 or not (stats["median"] == stats["min"] == stats["max"] == counted):
            raise Inconsistent(
                f"{path}: metric.{side} says {stats['median']} (n={stats['n']}) but the {side} HAR holds "
                f"{counted} counted request(s); the count must match exactly with n=1"
            )


def check_probe_findings(run_dir, summary, loaded_findings):
    """A deterministic probe that exploited is an exploited finding with the same signal_id."""
    by_name = {name: finding for name, finding in loaded_findings}
    known = set(security_row_ids())
    for i, probe in enumerate(summary.get("probes") or []):
        if probe.get("outcome") != "exploited" or probe.get("validator") != "deterministic":
            continue
        where = f"{run_dir}: probes[{i}]"
        finding = by_name.get(Path(probe["finding"]).name)
        if finding is None:
            raise Inconsistent(f"{where}: finding {probe['finding']!r} does not exist; an exploited deterministic probe is a finding")
        if finding.get("status") != "exploited" or finding.get("signal_id") != probe["signal_id"]:
            raise Inconsistent(
                f"{where}: finding {probe['finding']!r} must be exploited with signal_id {probe['signal_id']!r}"
            )
        if probe["signal_id"] not in known:
            raise Inconsistent(
                f"{where}: signal_id {probe['signal_id']!r} is not a security row; use the best-matching row id"
            )


def find_har_entry_for_request(req, summaries, used_indices):
    """Match a finding request to a HAR entry by method + URL, preserving order."""
    method = (req.get("method") or "").upper()
    url = req.get("url")
    for summary in summaries:
        idx = summary["index"]
        if idx in used_indices:
            continue
        if (summary.get("method") or "").upper() != method:
            continue
        if urls_match(url, summary.get("url")):
            return summary
    return None


def cross_check_finding_har(finding, har_path, har_data):
    """Ensure each finding request length/hash agrees with its matched HAR entry.

    Matching is by method + URL (first unused entry in HAR order). Differing entry
    counts no longer skip the check; a request with no match is an error.
    """
    requests = finding.get("requests") or []
    summaries = check_har(
        har_data,
        har_path,
        probed_requests=requests if finding.get("track") == "security" else None,
    )
    if finding.get("track") != "security" or not requests:
        return summaries
    used = set()
    for i, req in enumerate(requests):
        summary = find_har_entry_for_request(req, summaries, used)
        if summary is None:
            raise Inconsistent(
                f"{har_path}: no HAR entry matches requests[{i}] "
                f"{(req.get('method') or '').upper()} {req.get('url')!r}"
            )
        used.add(summary["index"])
        if not summary.get("body_present") and req.get("length", 0) > 0:
            raise Inconsistent(
                f"{har_path}: matched entry for requests[{i}] has no stored body "
                f"but request length is {req.get('length')}"
            )
        if req.get("length") != summary["size"]:
            raise Inconsistent(
                f"{har_path}: request length {req.get('length')} disagrees with HAR body size {summary['size']}"
            )
        if isinstance(req.get("body_hash"), str) and req["body_hash"].strip().lower() != summary["sha256"].lower():
            raise Inconsistent(
                f"{har_path}: request body_hash disagrees with sha256 of stored HAR body"
            )
    return summaries


def check_side_metric(side, where):
    if not isinstance(side, dict):
        raise Inconsistent(f"{where}: is an object")
    for key in ("median", "min", "max"):
        if not isinstance(side.get(key), (int, float)) or isinstance(side.get(key), bool):
            raise Inconsistent(f"{where}: {key} is a number")
    if not isinstance(side.get("n"), int) or isinstance(side.get("n"), bool) or side["n"] < 1:
        raise Inconsistent(f"{where}: n is a positive integer")
    if side["min"] > side["max"]:
        raise Inconsistent(f"{where}: min is <= max")
    if not (side["min"] <= side["median"] <= side["max"]):
        raise Inconsistent(f"{where}: median lies between min and max")


def check_performance_metric(metric, path):
    if not isinstance(metric, dict):
        raise Inconsistent(f"{path}: metric is an object")
    if metric.get("class") not in METRIC_CLASSES:
        raise Inconsistent(f"{path}: metric.class is one of {', '.join(METRIC_CLASSES)}")
    if metric.get("aggregation") not in AGGREGATIONS:
        raise Inconsistent(f"{path}: metric.aggregation is one of {', '.join(AGGREGATIONS)}")
    check_side_metric(metric.get("base"), f"{path}: metric.base")
    check_side_metric(metric.get("head"), f"{path}: metric.head")
    delta = metric.get("delta_pct")
    if not isinstance(delta, (int, float)) or isinstance(delta, bool):
        raise Inconsistent(f"{path}: metric.delta_pct is a number")
    if not text(metric.get("threshold")):
        raise Inconsistent(f"{path}: metric.threshold is a nonempty string")
    parse_threshold(metric["threshold"])
    if not text(metric.get("effective_threshold")):
        raise Inconsistent(f"{path}: metric.effective_threshold is a nonempty string")
    if metric.get("verdict") not in VERDICTS:
        raise Inconsistent(f"{path}: metric.verdict is one of {', '.join(VERDICTS)}")
    aa = metric.get("aa_spread")
    if aa is not None and (not isinstance(aa, (int, float)) or isinstance(aa, bool) or aa < 0):
        raise Inconsistent(f"{path}: metric.aa_spread is null or a non-negative number")
    if "unit" in metric and metric["unit"] is not None and not isinstance(metric["unit"], str):
        raise Inconsistent(f"{path}: metric.unit is a string when present")
    return metric


def check_finding(data, path="<finding>"):
    if not isinstance(data, dict):
        raise Inconsistent(f"{path}: finding JSON must be an object")
    if data.get("schema") != FINDING_SCHEMA:
        raise Inconsistent(f"{path}: schema {FINDING_SCHEMA}")
    if data.get("track") not in TRACKS:
        raise Inconsistent(f"{path}: track is one of {', '.join(TRACKS)}")
    if data["track"] == "both":
        raise Inconsistent(f"{path}: finding track is security or performance (not both)")
    for key in ("signal_id", "file"):
        if not text(data.get(key)):
            raise Inconsistent(f"{path}: {key} is a nonempty string")
    if not isinstance(data.get("line"), int) or isinstance(data.get("line"), bool) or data["line"] < 1:
        raise Inconsistent(f"{path}: line is a positive integer")
    if data.get("severity") not in SEVERITIES:
        raise Inconsistent(f"{path}: severity is one of {', '.join(SEVERITIES)}")
    if data.get("status") not in STATUSES:
        raise Inconsistent(f"{path}: status is one of {', '.join(STATUSES)}")
    introduced = data.get("introduced")
    if introduced not in INTRODUCED:
        raise Inconsistent(f"{path}: introduced is true, false, or \"unknown\"")
    evidence = data.get("evidence")
    if not isinstance(evidence, dict):
        raise Inconsistent(f"{path}: evidence is an object")
    har = evidence.get("har_path")
    shot = evidence.get("screenshot")
    if har is not None and not text(har):
        raise Inconsistent(f"{path}: evidence.har_path is null or a nonempty string")
    if shot is not None and not text(shot):
        raise Inconsistent(f"{path}: evidence.screenshot is null or a nonempty string")
    if not har and not shot:
        raise Inconsistent(f"{path}: evidence names har_path and/or screenshot")
    base_har = evidence.get("base_har_path")
    if base_har is not None and not text(base_har):
        raise Inconsistent(f"{path}: evidence.base_har_path is null or a nonempty string")
    if evidence.get("request_filter") is not None and not isinstance(evidence["request_filter"], dict):
        raise Inconsistent(f"{path}: evidence.request_filter is an object when present")

    if data["track"] == "performance":
        check_performance_metric(data.get("metric"), path)
        if "fix_hint" in data and data["fix_hint"] is not None and not isinstance(data["fix_hint"], str):
            raise Inconsistent(f"{path}: fix_hint is a string when present")
        if data.get("status") == "exploited" and data["metric"]["verdict"] != "fail":
            raise Inconsistent(f"{path}: exploited performance findings require metric.verdict fail")
        return data

    for key in ("cwe", "repro_curl"):
        if not text(data.get(key)):
            raise Inconsistent(f"{path}: {key} is a nonempty string")
    check_repro_curl(data["repro_curl"], f"{path}: repro_curl")
    roles = data.get("roles_tested")
    if not isinstance(roles, list) or not roles or any(not text(r) for r in roles):
        raise Inconsistent(f"{path}: roles_tested is a nonempty list of strings")
    requests = data.get("requests")
    if not isinstance(requests, list) or not requests:
        raise Inconsistent(f"{path}: requests is a nonempty list")
    signal_id = data.get("signal_id")
    for i, req in enumerate(requests):
        check_request(req, f"{path}: requests[{i}]", signal_id=signal_id)
    if data.get("validator") not in VALIDATORS:
        raise Inconsistent(f"{path}: validator is one of {', '.join(VALIDATORS)}")
    return data


def check_summary(data, path="<summary>", finding_count=None):
    if not isinstance(data, dict):
        raise Inconsistent(f"{path}: summary JSON must be an object")
    if data.get("schema") != SUMMARY_SCHEMA:
        raise Inconsistent(f"{path}: schema {SUMMARY_SCHEMA}")
    if data.get("track") not in TRACKS:
        raise Inconsistent(f"{path}: track is one of {', '.join(TRACKS)}")
    target = data.get("target")
    if not isinstance(target, dict) or not text(target.get("label")):
        raise Inconsistent(f"{path}: target.label is required")
    loaded = data.get("signals_loaded")
    if not isinstance(loaded, list):
        raise Inconsistent(f"{path}: signals_loaded is a list")
    seen = set()
    for i, entry in enumerate(loaded):
        where = f"{path}: signals_loaded[{i}]"
        if not isinstance(entry, dict) or not text(entry.get("id")) or not text(entry.get("file")):
            raise Inconsistent(f"{where}: id and file are required")
        key = (entry["id"], entry["file"])
        if key in seen:
            raise Inconsistent(f"{where}: duplicate signal id {entry['id']} for {entry['file']}")
        seen.add(key)
        paths = entry.get("matched_paths")
        if not isinstance(paths, list) or any(not text(p) for p in paths):
            raise Inconsistent(f"{where}: matched_paths is a list of strings")
    coverage = data.get("coverage")
    if not isinstance(coverage, list) or not coverage:
        raise Inconsistent(f"{path}: coverage is a nonempty list (changed files and one reason per security row)")
    row_reasons = {}
    for i, entry in enumerate(coverage):
        where = f"{path}: coverage[{i}]"
        if isinstance(entry, dict) and "signal_id" in entry:
            if not text(entry.get("signal_id")):
                raise Inconsistent(f"{where}: signal_id is a nonempty string")
            if entry.get("decision") not in COVERAGE_DECISIONS:
                raise Inconsistent(f"{where}: decision is one of {', '.join(COVERAGE_DECISIONS)}")
            if not text(entry.get("reason")):
                raise Inconsistent(f"{where}: reason is a nonempty string (why the row applies or is skipped)")
            if entry["signal_id"] in row_reasons:
                raise Inconsistent(f"{where}: duplicate coverage reason for {entry['signal_id']}")
            row_reasons[entry["signal_id"]] = entry
            continue
        if not isinstance(entry, dict) or not text(entry.get("path")):
            raise Inconsistent(f"{where}: path (changed file) or signal_id (row reason) is required")
        if not isinstance(entry.get("in_scope"), bool):
            raise Inconsistent(f"{where}: in_scope is a boolean")
        if "notes" in entry and entry["notes"] is not None and not isinstance(entry["notes"], str):
            raise Inconsistent(f"{where}: notes is a string when present")
    if data["track"] in ("security", "both"):
        check_security_rows_covered(loaded, row_reasons, path)
    check_probes(data.get("probes"), data["track"], path)
    check_performance_scope(data, path)
    conditions = data.get("conditions")
    if not isinstance(conditions, dict):
        raise Inconsistent(f"{path}: conditions is an object")
    limits = data.get("limits")
    if not isinstance(limits, list) or not limits or any(not text(x) for x in limits):
        raise Inconsistent(f"{path}: limits is a nonempty list of strings")
    if not any("pen test" in x.lower() or "penetration" in x.lower() for x in limits):
        raise Inconsistent(f"{path}: limits must state this is not a pen test / CVE audit / load test")
    body_scan = data.get("body_scan")
    if body_scan is not None:
        check_body_scan_record(body_scan, f"{path}: body_scan")
    if finding_count is not None:
        declared = data.get("finding_count")
        if declared is not None and declared != finding_count:
            raise Inconsistent(f"{path}: finding_count {declared} does not match {finding_count} finding files")
    return data


def security_row_ids(signals_path=SIGNALS):
    return [row["id"] for row in load_signals(signals_path)]


def check_security_rows_covered(loaded, row_reasons, path, signals_path=SIGNALS):
    """Every security row loads and has an applies/skipped reason in coverage[]."""
    ids = security_row_ids(signals_path)
    loaded_ids = {e.get("id") for e in loaded if str(e.get("file", "")).endswith("security-signals.md")}
    missing_loaded = [i for i in ids if i not in loaded_ids]
    if missing_loaded:
        raise Inconsistent(
            f"{path}: signals_loaded must list every security row (rows always load); missing {', '.join(missing_loaded)}"
        )
    missing_reason = [i for i in ids if i not in row_reasons]
    if missing_reason:
        raise Inconsistent(
            f"{path}: coverage needs a {{signal_id, decision, reason}} entry per security row; missing {', '.join(missing_reason)}"
        )


def check_probes(probes, track, path):
    """probes[]: one record per runtime probe so a deterministic exploit cannot be downgraded silently."""
    if probes is None:
        if track in ("security", "both"):
            raise Inconsistent(f"{path}: probes is a list (one entry per runtime probe; empty when none ran)")
        return
    if not isinstance(probes, list):
        raise Inconsistent(f"{path}: probes is a list")
    for i, probe in enumerate(probes):
        where = f"{path}: probes[{i}]"
        if not isinstance(probe, dict) or not text(probe.get("signal_id")):
            raise Inconsistent(f"{where}: signal_id is required")
        if probe.get("validator") not in VALIDATORS:
            raise Inconsistent(f"{where}: validator is one of {', '.join(VALIDATORS)}")
        if probe.get("outcome") not in PROBE_OUTCOMES:
            raise Inconsistent(f"{where}: outcome is one of {', '.join(PROBE_OUTCOMES)}")
        finding = probe.get("finding")
        if finding is not None and not text(finding):
            raise Inconsistent(f"{where}: finding is null or a finding file name")
        if probe["outcome"] == "exploited" and probe["validator"] == "deterministic" and not finding:
            raise Inconsistent(
                f"{where}: a deterministic probe that exploited must name its finding file "
                "(no downgrade to hypothesis or Giới hạn)"
            )


def check_performance_scope(data, path):
    """performance_scope says what the project is and which collectors measured it."""
    scope = data.get("performance_scope")
    if data["track"] not in ("performance", "both"):
        return
    if not isinstance(scope, dict):
        raise Inconsistent(
            f"{path}: performance_scope {{project_type, collectors}} is required when the performance track ran"
        )
    kind = scope.get("project_type")
    if kind not in PROJECT_TYPES:
        raise Inconsistent(f"{path}: performance_scope.project_type is one of {', '.join(PROJECT_TYPES)}")
    collectors = scope.get("collectors")
    if not isinstance(collectors, list) or any(c not in SOURCES for c in collectors):
        raise Inconsistent(f"{path}: performance_scope.collectors lists zero or more of {', '.join(SOURCES)}")
    allowed = PROJECT_TYPES[kind]
    bad = [c for c in collectors if c not in allowed]
    if bad:
        raise Inconsistent(
            f"{path}: performance_scope: a {kind} project cannot use {', '.join(bad)} "
            f"(allowed: {', '.join(allowed) or 'none'})"
        )
    if not collectors and not any("performance" in str(x).lower() for x in data.get("limits") or []):
        raise Inconsistent(
            f"{path}: performance_scope has no collector; record under limits that performance was not measured"
        )


def check_body_scan_record(record, where):
    """Validate a recorded scan-bodies result (summary.body_scan or body-scan.json)."""
    if not isinstance(record, dict):
        raise Inconsistent(f"{where}: is an object")
    if record.get("ran") is not True:
        raise Inconsistent(f"{where}: ran must be true (scan-bodies was executed)")
    hars = record.get("hars")
    if hars is not None:
        if not isinstance(hars, list) or any(not text(h) for h in hars):
            raise Inconsistent(f"{where}: hars is a list of nonempty strings when present")
    hit_count = record.get("hit_count")
    if hit_count is not None and (
        not isinstance(hit_count, int) or isinstance(hit_count, bool) or hit_count < 0
    ):
        raise Inconsistent(f"{where}: hit_count is a non-negative integer when present")
    return record


def load_body_scan_record(run_dir, summary):
    """Return the scan-bodies record from summary.body_scan or body-scan.json, else None."""
    if isinstance(summary.get("body_scan"), dict):
        return summary["body_scan"]
    artifact = Path(run_dir) / "body-scan.json"
    if artifact.is_file():
        return load(artifact)
    return None


def security_track_ran(summary):
    return summary.get("track") in ("security", "both")


def rescan_recorded_hars(run_dir, record, where):
    """Re-run scan-bodies on every HAR in the run directory and the record.

    The recorded result is not trusted: hit_count must match the recomputed
    hits, and any hit requires an exploited `sensitive-response` finding.
    """
    run_dir = Path(run_dir)
    names = {str(h) for h in (record.get("hars") or [])}
    names.update(p.name for p in run_dir.glob("*.har"))
    allow = parse_scan_allow(record.get("allow"), f"{where}.allow")
    hits = []
    for name in sorted(names):
        har_file = resolve_evidence_path(run_dir, name)
        if har_file is None or not har_file.is_file():
            raise Inconsistent(f"{where}: hars entry {name!r} does not exist")
        hits.extend(scan_har_bodies(load(har_file), str(har_file), allow_list=allow)["hits"])
    declared = record.get("hit_count")
    if declared is not None and declared != len(hits):
        raise Inconsistent(
            f"{where}: hit_count {declared} does not match {len(hits)} hit(s) found by re-scanning the HARs"
        )
    return hits


def security_probes_exist(findings):
    """True when the run recorded security probe requests (scan-bodies must have run)."""
    for finding in findings:
        if finding.get("track") != "security":
            continue
        requests = finding.get("requests")
        if isinstance(requests, list) and requests:
            return True
    return False


def resolve_evidence_path(run_dir, relative):
    if not relative:
        return None
    candidate = Path(relative)
    if not candidate.is_absolute():
        candidate = run_dir / relative
    return candidate


def require_evidence_file(run_dir, relative, where, field):
    """Resolve an evidence path and error when the file is missing."""
    if not relative:
        return None
    candidate = resolve_evidence_path(run_dir, relative)
    if candidate is None or not candidate.is_file():
        raise Inconsistent(
            f"{where}: evidence.{field} {relative!r} does not exist"
        )
    return candidate


def check_run_dir(run_dir):
    run_dir = Path(run_dir)
    summary = check_summary(load(run_dir / "summary.json"), str(run_dir / "summary.json"))
    findings = sorted(run_dir.glob("finding-*.json"))
    exploited = 0
    loaded_findings = []
    named_findings = []
    scope = summary.get("performance_scope") or {}
    perf_rows = {}
    if any(True for _ in findings):
        try:
            perf_rows = {row["id"]: row for row in load_performance_signals(PERF_SIGNALS)}
        except (Inconsistent, OSError):
            perf_rows = {}
    for path in findings:
        finding = check_finding(load(path), str(path))
        loaded_findings.append(finding)
        named_findings.append((path.name, finding))
        if finding["track"] == "performance":
            collectors = scope.get("collectors")
            if isinstance(collectors, list):
                if not collectors:
                    raise Inconsistent(f"{path}: performance_scope has no collector, so no performance finding can be measured")
                row = perf_rows.get(finding["signal_id"])
                if row and not set(row["sources"]) & set(collectors):
                    raise Inconsistent(
                        f"{path}: {finding['signal_id']} is measured by {', '.join(row['sources'])}, "
                        f"not by this run's collectors ({', '.join(collectors)})"
                    )
            check_performance_evidence(run_dir, finding, str(path), scope)
        if finding["status"] == "exploited":
            exploited += 1
        elif finding["status"] in ("hypothesis", "unclear"):
            raise Inconsistent(f"{path}: only exploited findings are written as finding files; put {finding['status']} under limits")
        evidence = finding.get("evidence") or {}
        har_rel = evidence.get("har_path")
        shot_rel = evidence.get("screenshot")
        har_file = require_evidence_file(run_dir, har_rel, str(path), "har_path")
        require_evidence_file(run_dir, shot_rel, str(path), "screenshot")
        if har_file is not None:
            cross_check_finding_har(finding, str(har_file), load(har_file))
    # Performance-only runs keep HARs for request counts; they are not probes.
    if security_track_ran(summary) or security_probes_exist(loaded_findings):
        record = load_body_scan_record(run_dir, summary)
        if record is None:
            raise Inconsistent(
                f"{run_dir}: security track ran but no scan-bodies record was found "
                "(set summary.body_scan or write body-scan.json with ran:true)"
            )
        where = f"{run_dir}: body_scan"
        check_body_scan_record(record, where)
        hits = rescan_recorded_hars(run_dir, record, where)
        if hits and not any(
            f.get("signal_id") == "sensitive-response" and f.get("status") == "exploited"
            for f in loaded_findings
        ):
            keys = sorted({str(h.get("key")) for h in hits})
            raise Inconsistent(
                f"{where}: scan-bodies found {len(hits)} sensitive field hit(s) ({', '.join(keys)}) "
                "but no exploited sensitive-response finding was written"
            )
    check_probe_findings(run_dir, summary, named_findings)
    for har_file in sorted(run_dir.glob("*.har")):
        check_stored_bodies_redacted(load(har_file), str(har_file))
    check_summary(summary, str(run_dir / "summary.json"), finding_count=exploited)
    return {"summary": summary, "findings": len(findings), "exploited": exploited}


def signals_relpath(signals_path, track):
    name = Path(signals_path).name
    if track == "performance" and name == "performance-signals.md":
        return "references/performance-signals.md"
    if track == "security" and name == "security-signals.md":
        return "references/security-signals.md"
    return str(signals_path)


def cmd_signals(args):
    track = args.track
    if track == "both":
        raise Inconsistent("signals: use --track security or --track performance")
    default_path = str(PERF_SIGNALS if track == "performance" else SIGNALS)
    signals_path = args.signals or default_path
    paths = [p.strip() for p in (args.paths or "").split(",") if p.strip()] if args.paths is not None else []
    changes = None
    if args.diff:
        changes = parse_unified_diff(Path(args.diff).read_text(encoding="utf-8", errors="replace"))
        paths = list(dict.fromkeys(paths + list(changes)))
    if args.paths is None and not args.diff and not args.all_always:
        raise Inconsistent("signals: pass --paths (comma-separated), --diff <unified diff>, or --all-always")
    rel = signals_relpath(signals_path, track)
    # Every row loads (security) or every non-off row (performance); paths and diff only add hints.
    if track == "performance":
        rows = load_performance_signals(signals_path)
        loaded = match_performance_signals(rows, paths, signals_file=rel, changes=changes)
    else:
        rows = load_signals(signals_path)
        loaded = match_signals(rows, paths, signals_file=rel, changes=changes)
    print(json.dumps({"signals_loaded": loaded}, indent=2, ensure_ascii=False))
    return 0


def cmd_finding(args):
    check_finding(load(args.path), args.path)
    print(f"OK {args.path}")
    return 0


def cmd_summary(args):
    check_summary(load(args.path), args.path)
    print(f"OK {args.path}")
    return 0


def cmd_run(args):
    result = check_run_dir(args.run_dir)
    print(f"OK {args.run_dir}: {result['exploited']} exploited finding(s), {len(result['summary']['signals_loaded'])} signal(s) loaded")
    return 0


def cmd_aggregate(args):
    values = [float(x) for x in args.values.split(",") if x.strip() != ""]
    how = args.how
    stats = side_stats(values, how)
    print(json.dumps({"aggregation": how, **stats}, indent=2, ensure_ascii=False))
    return 0


def cmd_threshold(args):
    base = [float(x) for x in args.base.split(",") if x.strip() != ""]
    head = [float(x) for x in args.head.split(",") if x.strip() != ""]
    aa = None
    if args.aa:
        sides = args.aa.split(":")
        if len(sides) != 2:
            raise Inconsistent("threshold --aa needs two sides separated by :, e.g. 100,102:99,101")
        aa = [
            [float(x) for x in sides[0].split(",") if x.strip() != ""],
            [float(x) for x in sides[1].split(",") if x.strip() != ""],
        ]
    result = evaluate_threshold(
        base,
        head,
        args.expr,
        direction=args.direction,
        metric_class=args.metric_class,
        min_runs=args.min_runs,
        aa_values=aa,
        aa_multiplier=args.aa_multiplier,
        aggregation=args.aggregation,
    )
    # JSON-friendly inf
    if result["delta_pct"] is not None and isinstance(result["delta_pct"], float) and math.isinf(result["delta_pct"]):
        result["delta_pct"] = None
        result["delta_pct_infinite"] = True
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


def cmd_har(args):
    data = load(args.path)
    check_har(data, args.path)
    if args.recorded:
        check_recorded_har(data, args.path)
    print(f"OK {args.path}")
    return 0


def cmd_redact(args):
    data = load(args.path)
    count = redact_har(data, args.path)
    Path(args.out).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"OK {args.out}: {count} value(s) redacted")
    return 0


def parse_allow_cli(values):
    """Parse repeated --allow key:reason flags into scan-allow entries."""
    if not values:
        return []
    raw = []
    for item in values:
        if ":" not in item:
            raise Inconsistent(
                f"scan-bodies --allow needs key:reason; got {item!r}"
            )
        key, reason = item.split(":", 1)
        raw.append({"key": key.strip(), "reason": reason.strip()})
    return parse_scan_allow(raw, "scan-bodies --allow")


def cmd_scan_bodies(args):
    allow = parse_allow_cli(getattr(args, "allow", None))
    result = scan_har_bodies(load(args.path), args.path, allow_list=allow)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    # Exit 1 when hits exist so the skill flow can treat them as findings deterministically.
    return 1 if result["hits"] else 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    signals = sub.add_parser("signals", help="load a signal file and emit signals_loaded[] for the given paths")
    signals.add_argument("--track", choices=("security", "performance"), default="security")
    signals.add_argument("--signals", default=None, help="path to security-signals.md or performance-signals.md")
    signals.add_argument("--paths", default=None, help="comma-separated changed paths to match")
    signals.add_argument("--diff", default=None, help="unified diff file; its changed lines feed content hints")
    signals.add_argument("--all-always", action="store_true", help="emit every row without hints (rows always load)")

    finding = sub.add_parser("finding", help="validate one finding JSON file")
    finding.add_argument("path")

    summary = sub.add_parser("summary", help="validate one run summary JSON file")
    summary.add_argument("path")

    run = sub.add_parser("run", help="validate summary.json and finding-*.json in a run directory")
    run.add_argument("run_dir")

    aggregate_cmd = sub.add_parser("aggregate", help="compute median/range/n for a comma-separated value list")
    aggregate_cmd.add_argument("--values", required=True, help="comma-separated numbers")
    aggregate_cmd.add_argument("--how", choices=AGGREGATIONS, default="median")

    threshold = sub.add_parser("threshold", help="evaluate a performance threshold against base/head samples")
    threshold.add_argument("--expr", required=True, help="threshold grammar, e.g. median < base*1.10")
    threshold.add_argument("--base", required=True, help="comma-separated base samples")
    threshold.add_argument("--head", required=True, help="comma-separated head samples")
    threshold.add_argument("--aa", default=None, help="optional A/A sides a1,a2:b1,b2")
    threshold.add_argument("--aa-multiplier", type=float, default=DEFAULT_AA_MULTIPLIER)
    threshold.add_argument(
        "--direction",
        choices=DIRECTIONS,
        default=None,
        help="must match the expression operator when set (lower_better for < / <=, higher_better for > / >=)",
    )
    threshold.add_argument("--metric-class", choices=METRIC_CLASSES, default="exact")
    threshold.add_argument("--min-runs", type=int, default=1)
    threshold.add_argument(
        "--aggregation",
        choices=AGGREGATIONS,
        default=None,
        help="must match the expression aggregate when set",
    )

    har_cmd = sub.add_parser("har", help="validate a HAR file against the evidence contract (full bodies, size)")
    har_cmd.add_argument("path")
    har_cmd.add_argument("--recorded", action="store_true",
                         help="also require a measuring-tool HAR (creator, real startedDateTime values)")

    redact_cmd = sub.add_parser("redact", help="replace secret values in stored bodies with the marker, keeping field names")
    redact_cmd.add_argument("path")
    redact_cmd.add_argument("--out", required=True)

    scan_cmd = sub.add_parser(
        "scan-bodies",
        help="scan HAR response bodies for sensitive fields; exit 1 when hits are found",
    )
    scan_cmd.add_argument("path")
    scan_cmd.add_argument(
        "--allow",
        action="append",
        default=[],
        help="per-run exemption key:reason (e.g. access_token:own token on login); "
        "password hashes and private keys are never exemptable",
    )

    args = parser.parse_args(argv)
    try:
        if args.command == "signals":
            return cmd_signals(args)
        if args.command == "finding":
            return cmd_finding(args)
        if args.command == "summary":
            return cmd_summary(args)
        if args.command == "run":
            return cmd_run(args)
        if args.command == "aggregate":
            return cmd_aggregate(args)
        if args.command == "threshold":
            return cmd_threshold(args)
        if args.command == "har":
            return cmd_har(args)
        if args.command == "redact":
            return cmd_redact(args)
        if args.command == "scan-bodies":
            return cmd_scan_bodies(args)
    except Inconsistent as error:
        print(f"Inconsistent: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
