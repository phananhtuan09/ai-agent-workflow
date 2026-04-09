---
name: wiki-reconcile
description: Reconcile implementation behavior with the project wiki without silently rewriting confirmed truth.
---

Compare code or runtime behavior against the target project wiki docs and produce a safe discrepancy assessment.

## Workflow Alignment

- Provide brief status updates (1-3 sentences) before important actions.
- For medium or large reconciliations, create todos (14 words or fewer, verb-led). Keep one `in_progress` item.
- Keep confirmed, inferred, and unknown findings separate throughout the review.

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

## Step 1: Load Root and Target Context

Read:

- `<WIKI_ROOT>/README.md`
- `<WIKI_ROOT>/INDEX.md`
- `<WIKI_ROOT>/GOVERNANCE.md`
- relevant canonical docs for the target area

If the target topic is unclear, start from the nearest canonical feature or flow doc and expand outward only as needed.

## Step 2: Inspect the Implementation Surface

- Read the relevant code paths, contracts, or runtime evidence.
- Focus on the implementation surfaces that materially affect the targeted behavior.
- Do not broaden the review into unrelated cleanup.

## Step 3: Classify Each Mismatch

For every mismatch between docs and implementation, classify it as one of:

- doc likely outdated
- code likely drifted from intended behavior
- ambiguity; human decision required

Do not silently edit confirmed docs to match code.

## Step 4: Produce the Safe Follow-up Path

- If requested, create a draft discrepancy note using `<WIKI_ROOT>/99_templates/template_discrepancy_note.md`.
- If the right next step is a proposed doc update, keep confirmed content intact until the mismatch is resolved.
- State any knowledge gaps that prevented a stronger conclusion.

## Step 5: Output Summary

Report:

- resolved `WIKI_ROOT`
- docs checked
- code areas checked
- mismatch list with classification for each
- suggested next action
