---
name: wiki-retire-doc
description: Retire a project wiki document safely while preserving history and repairable references.
---

Retire an inactive document in the target project wiki without hard-deleting durable history or leaving readers guessing about the replacement path.

## Workflow Alignment

- Provide brief status updates (1-3 sentences) before important actions.
- For medium or large retirement work, create todos (14 words or fewer, verb-led). Keep one `in_progress` item.
- Prefer status-based retirement over deletion.

---

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

## Step 1: Load Governance and Retrieval Context

Read:

- `<WIKI_ROOT>/GOVERNANCE.md`
- `<WIKI_ROOT>/INDEX.md`
- the target doc
- the nearest folder entry point when the target doc sits below an indexed folder

## Step 2: Choose the Correct Retirement Status

Decide whether the doc should be:

- `deprecated`
- `superseded`
- `archived`

Do not hard-delete unless the file was created by mistake and the user explicitly wants removal.

## Step 3: Retire the Doc Safely

- Update the doc metadata status.
- Add a replacement or reference note when another doc supersedes it.
- Preserve the existing ID unless the doc identity truly changed.

## Step 4: Repair Navigation and History

- Update `<WIKI_ROOT>/INDEX.md` and any obvious folder entry points that still present the retired doc as active.
- Update `<WIKI_ROOT>/CHANGELOG.md` when the retirement is material.
- Review obvious incoming references that should point to the replacement doc instead.

## Step 5: Output Summary

Report:

- resolved `WIKI_ROOT`
- retired doc
- chosen status
- replacement doc if any
- indexes updated
- references that may still need manual cleanup
