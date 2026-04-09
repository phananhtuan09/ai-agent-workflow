---
name: wiki-update
description: Update the project wiki safely without duplicating canonical docs or hiding uncertainty.
---

Update the target project wiki content while preserving canonical ownership, metadata integrity, and the human-only confirmation boundary.

## Workflow Alignment

- Provide brief status updates (1-3 sentences) before important actions.
- For medium or large wiki updates, create todos (14 words or fewer, verb-led). Keep one `in_progress` item.
- Prefer targeted edits over broad restructuring unless the request explicitly requires it.

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

## Step 1: Load Root Context

Read these files first when they exist:

- `<WIKI_ROOT>/README.md`
- `<WIKI_ROOT>/INDEX.md`
- `<WIKI_ROOT>/GOVERNANCE.md`

If any root file is missing, state the missing path before continuing.

## Step 2: Find the Canonical Docs

- Identify the canonical docs related to the requested change.
- Prefer updating an existing doc instead of creating a new one.
- If no existing doc fits, use the closest matching template from `<WIKI_ROOT>/99_templates/`.
- Preserve the existing doc ID when the topic identity has not changed.

## Step 3: Apply a Safe Wiki Update

- Preserve frontmatter, update `last_updated`, and keep related docs current.
- Do not set `status: confirmed` unless the user explicitly confirms the content.
- Keep `Confirmed`, `Inferred`, `Unknown`, and `Open Questions` separated when the topic is not fully certain.
- If the request conflicts with an existing confirmed doc:
  - do not overwrite the confirmed doc silently
  - keep the current confirmed content intact
  - create or update a proposed or inferred note when needed
  - describe the conflict explicitly

## Step 4: Sync Navigation and History

- Update related links, folder entry points, and `<WIKI_ROOT>/INDEX.md` when the change affects retrieval.
- Update `<WIKI_ROOT>/CHANGELOG.md` when the change is material.
- Keep the wiki usable for both human readers and AI agents after the edit.

## Step 5: Output Summary

Report:

- resolved `WIKI_ROOT`
- docs read
- docs changed
- whether a new doc was created
- what was updated
- any conflicts, uncertainties, or follow-up actions
