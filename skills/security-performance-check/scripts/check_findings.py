#!/usr/bin/env python3
"""Deterministic checks for security-performance-check finding JSON and run summaries."""
import argparse
import json
import re
import sys
from pathlib import Path

SIGNALS = Path(__file__).resolve().parents[1] / "references" / "security-signals.md"
TRACKS = ("security", "performance", "both")
SEVERITIES = ("high", "med", "low")
STATUSES = ("exploited", "hypothesis", "unclear")
INTRODUCED = (True, False, "unknown")
VALIDATORS = ("deterministic", "agent", "none")
RISKS = ("high", "med", "low")
TRIGGERS_ALWAYS = "always"
FINDING_SCHEMA = "security-performance-check/finding@1"
SUMMARY_SCHEMA = "security-performance-check/summary@1"


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


def match_signals(rows, paths, signals_file="references/security-signals.md"):
    """Build signals_loaded[]: always rows plus rows whose patterns hit a path."""
    loaded = []
    path_list = list(paths)
    for row in rows:
        matched = [p for p in path_list if row["patterns"] and matcher(row["patterns"])(p)]
        if row["trigger"] == TRIGGERS_ALWAYS or matched:
            loaded.append({
                "id": row["id"],
                "file": signals_file,
                "matched_paths": matched,
            })
    return loaded


def check_request(entry, where):
    if not isinstance(entry, dict):
        raise Inconsistent(f"{where}: each request is an object")
    if not text(entry.get("role")) or not text(entry.get("method")) or not text(entry.get("url")):
        raise Inconsistent(f"{where}: role, method, and url are required")
    if not isinstance(entry.get("status"), int) or isinstance(entry.get("status"), bool):
        raise Inconsistent(f"{where}: status is an HTTP status integer")
    if not isinstance(entry.get("length"), int) or isinstance(entry.get("length"), bool) or entry["length"] < 0:
        raise Inconsistent(f"{where}: length is a non-negative integer")
    if not text(entry.get("body_hash")):
        raise Inconsistent(f"{where}: body_hash is a nonempty string")


def check_finding(data, path="<finding>"):
    if data.get("schema") != FINDING_SCHEMA:
        raise Inconsistent(f"{path}: schema {FINDING_SCHEMA}")
    if data.get("track") not in TRACKS:
        raise Inconsistent(f"{path}: track is one of {', '.join(TRACKS)}")
    for key in ("signal_id", "file", "cwe", "repro_curl"):
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
    roles = data.get("roles_tested")
    if not isinstance(roles, list) or not roles or any(not text(r) for r in roles):
        raise Inconsistent(f"{path}: roles_tested is a nonempty list of strings")
    requests = data.get("requests")
    if not isinstance(requests, list) or not requests:
        raise Inconsistent(f"{path}: requests is a nonempty list")
    for i, req in enumerate(requests):
        check_request(req, f"{path}: requests[{i}]")
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
    if data.get("validator") not in VALIDATORS:
        raise Inconsistent(f"{path}: validator is one of {', '.join(VALIDATORS)}")
    return data


def check_summary(data, path="<summary>", finding_count=None):
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
        if entry["id"] in seen:
            raise Inconsistent(f"{where}: duplicate signal id {entry['id']}")
        seen.add(entry["id"])
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
    check_summary(summary, str(run_dir / "summary.json"), finding_count=exploited)
    return {"summary": summary, "findings": len(findings), "exploited": exploited}


def cmd_signals(args):
    rows = load_signals(args.signals)
    paths = [p.strip() for p in (args.paths or "").split(",") if p.strip()] if args.paths is not None else []
    if args.paths is None and not args.all_always:
        raise Inconsistent("signals: pass --paths (comma-separated) or --all-always")
    signals_path = Path(args.signals)
    if signals_path.name == "security-signals.md":
        rel = "references/security-signals.md"
    else:
        rel = str(signals_path)
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


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    signals = sub.add_parser("signals", help="load security-signals.md and emit signals_loaded[] for the given paths")
    signals.add_argument("--signals", default=str(SIGNALS), help="path to security-signals.md")
    signals.add_argument("--paths", default=None, help="comma-separated changed paths to match")
    signals.add_argument("--all-always", action="store_true", help="emit only always rows (no path filter)")

    finding = sub.add_parser("finding", help="validate one finding JSON file")
    finding.add_argument("path")

    summary = sub.add_parser("summary", help="validate one run summary JSON file")
    summary.add_argument("path")

    run = sub.add_parser("run", help="validate summary.json and finding-*.json in a run directory")
    run.add_argument("run_dir")

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
    except Inconsistent as error:
        print(f"Inconsistent: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
