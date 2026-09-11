#!/usr/bin/env python3
"""Collect a deterministic implementation scope from the Git worktree."""

from __future__ import annotations

import argparse
import fnmatch
import json
import subprocess
import sys
from pathlib import Path


class ScopeError(ValueError):
    pass


def git_files(root: Path, args: list[str]) -> list[str]:
    try:
        result = subprocess.run(
            ["git", *args], cwd=root, check=True, text=True, capture_output=True
        )
    except (OSError, subprocess.CalledProcessError) as error:
        raise ScopeError(f"cannot inspect Git worktree: {error}") from error
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=".")
    parser.add_argument("--include", action="append", default=[], help="explicit file in scope")
    parser.add_argument("--exclude", action="append", default=[], help="glob to exclude from Git-discovered files")
    args = parser.parse_args()
    root = Path(args.repo_root).resolve()
    try:
        files = set(git_files(root, ["diff", "--name-only", "--diff-filter=ACDMRTUXB"]))
        files.update(git_files(root, ["diff", "--cached", "--name-only", "--diff-filter=ACDMRTUXB"]))
        files.update(git_files(root, ["ls-files", "--others", "--exclude-standard"]))
        explicit: set[str] = set()
        for raw in args.include:
            path = Path(raw)
            if path.is_absolute():
                try:
                    path = path.resolve().relative_to(root)
                except ValueError as error:
                    raise ScopeError(f"explicit file escapes repository root: {raw}") from error
            explicit.add(path.as_posix())
        files = {path for path in files if not any(fnmatch.fnmatch(path, pattern) for pattern in args.exclude)}
        files.update(explicit)
        normalized = sorted(
            path for path in files if path and path != ".git"
        )
    except ScopeError as error:
        print(f"source scope error: {error}", file=sys.stderr)
        return 1
    if not normalized:
        print("source scope error: no changed or explicitly included files", file=sys.stderr)
        return 1
    print(json.dumps({"source_files": normalized, "source_files_origin": "git-working-tree+explicit"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
