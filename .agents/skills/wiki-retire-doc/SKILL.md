---
name: wiki-retire-doc
description: Retire a project wiki document safely while preserving history and repairable references.
---

# Wiki Retire Doc

Retire an inactive document in the target project wiki without hard-deleting durable history or leaving readers guessing about the replacement path.

## Inputs

- target doc path or ID to retire
- optional absolute wiki path override
- optional replacement doc or reason for retirement

## Codex Tool Mapping

- Claude `Read/Edit/Write` → inspect files with shell reads and edit with `apply_patch`
- Claude `Grep` → use `rg` to find incoming references and index entries that point to the target doc
- Claude `Bash` → run focused validation when useful
- Claude `AskUserQuestion` → ask the user directly when the correct retirement status or replacement path is unclear

## Step 0: Resolve Wiki Root

Determine `WIKI_ROOT` using this order:

1. **Absolute path provided** — if the prompt contains a path starting with `/`, `~`, or a Windows drive letter (e.g. `C:\`), use that path directly.
2. **No path specified** — use `project-wiki/` relative to the current working directory.

If the resolved path does not exist, stop and respond:

> The wiki folder `<WIKI_ROOT>` does not exist.
> Copy the template into your project repo first:
> ```
> cp -r <template-repo>/project-wiki/ <your-project>/project-wiki/
> ```
> Then re-run this command from your project root.

## Workflow

### 1. Load Governance and Retrieval Context

Read:

- `<WIKI_ROOT>/GOVERNANCE.md`
- `<WIKI_ROOT>/INDEX.md`
- the target doc
- the nearest folder entry point when the target doc sits below an indexed folder

### 2. Choose the Correct Retirement Status

Decide whether the doc should be:

- `deprecated`
- `superseded`
- `archived`

Do not hard-delete unless the file was created by mistake and the user explicitly wants removal.

### 3. Retire the Doc Safely

- Update the doc metadata status using `apply_patch`.
- Add a replacement or reference note when another doc supersedes it.
- Preserve the existing ID unless the doc identity truly changed.

### 4. Repair Navigation and History

- Update `<WIKI_ROOT>/INDEX.md` and any obvious folder entry points that still present the retired doc as active.
- Use `rg` to find other incoming references that should point to the replacement doc.
- Update `<WIKI_ROOT>/CHANGELOG.md` when the retirement is material.

## Output Requirements

Report:

- resolved `WIKI_ROOT`
- retired doc
- chosen status
- replacement doc if any
- indexes updated
- references that may still need manual cleanup
