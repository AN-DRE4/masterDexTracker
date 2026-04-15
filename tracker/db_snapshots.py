"""Utilities for creating and restoring SQLite DB snapshots."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import re
import shutil

from django.conf import settings

DEFAULT_RETENTION = 10
DB_FILENAME = "db.sqlite3"
SNAPSHOT_DIR = Path("backups") / "db"
SNAPSHOT_PREFIX = "db_"
SNAPSHOT_EXT = ".sqlite3"


@dataclass(frozen=True)
class SnapshotInfo:
    path: Path
    created_at: datetime


def _base_dir() -> Path:
    return Path(settings.BASE_DIR)


def database_path() -> Path:
    return _base_dir() / DB_FILENAME


def snapshots_dir() -> Path:
    return _base_dir() / SNAPSHOT_DIR


def _sanitize_label(label: str | None) -> str:
    if not label:
        return ""
    normalized = re.sub(r"[^A-Za-z0-9_-]+", "_", label.strip())
    normalized = normalized.strip("_")
    return normalized[:40]


def _timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def _snapshot_filename(label: str | None = None) -> str:
    safe = _sanitize_label(label)
    suffix = f"_{safe}" if safe else ""
    return f"{SNAPSHOT_PREFIX}{_timestamp()}{suffix}{SNAPSHOT_EXT}"


def _parse_snapshot_datetime(path: Path) -> datetime:
    stem = path.stem  # db_YYYYMMDD_HHMMSS_optional
    # Keep only "YYYYMMDD_HHMMSS" part.
    timestamp = stem[len(SNAPSHOT_PREFIX): len(SNAPSHOT_PREFIX) + 15]
    return datetime.strptime(timestamp, "%Y%m%d_%H%M%S")


def list_snapshots() -> list[SnapshotInfo]:
    root = snapshots_dir()
    if not root.exists():
        return []
    snapshots: list[SnapshotInfo] = []
    for p in root.glob(f"{SNAPSHOT_PREFIX}*{SNAPSHOT_EXT}"):
        if not p.is_file():
            continue
        try:
            created_at = _parse_snapshot_datetime(p)
        except ValueError:
            continue
        snapshots.append(SnapshotInfo(path=p, created_at=created_at))
    snapshots.sort(key=lambda s: s.created_at, reverse=True)
    return snapshots


def create_snapshot(label: str | None = None, retention: int = DEFAULT_RETENTION) -> Path:
    db_path = database_path()
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found at {db_path}")

    root = snapshots_dir()
    root.mkdir(parents=True, exist_ok=True)

    target = root / _snapshot_filename(label)
    shutil.copy2(db_path, target)
    prune_snapshots(retention=retention)
    return target


def prune_snapshots(retention: int = DEFAULT_RETENTION) -> list[Path]:
    if retention <= 0:
        return []
    snapshots = list_snapshots()
    to_delete = snapshots[retention:]
    deleted: list[Path] = []
    for item in to_delete:
        item.path.unlink(missing_ok=True)
        deleted.append(item.path)
    return deleted


def resolve_snapshot(identifier: str) -> Path:
    snapshots = list_snapshots()
    if not snapshots:
        raise FileNotFoundError("No snapshots found.")

    if identifier == "latest":
        return snapshots[0].path

    root = snapshots_dir()
    candidate = root / identifier
    if not candidate.exists():
        raise FileNotFoundError(f"Snapshot '{identifier}' not found in {root}")
    return candidate


def restore_snapshot(snapshot_path: Path, retention: int = DEFAULT_RETENTION) -> tuple[Path, Path]:
    db_path = database_path()
    if not snapshot_path.exists():
        raise FileNotFoundError(f"Snapshot not found at {snapshot_path}")

    # Safety net: backup current DB before replacing it.
    safety = create_snapshot(label="before_restore", retention=retention)
    shutil.copy2(snapshot_path, db_path)
    return safety, db_path
