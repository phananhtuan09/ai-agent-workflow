#!/usr/bin/env python3
"""Deterministic checks for security-performance-check finding JSON and run summaries."""
import argparse
import hashlib
import json
import math
import re
import sys
from pathlib import Path

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
SOURCES = ("playwright", "build", "lighthouse")
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
# Non-executable / non-handler paths excluded from signal matching by default.
DEFAULT_PATH_EXCLUDES = (
    "**/__tests__/**",
    "**/__mocks__/**",
    "**/__fixtures__/**",
    "**/test/**",
    "**/tests/**",
    "**/spec/**",
    "**/fixtures/**",
    "**/*.test.*",
    "**/*.spec.*",
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
    "**/*.po",
    "**/*.pot",
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
    """A glob where `**` crosses directories and `*` does not; a pattern without `/` matches the file name."""
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
    return re.compile(("(?:^|.*/)" if "/" not in pattern else "^") + out + "$")


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
            "risk": risk,
            "static_check": cols[4].strip(),
            "runtime_probe": cols[5].strip(),
            "validator": cols[6].strip().strip("`"),
            "do_not_flag": cols[7].strip(),
        })
    if not rows:
        raise Inconsistent(f"{path}: no signal rows found")
    always = [r for r in rows if r["trigger"] == TRIGGERS_ALWAYS]
    if len(always) > 3:
        raise Inconsistent(f"{path}: keep always rows to 2–3; found {len(always)}")
    for row in rows:
        if row["validator"] not in VALIDATORS:
            raise Inconsistent(f"{path}: signal {row['id']}: validator is one of {', '.join(VALIDATORS)}")
    return rows


def match_signals(rows, paths, signals_file="references/security-signals.md", exclude=None):
    """Build signals_loaded[]: always rows plus rows whose patterns hit a path.

    Paths under DEFAULT_PATH_EXCLUDES (tests, fixtures, i18n/locale, …) never match.
    """
    loaded = []
    path_list = filter_matchable_paths(list(paths), exclude=exclude)
    for row in rows:
        matched = [p for p in path_list if row["patterns"] and matcher(row["patterns"])(p)]
        if row["trigger"] == TRIGGERS_ALWAYS or matched:
            loaded.append({
                "id": row["id"],
                "file": signals_file,
                "matched_paths": matched,
            })
    return loaded


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
        signal_id = cols[0].strip().strip("`")
        metric_class = cols[1].strip().strip("`")
        source = cols[2].strip().strip("`")
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
        if source not in SOURCES:
            raise Inconsistent(f"{path}: signal {signal_id}: source is one of {', '.join(SOURCES)}")
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
            "direction": direction,
            "aggregation": aggregation,
            "threshold": threshold,
            "min_runs_per_side": min_runs,
            "patterns": patterns,
            "level": level,
            "fix_hint": fix_hint,
        })
    if not rows:
        raise Inconsistent(f"{path}: no signal rows found")
    return rows


def match_performance_signals(rows, paths, signals_file="references/performance-signals.md",
                               exclude=None):
    """Build signals_loaded[] for non-off rows whose route_pattern hits a path.

    Paths under DEFAULT_PATH_EXCLUDES never match.
    """
    loaded = []
    path_list = filter_matchable_paths(list(paths), exclude=exclude)
    for row in rows:
        if row["level"] == "off":
            continue
        matched = [p for p in path_list if row["patterns"] and matcher(row["patterns"])(p)]
        if matched:
            loaded.append({
                "id": row["id"],
                "file": signals_file,
                "matched_paths": matched,
            })
    return loaded


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


def check_access_classification(entry, where):
    """Validate expected_access / observed_access / access_verdict consistency."""
    expected = entry.get("expected_access")
    observed = entry.get("observed_access")
    verdict = entry.get("access_verdict")
    authorized = entry.get("caller_authorized")

    if expected is not None and expected not in ACCESS_EXPECTATIONS:
        raise Inconsistent(f"{where}: expected_access is one of {', '.join(ACCESS_EXPECTATIONS)}")
    if observed is not None and observed not in ACCESS_OBSERVED:
        raise Inconsistent(f"{where}: observed_access is one of {', '.join(ACCESS_OBSERVED)}")
    if verdict is not None and verdict not in ACCESS_VERDICTS:
        raise Inconsistent(f"{where}: access_verdict is one of {', '.join(ACCESS_VERDICTS)}")
    if authorized is not None and not isinstance(authorized, bool):
        raise Inconsistent(f"{where}: caller_authorized is a boolean when present")

    if verdict is not None and expected is None:
        raise Inconsistent(f"{where}: access_verdict requires expected_access")

    if authorized is True:
        if expected is None:
            raise Inconsistent(f"{where}: caller_authorized true requires expected_access allow")
        if expected != "allow":
            raise Inconsistent(f"{where}: caller_authorized true requires expected_access allow")

    if verdict == "bypassed":
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


