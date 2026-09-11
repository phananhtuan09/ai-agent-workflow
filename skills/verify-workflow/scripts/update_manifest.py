#!/usr/bin/env python3
"""Compatibility shim for the retired manifest workflow."""

import sys


def main() -> int:
    print(
        "The manifest workflow was retired. Use validate_verification.py and "
        "record_repair_attempt.py with structured verification results JSON.",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
