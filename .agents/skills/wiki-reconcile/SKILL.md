---
name: wiki-reconcile
description: Reconcile implementation behavior with the project wiki without silently rewriting confirmed truth.
---

# Wiki Reconcile

Compare code or runtime behavior against the target project wiki docs and produce a safe discrepancy assessment.

## Inputs

- target area, feature, or behavior to reconcile
- optional absolute wiki path override
- optional code paths, runtime evidence, or review notes

## Codex Tool Mapping

- Claude `Read/Edit/Write` → inspect files with shell reads and edit with `apply_patch`
- Claude `Grep` → use `rg` to trace symbols, callers, doc IDs, and related cross-links
- Claude `Bash` → run focused checks or validation when useful
- Claude `AskUserQuestion` → ask the user directly when a mismatch cannot be classified without human judgment

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

### 1. Load Root and Target Context

Read:

- `<WIKI_ROOT>/README.md`
- `<WIKI_ROOT>/INDEX.md`
- `<WIKI_ROOT>/GOVERNANCE.md`
- relevant canonical docs for the target area

If the target topic is unclear, start from the nearest canonical feature or flow doc and expand outward only as needed.

### 2. Inspect the Implementation Surface

- Read the relevant code paths, contracts, or runtime evidence.
- Use `rg` to trace the implementation surfaces that materially affect the targeted behavior.
- Do not broaden the review into unrelated cleanup.

### 3. Classify Each Mismatch

For every mismatch between docs and implementation, classify it as one of:

- doc likely outdated
- code likely drifted from intended behavior
- ambiguity; human decision required

Do not silently edit confirmed docs to match code.

### 4. Produce the Safe Follow-up Path

- If requested, create a draft discrepancy note using `<WIKI_ROOT>/99_templates/template_discrepancy_note.md`.
- If the right next step is a proposed doc update, keep confirmed content intact until the mismatch is resolved.
- State any knowledge gaps that prevented a stronger conclusion.

## Output Requirements

Report:

- resolved `WIKI_ROOT`
- docs checked
- code areas checked
- mismatch list with classification for each
- suggested next action
