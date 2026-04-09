---
name: wiki-add-feature
description: Add a new wiki feature spec only when no existing canonical doc already owns the topic.
---

# Wiki Add Feature

Create a new feature specification in the target project wiki only when the topic does not already have a suitable canonical home.

## Inputs

- feature description or topic to document
- optional absolute wiki path override
- optional domain, related flows, or existing context

## Codex Tool Mapping

- Claude `Read/Edit/Write` → inspect files with shell reads and edit with `apply_patch`
- Claude `Grep` → use `rg` to find candidate docs, IDs, and cross-links
- Claude `Bash` → run focused validation when useful
- Claude `AskUserQuestion` → ask the user directly only when the feature boundary or truth status is too ambiguous to infer safely

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

### 1. Load Root and Domain Context

Read:

- `<WIKI_ROOT>/README.md`
- `<WIKI_ROOT>/INDEX.md`
- `<WIKI_ROOT>/GOVERNANCE.md`
- `<WIKI_ROOT>/02_requirements/confirmed/business_rules.md`
- `<WIKI_ROOT>/01_onboarding/how_to_read_this_wiki.md`
- `<WIKI_ROOT>/03_features/README.md`

Then read the relevant existing feature, flow, ADR, API, or entity docs for the target topic.

### 2. Check for an Existing Canonical Topic

- Use `rg` to search for the topic across current feature docs, related flows, and ADRs.
- Check whether the same behavior already exists under a different title or domain folder.
- If an existing canonical doc fits, update it instead of creating a new file.

### 3. Create the New Feature Spec Only If Needed

When a new doc is justified:

- choose the appropriate folder under `<WIKI_ROOT>/03_features/`
- create a stable unique ID
- use `<WIKI_ROOT>/99_templates/template_feature_spec.md` as the base
- set `status: proposed` unless the user explicitly confirms business logic
- add related docs and cross-links
- keep `Confirmed`, `Inferred`, `Unknown`, and `Open Questions` separate when certainty is incomplete

### 4. Sync Retrieval Surfaces

- Update `<WIKI_ROOT>/INDEX.md` or the relevant folder entry point so readers can find the new spec.
- Update `<WIKI_ROOT>/CHANGELOG.md` if the addition is material.

## Output Requirements

Report:

- resolved `WIKI_ROOT`
- chosen doc path
- why a new doc was created instead of updating an existing one
- related docs reviewed
- open questions or assumptions
