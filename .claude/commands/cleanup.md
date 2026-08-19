---
name: cleanup
description: Cleans up workflow markdown files older than the configured retention period.
---

## Configuration

```
RETENTION_DAYS = 7
```

> **To change retention period**: Update the `RETENTION_DAYS` value above.

---

## Goal

Clean up workflow markdown files older than `RETENTION_DAYS` in `docs/ai/` directories.

---

## Step 1: Select Cleanup Scope

**Tool:** AskUserQuestion

```
Question: Which scope do you want to clean up?
Options:
  1. Main files only - Delete main files (exclude archive/ folders)
  2. Archive only - Delete only files in archive/ folders
  3. All files - Delete both main files and archive/
```

**Set internal flag:** `CLEANUP_SCOPE = main_only | archive_only | all`

---

## Step 2: Scan Files

**Directories to scan:**

```
docs/ai/research/plans/             # epic-*.md, feature-*.md
docs/ai/research/plans/archive/     # backup files
docs/ai/features/checklists/              # unit-*.md, integration-*.md, web-*.md
docs/ai/features/designs/archive/ # backup files (requirements main files are never deleted)
```

**Based on CLEANUP_SCOPE:**
- `main_only`: Scan all except `archive/` folders
- `archive_only`: Scan only `archive/` folders
- `all`: Scan everything

**Command to find old files (older than RETENTION_DAYS):**

```bash
find docs/ai/research/plans docs/ai/features/checklists docs/ai/features/designs/archive -name "*.md" -type f -mtime +{RETENTION_DAYS} 2>/dev/null
```

**For archive only:**

```bash
find docs/ai/research/plans/archive docs/ai/features/designs/archive -name "*.md" -type f -mtime +{RETENTION_DAYS} 2>/dev/null
```

**For main only (exclude archive):**

```bash
find docs/ai/research/plans docs/ai/features/checklists -name "*.md" -type f -mtime +{RETENTION_DAYS} -not -path "*/archive/*" 2>/dev/null
```

---

## Step 3: Build File List

**For each file found:**
1. Get file path
2. Get last modified date
3. Calculate age in days

**Format output:**

```markdown
## Files older than {RETENTION_DAYS} days

| File | Last Modified | Age |
|------|---------------|-----|
| docs/ai/research/plans/feature-login.md | 2025-01-10 | 15 days |
| docs/ai/research/plans/archive/feature-auth_20250105.md | 2025-01-05 | 20 days |
| docs/ai/features/checklists/unit-auth.md | 2025-01-12 | 13 days |
| docs/ai/features/checklists/web-login.md | 2025-01-14 | 11 days |

**Total: X files**
```

**If no files found:**

```
✓ No files older than {RETENTION_DAYS} days found in the selected scope.
```

Then exit.

---

## Step 4: Confirm Deletion

**Tool:** AskUserQuestion

```
Question: Confirm deletion of {X} files listed above?
Options:
  1. Yes, delete all - Delete all listed files
  2. No, cancel - Cancel, do not delete anything
```

**If user chooses "No, cancel":**

```
✓ Cancelled. No files were deleted.
```

Then exit.

---

## Step 5: Execute Deletion

**For each file in the list:**

```bash
rm "{file_path}"
```

**Track results:**
- Files deleted successfully
- Files failed to delete (if any)

---

## Step 6: Report Results

```markdown
## Cleanup Complete

✓ Deleted: {success_count} files
✗ Failed: {failed_count} files

### Deleted Files
- docs/ai/research/plans/feature-login.md
- docs/ai/research/plans/archive/feature-auth_20250105.md
- docs/ai/features/checklists/unit-auth.md

{If any failed:}
### Failed to Delete
- {file_path}: {error message}
```

---

## Notes

- **Retention period**: Configured via `RETENTION_DAYS` variable (default: 7)
- **Safe by default**: Always requires confirmation before deletion
- **No orphan detection**: Only checks file age, not relationships
- **Templates excluded**: Does not delete `*-template.md` files

### File Patterns Affected

| Directory | Patterns |
|-----------|----------|
| `docs/ai/research/plans/` | `epic-*.md`, `feature-*.md` |
| `docs/ai/research/plans/archive/` | `epic-*_*.md`, `feature-*_*.md` |
| `docs/ai/features/checklists/` | `unit-*.md`, `integration-*.md`, `web-*.md` |
| `docs/ai/features/designs/archive/` | `req-*_*.md` |

### Excluded from Cleanup

- Template files: `*-template.md`
- Non-markdown files
- Files in other directories
