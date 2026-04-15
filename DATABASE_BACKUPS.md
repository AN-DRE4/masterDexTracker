# Database Snapshots and Rollback

This project uses SQLite (`db.sqlite3`) and includes commands to create and restore snapshots.

## Where backups are stored

- Directory: `backups/db/`
- Filename format: `db_YYYYMMDD_HHMMSS[_label].sqlite3`
- Retention: keeps the latest 10 snapshots automatically

## Manual backup

Create a snapshot:

```bash
python manage.py backup_db
```

Create a snapshot with a label:

```bash
python manage.py backup_db --label before_big_edit
```

List snapshots:

```bash
python manage.py backup_db --list
```

## Restore

Restore latest snapshot (asks for confirmation):

```bash
python manage.py restore_db
```

Restore specific snapshot:

```bash
python manage.py restore_db db_20260415_103000_before_big_edit.sqlite3
```

Skip prompt (for scripts/automation):

```bash
python manage.py restore_db latest --yes
```

When restoring, the current database is first snapshotted automatically as `before_restore`.

## Automatic pre-change snapshots

The following commands now create backups before modifying data:

- `python manage.py seed_entries`
- `python manage.py import_master_dex_excel <path.xlsx>` (non-dry-run only)

## Recommended workflow before risky operations

1. `python manage.py backup_db --label pre_migration`
2. Run operation (migration/import/manual edits)
3. If needed, rollback with `python manage.py restore_db latest`