def check_request(entry, where):
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
    check_access_classification(entry, where)
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


def check_har_entry(entry, where, index=0):
    """Validate one HAR log.entries[] item against the evidence contract."""
    if not isinstance(entry, dict):
        raise Inconsistent(f"{where}: entry is an object")
    response = entry.get("response")
    if not isinstance(response, dict):
        raise Inconsistent(f"{where}: response is an object")
    content = response.get("content")
    if not isinstance(content, dict):
        raise Inconsistent(f"{where}: response.content is an object")
    size = content.get("size")
    if not isinstance(size, int) or isinstance(size, bool) or size < 0:
        raise Inconsistent(f"{where}: content.size is a non-negative integer")
    body_text = content.get("text")
    if size > 0 and not isinstance(body_text, str):
        raise Inconsistent(
            f"{where}: content.text is required when content.size > 0 "
            "(full body required; do not omit, truncate, or reconstruct)"
        )
    if body_text is None:
        body_text = ""
    if not isinstance(body_text, str):
        raise Inconsistent(f"{where}: content.text is a string when present")
    stored = utf8_size(body_text)
    # size always equals the stored (possibly redacted) body byte length.
    check_redaction_meta(content, body_text, where)
    if size != stored:
        raise Inconsistent(
            f"{where}: content.size {size} differs from stored body UTF-8 length {stored}"
        )
    return {
        "index": index,
        "url": ((entry.get("request") or {}).get("url") if isinstance(entry.get("request"), dict) else None),
        "status": response.get("status"),
        "text": body_text,
        "size": size,
        "sha256": body_sha256(body_text.encode("utf-8")),
    }


def check_har(data, path="<har>"):
    """Validate a HAR document; return normalized entry summaries."""
    if not isinstance(data, dict):
        raise Inconsistent(f"{path}: HAR must be an object")
    log = data.get("log")
    if not isinstance(log, dict):
        raise Inconsistent(f"{path}: log is an object")
    entries = log.get("entries")
    if not isinstance(entries, list) or not entries:
        raise Inconsistent(f"{path}: log.entries is a nonempty list")
    return [check_har_entry(entry, f"{path}: entries[{i}]", index=i) for i, entry in enumerate(entries)]


def _walk_json_for_sensitive(node, path, hits, url):
    if isinstance(node, dict):
        for key, value in node.items():
            key_str = str(key)
            child_path = f"{path}.{key_str}" if path else key_str
            norm = re.sub(r"[^a-z0-9]", "", key_str.lower())
            if norm in SENSITIVE_KEY_NAMES:
                # Redaction marker in the value means the field was acknowledged; still a hit
                # only when the cleartext (or non-marker) value remains.
                if not (isinstance(value, str) and value == REDACTION_MARKER):
                    hits.append({
                        "url": url,
                        "path": child_path,
                        "key": key_str,
                        "reason": "sensitive_key",
                    })
            _walk_json_for_sensitive(value, child_path, hits, url)
    elif isinstance(node, list):
        for i, item in enumerate(node):
            _walk_json_for_sensitive(item, f"{path}[{i}]", hits, url)
    elif isinstance(node, str):
        for shape_name, pattern in SENSITIVE_VALUE_SHAPES:
            if pattern.search(node):
                hits.append({
                    "url": url,
                    "path": path or "$",
                    "key": None,
                    "reason": shape_name,
                })
                break


def scan_body_text(body_text, url=None):
    """Return sensitive-field hits for one response body string."""
    hits = []
    if not body_text:
        return hits
    # Prefer structured JSON walk; fall back to key-ish regex on raw text.
    try:
        parsed = json.loads(body_text)
    except (ValueError, TypeError):
        parsed = None
    if parsed is not None:
        _walk_json_for_sensitive(parsed, "", hits, url)
        return hits
    for key in SENSITIVE_KEY_NAMES:
        # Match passwordHash / password_hash / "password" alike in raw bodies.
        pattern = re.compile(
            rf'["\']?{re.escape(key)}["\']?\s*[:=]',
            re.IGNORECASE,
        )
        if pattern.search(body_text):
            hits.append({
                "url": url,
                "path": key,
                "key": key,
                "reason": "sensitive_key",
            })
    for shape_name, pattern in SENSITIVE_VALUE_SHAPES:
        if pattern.search(body_text):
            hits.append({
                "url": url,
                "path": "$",
                "key": None,
                "reason": shape_name,
            })
    return hits


