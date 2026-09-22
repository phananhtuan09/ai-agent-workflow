"""Locking, compare-and-swap, and recoverable writes for learning state."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import tempfile
from contextlib import contextmanager
from pathlib import Path
from typing import Iterable, Iterator, Mapping

try:
    import fcntl
except ImportError:  # pragma: no cover - Windows fallback
    fcntl = None

try:
    import msvcrt
except ImportError:  # pragma: no cover - POSIX path
    msvcrt = None


JOURNAL_NAME = ".learning-workflow-transaction.json"
LOCK_PREFIX = "ai-workflow-learning-"


class StateConflictError(OSError):
    """The files changed after this operation loaded its input snapshot."""


def learning_root(paths: Iterable[Path]) -> Path:
    """Resolve the shared learning namespace used for locking and recovery."""
    resolved = [Path(path).resolve() for path in paths]
    if not resolved:
        raise ValueError("at least one learning state path is required")

    for path in resolved:
        candidates = [path] if path.is_dir() else []
        candidates.extend(path.parents)
        for parent in candidates:
            if parent.name == "learning":
                return parent

    common = Path(os.path.commonpath([str(path.parent) for path in resolved]))
    return common


def snapshot_paths(paths: Iterable[Path]) -> dict[Path, bytes | None]:
    """Capture exact file bytes, preserving the distinction between absent and empty."""
    return {
        Path(path): (Path(path).read_bytes() if Path(path).exists() else None)
        for path in paths
    }


def _digest(value: bytes | None) -> str | None:
    if value is None:
        return None
    return hashlib.sha256(value).hexdigest()


def _read_optional(path: Path) -> bytes | None:
    return path.read_bytes() if path.exists() else None


def _fsync_file(path: Path) -> None:
    with path.open("rb") as stream:
        os.fsync(stream.fileno())


def _fsync_directory(path: Path) -> None:
    try:
        flags = os.O_RDONLY
        if hasattr(os, "O_DIRECTORY"):
            flags |= os.O_DIRECTORY
        descriptor = os.open(path, flags)
    except OSError:
        return
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _lock_path(root: Path) -> Path:
    key = hashlib.sha256(str(root.resolve()).encode("utf-8")).hexdigest()[:24]
    return Path(tempfile.gettempdir()) / f"{LOCK_PREFIX}{key}.lock"


def _acquire_lock(stream) -> None:
    if fcntl is not None:
        fcntl.flock(stream.fileno(), fcntl.LOCK_EX)
        return
    if msvcrt is None:  # pragma: no cover - unsupported platform
        raise OSError("learning state locking is unavailable on this platform")
    stream.seek(0)
    stream.write(b"0")
    stream.flush()
    stream.seek(0)
    msvcrt.locking(stream.fileno(), msvcrt.LK_LOCK, 1)


def _release_lock(stream) -> None:
    if fcntl is not None:
        fcntl.flock(stream.fileno(), fcntl.LOCK_UN)
        return
    if msvcrt is not None:  # pragma: no cover - Windows fallback
        stream.seek(0)
        msvcrt.locking(stream.fileno(), msvcrt.LK_UNLCK, 1)


@contextmanager
def learning_state_lock(paths: Iterable[Path]) -> Iterator[Path]:
    """Serialize every learning mutation and recover an interrupted transaction first."""
    paths = [Path(path) for path in paths]
    root = learning_root(paths)
    root.mkdir(parents=True, exist_ok=True)
    lock_path = _lock_path(root)
    with lock_path.open("a+b") as stream:
        _acquire_lock(stream)
        try:
            recover_pending_transaction(root)
            yield root
        finally:
            _release_lock(stream)


def _journal_path(root: Path) -> Path:
    return root / JOURNAL_NAME


def _relative_path(root: Path, path: Path) -> str:
    try:
        relative = Path(path).resolve().relative_to(root.resolve())
    except ValueError as error:
        raise StateConflictError(f"learning state target is outside its namespace: {path}") from error
    if not relative.parts:
        raise StateConflictError("learning state target cannot be the namespace directory")
    return relative.as_posix()


def _entry_path(root: Path, entry: Mapping[str, object]) -> Path:
    relative = Path(str(entry["path"]))
    if relative.is_absolute() or ".." in relative.parts:
        raise StateConflictError("learning transaction contains an unsafe target path")
    target = (root / relative).resolve()
    root = root.resolve()
    if root not in target.parents:
        raise StateConflictError("learning transaction target escapes its namespace")
    return target


def _matches(path: Path, exists: bool, digest: str | None) -> bool:
    current = _read_optional(path)
    return (current is not None) == exists and _digest(current) == digest


def _write_manifest(path: Path, manifest: dict) -> None:
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    _fsync_file(temporary)
    os.replace(temporary, path)
    _fsync_directory(path.parent)


def _restore_from_backup(backup: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(f".{target.name}.{os.getpid()}.recovery.tmp")
    shutil.copyfile(backup, temporary)
    _fsync_file(temporary)
    os.replace(temporary, target)
    _fsync_directory(target.parent)


def _cleanup_transaction(root: Path, journal: Path, transaction_dir: Path) -> None:
    journal.unlink(missing_ok=True)
    shutil.rmtree(transaction_dir, ignore_errors=True)
    _fsync_directory(root)


def recover_pending_transaction(root: Path) -> None:
    """Finish a committed transaction or roll it back to its original snapshot."""
    journal = _journal_path(root)
    if not journal.exists():
        for orphan in root.glob(".learning-tx-*"):
            shutil.rmtree(orphan, ignore_errors=True)
        return

    try:
        manifest = json.loads(journal.read_text(encoding="utf-8"))
        transaction_dir = root / str(manifest["transaction_dir"])
        entries = manifest["entries"]
    except (OSError, KeyError, TypeError, ValueError) as error:
        raise StateConflictError(f"cannot recover learning transaction: {error}") from error

    if not transaction_dir.is_dir():
        raise StateConflictError("learning transaction journal has no transaction directory")

    committed = all(
        _matches(
            _entry_path(root, entry),
            bool(entry["new_exists"]),
            entry["new_sha256"],
        )
        for entry in entries
    )
    if committed:
        _cleanup_transaction(root, journal, transaction_dir)
        return

    for entry in entries:
        target = _entry_path(root, entry)
        if bool(entry["original_exists"]):
            backup = transaction_dir / str(entry["backup"])
            if not backup.exists():
                raise StateConflictError(f"learning transaction is missing backup for {target}")
            _restore_from_backup(backup, target)
        else:
            target.unlink(missing_ok=True)

    if not all(
        _matches(
            _entry_path(root, entry),
            bool(entry["original_exists"]),
            entry["original_sha256"],
        )
        for entry in entries
    ):
        raise StateConflictError("learning transaction rollback did not restore the original snapshot")

    _cleanup_transaction(root, journal, transaction_dir)


def write_files_atomic(
    values: Mapping[Path, str],
    *,
    originals: Mapping[Path, bytes | None] | None = None,
    root: Path | None = None,
) -> None:
    """Commit related JSON files with stale-snapshot checks and crash recovery."""
    if not values:
        return

    targets = {Path(path): text.encode("utf-8") for path, text in values.items()}
    root = root or learning_root(targets)
    root.mkdir(parents=True, exist_ok=True)
    for target in targets:
        _relative_path(root, target)
    recover_pending_transaction(root)

    expected = dict(originals) if originals is not None else snapshot_paths(targets)
    for target in targets:
        if target not in expected:
            raise ValueError(f"missing original snapshot for {target}")
        if _read_optional(target) != expected[target]:
            raise StateConflictError(
                f"learning state changed while this operation was in progress: {target}; retry from a fresh snapshot"
            )

    transaction_dir = Path(tempfile.mkdtemp(prefix=".learning-tx-", dir=root))
    entries: list[dict[str, object]] = []
    try:
        for index, (target, content) in enumerate(targets.items()):
            target.parent.mkdir(parents=True, exist_ok=True)
            original = expected[target]
            stage_name = f"new-{index}"
            stage = transaction_dir / stage_name
            stage.write_bytes(content)
            _fsync_file(stage)
            backup_name = None
            if original is not None:
                backup_name = f"old-{index}"
                backup = transaction_dir / backup_name
                backup.write_bytes(original)
                _fsync_file(backup)
            entries.append({
                "path": _relative_path(root, target),
                "stage": stage_name,
                "backup": backup_name,
                "original_exists": original is not None,
                "original_sha256": _digest(original),
                "new_exists": True,
                "new_sha256": _digest(content),
            })

        manifest = {
            "version": 1,
            "transaction_dir": transaction_dir.name,
            "entries": entries,
        }
        journal = _journal_path(root)
        _write_manifest(journal, manifest)

        for entry in entries:
            target = _entry_path(root, entry)
            os.replace(transaction_dir / str(entry["stage"]), target)
            _fsync_directory(target.parent)

        if not all(
            _matches(_entry_path(root, entry), True, entry["new_sha256"])
            for entry in entries
        ):
            raise StateConflictError("learning transaction commit did not produce the requested snapshot")

        _cleanup_transaction(root, journal, transaction_dir)
    except Exception:
        try:
            recover_pending_transaction(root)
        except Exception:
            # Leave the journal in place so the next locked operation can recover it.
            pass
        raise
