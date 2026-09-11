#!/usr/bin/env python3
"""Append one bounded in-scope implementation repair attempt."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

SHA256 = re.compile(r"^[0-9a-f]{64}$")


class RepairError(ValueError):
    pass


def sha(value: str, label: str) -> str:
    if not SHA256.fullmatch(value):
        raise RepairError(f"{label} must be a 64-character lowercase SHA-256 value")
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--results", required=True)
    parser.add_argument("--failed-testcase", action="append", required=True)
    parser.add_argument("--source-sha256-before", required=True)
    parser.add_argument("--source-sha256-after", required=True)
    parser.add_argument("--summary", required=True)
    args = parser.parse_args()
    path = Path(args.results)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise RepairError("results must be a JSON object")
        repair = data.get("repair")
        if not isinstance(repair, dict) or repair.get("max_attempts") != 2 or not isinstance(repair.get("attempts"), list):
            raise RepairError("results need repair.max_attempts=2 and an attempts array")
        attempts = repair["attempts"]
        if len(attempts) >= 2:
            raise RepairError("repair attempt limit of 2 reached")
        before = sha(args.source_sha256_before, "source-sha256-before")
        after = sha(args.source_sha256_after, "source-sha256-after")
        if before == after:
            raise RepairError("source fingerprint must change after repair")
        if not args.summary.strip():
            raise RepairError("summary must be non-empty")
        attempt_number = len(attempts) + 1
        attempts.append(
            {
                "attempt": attempt_number,
                "failed_testcase_ids": sorted(set(args.failed_testcase)),
                "classification": "implementation_defect",
                "source_sha256_before": before,
                "source_sha256_after": after,
                "summary": args.summary.strip(),
                "recorded_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            }
        )
        temporary = path.with_suffix(path.suffix + ".tmp")
        temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temporary.replace(path)
    except (OSError, json.JSONDecodeError, RepairError) as error:
        print(f"repair error: {error}", file=sys.stderr)
        return 1
    print(json.dumps({"recorded": True, "attempt": attempt_number}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