def scan_har_bodies(data, path="<har>"):
    """Scan every HAR response body for sensitive fields; return hit list."""
    summaries = check_har(data, path)
    hits = []
    for summary in summaries:
        hits.extend(scan_body_text(summary["text"], url=summary.get("url")))
    return {"path": path, "entries": len(summaries), "hits": hits}


def cross_check_finding_har(finding, har_path, har_data):
    """Ensure finding request length/hash agree with a stored HAR body when comparable."""
    summaries = check_har(har_data, har_path)
    requests = finding.get("requests") or []
    if finding.get("track") != "security" or not requests:
        return summaries
    # When counts match 1:1, require each request to agree with the corresponding entry.
    if len(requests) == len(summaries):
        pairs = zip(requests, summaries)
    elif len(summaries) == 1 and len(requests) >= 1:
        # Single-entry HAR cited by a multi-request finding: check against the last request.
        pairs = [(requests[-1], summaries[0])]
    else:
        return summaries
    for req, summary in pairs:
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
    for i, req in enumerate(requests):
        check_request(req, f"{path}: requests[{i}]")
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
        raise Inconsistent(f"{path}: coverage is a nonempty list (one entry per in-scope changed file)")
    for i, entry in enumerate(coverage):
        where = f"{path}: coverage[{i}]"
        if not isinstance(entry, dict) or not text(entry.get("path")):
            raise Inconsistent(f"{where}: path is required")
        if not isinstance(entry.get("in_scope"), bool):
            raise Inconsistent(f"{where}: in_scope is a boolean")
        if "notes" in entry and entry["notes"] is not None and not isinstance(entry["notes"], str):
            raise Inconsistent(f"{where}: notes is a string when present")
    conditions = data.get("conditions")
    if not isinstance(conditions, dict):
        raise Inconsistent(f"{path}: conditions is an object")
    limits = data.get("limits")
    if not isinstance(limits, list) or not limits or any(not text(x) for x in limits):
        raise Inconsistent(f"{path}: limits is a nonempty list of strings")
    if not any("pen test" in x.lower() or "penetration" in x.lower() for x in limits):
        raise Inconsistent(f"{path}: limits must state this is not a pen test / CVE audit / load test")
    if finding_count is not None:
        declared = data.get("finding_count")
        if declared is not None and declared != finding_count:
            raise Inconsistent(f"{path}: finding_count {declared} does not match {finding_count} finding files")
    return data


def resolve_evidence_path(run_dir, relative):
    if not relative:
        return None
    candidate = Path(relative)
    if not candidate.is_absolute():
        candidate = run_dir / relative
    return candidate


def check_run_dir(run_dir):
    run_dir = Path(run_dir)
    summary = check_summary(load(run_dir / "summary.json"), str(run_dir / "summary.json"))
    findings = sorted(run_dir.glob("finding-*.json"))
    exploited = 0
    for path in findings:
        finding = check_finding(load(path), str(path))
        if finding["status"] == "exploited":
            exploited += 1
        elif finding["status"] in ("hypothesis", "unclear"):
            raise Inconsistent(f"{path}: only exploited findings are written as finding files; put {finding['status']} under limits")
        har_rel = (finding.get("evidence") or {}).get("har_path")
        har_file = resolve_evidence_path(run_dir, har_rel)
        if har_file is not None and har_file.is_file():
            cross_check_finding_har(finding, str(har_file), load(har_file))
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
    if args.paths is None and not args.all_always:
        raise Inconsistent("signals: pass --paths (comma-separated) or --all-always")
    rel = signals_relpath(signals_path, track)
    if track == "performance":
        rows = load_performance_signals(signals_path)
        if args.all_always:
            loaded = [
                {"id": row["id"], "file": rel, "matched_paths": []}
                for row in rows
                if row["level"] != "off"
            ]
        else:
            loaded = match_performance_signals(rows, paths, signals_file=rel)
    else:
        rows = load_signals(signals_path)
        if args.all_always:
            loaded = match_signals(
                [r for r in rows if r["trigger"] == TRIGGERS_ALWAYS],
                [],
                signals_file=rel,
            )
        else:
            loaded = match_signals(rows, paths, signals_file=rel)
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
    check_har(load(args.path), args.path)
    print(f"OK {args.path}")
    return 0


def cmd_scan_bodies(args):
    result = scan_har_bodies(load(args.path), args.path)
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
    signals.add_argument("--all-always", action="store_true", help="emit always rows (security) or all non-off rows (performance)")

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

    scan_cmd = sub.add_parser(
        "scan-bodies",
        help="scan HAR response bodies for sensitive fields; exit 1 when hits are found",
    )
    scan_cmd.add_argument("path")

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
        if args.command == "scan-bodies":
            return cmd_scan_bodies(args)
    except Inconsistent as error:
        print(f"Inconsistent: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
