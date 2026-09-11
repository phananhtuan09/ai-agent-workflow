#!/usr/bin/env python3
"""Compatibility shim for the retired manifest evidence gate."""

import sys


def main() -> int:
    print(
        "The manifest evidence gate was retired. Use validate_verification.py "
        "for the structured verification results contract.",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
