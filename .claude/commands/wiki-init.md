---
name: wiki-init
description: Initialize a project wiki in the current repo by copying the template structure and customizing it for the project.
---

Set up a fresh `project-wiki/` in the current project repository from the wiki template. Clears demo content, keeps governance and templates, and stubs out project-specific docs with the provided project name.

## Workflow Alignment

- Provide brief status updates (1-3 sentences) before important actions.
- Stop and ask before overwriting if `project-wiki/` already exists.
- Do not invent project details — use only what the user provides.

---

## Step 0: Parse Inputs

Extract from the user prompt:

- **Project name** — required. Used to populate titles and summaries.
- **Project description** — optional. One sentence describing what the project does.
- **Template path** — required. Path to the cloned wiki template repo (e.g. `~/source_code/ai-projects-wiki`).

If project name or template path is missing, stop and ask:

> To initialize the wiki, provide:
> - Project name: the name of this project
> - Template path: path to the cloned wiki template repo
>
> Example: `/wiki-init "Sagas" template:~/source_code/ai-projects-wiki`

## Step 1: Pre-flight Checks

1. Verify the template path exists and contains a `project-wiki/` folder. If not, stop and report the invalid path.
2. Check if `project-wiki/` already exists in the current working directory.
   - If it exists, stop and ask: **"A `project-wiki/` folder already exists. Overwrite it? This will delete all existing wiki content."**
   - Only proceed if the user explicitly confirms.

## Step 2: Copy Template Structure

Copy the full `project-wiki/` folder from the template path to the current working directory:

```
cp -r <template-path>/project-wiki/ ./project-wiki/
```

Verify the copy succeeded before continuing.

## Step 3: Remove Demo Content

Delete these files — they contain wiki-about-itself demo content that does not belong in a real project:

**Feature specs (demo):**
- `project-wiki/03_features/core/feature-wiki-foundation.md`
- `project-wiki/03_features/authoring/feature-doc-lifecycle-and-governance.md`
- `project-wiki/03_features/retrieval/feature-index-and-navigation.md`
- `project-wiki/03_features/verification/feature-validator-and-freshness.md`

**Flow specs (demo):**
- `project-wiki/04_flows/doc-create-or-update-flow.md`
- `project-wiki/04_flows/impact-analysis-flow.md`
- `project-wiki/04_flows/discrepancy-reconciliation-flow.md`

**ADRs (demo):**
- `project-wiki/06_decisions/ADR-001-docs-source-of-truth-boundary.md`
- `project-wiki/06_decisions/ADR-002-one-canonical-doc-per-topic.md`
- `project-wiki/06_decisions/ADR-003-visible-uncertainty.md`

## Step 4: Reset Project-Specific Docs to Stubs

Replace the body content of the following files with minimal stubs. Keep the frontmatter structure but update `title`, `summary`, and `last_updated`. Set all statuses to `proposed`.

**Stubs to write:**

`project-wiki/README.md` — update title and description to use the project name. Keep the structure sections but replace wiki-system-specific text with project-appropriate placeholders.

`project-wiki/CHANGELOG.md` — reset to empty changelog with only the header and a placeholder entry: `- <DATE> — Initial wiki setup for <project-name>.`

`project-wiki/GLOSSARY.md` — reset to header only with a placeholder comment: `Add project-specific terms here.`

`project-wiki/01_onboarding/project_overview.md` — stub with project name in title and `## Purpose`, `## Users`, `## Scope` sections left blank for the team to fill.

`project-wiki/01_onboarding/business_context.md` — stub with project name, blank `## Problem`, `## Value`, `## Constraints` sections.

`project-wiki/01_onboarding/architecture_summary.md` — stub with project name, blank `## Overview` section.

`project-wiki/02_requirements/confirmed/business_rules.md` — reset to empty `## Confirmed` (none yet) and empty `## Inferred` section.

`project-wiki/02_requirements/confirmed/product_scope.md` — reset to empty `## In Scope` and `## Out of Scope` sections.

`project-wiki/02_requirements/confirmed/constraints.md` — reset to empty `## Constraints` section.

`project-wiki/02_requirements/confirmed/non_functional_requirements.md` — reset to empty `## Requirements` section.

`project-wiki/07_operations/release_process.md` — reset to stub with blank `## Process` section.

`project-wiki/07_operations/incident_known_risks.md` — reset to stub with blank `## Known Risks` section.

`project-wiki/07_operations/dependency_notes.md` — reset to stub with blank `## Dependencies` section.

`project-wiki/08_verification/test_strategy.md` — reset to stub with blank `## Strategy` section.

`project-wiki/08_verification/impact_analysis_rules.md` — reset to stub with blank `## Rules` section.

`project-wiki/08_verification/regression_sensitive_areas.md` — reset to stub with blank `## Areas` section.

`project-wiki/08_verification/acceptance_criteria_patterns.md` — reset to stub with blank `## Patterns` section.

`project-wiki/09_references/external_dependencies.md` — reset to stub with blank `## Dependencies` section.

`project-wiki/09_references/third_party_services.md` — reset to stub with blank `## Services` section.

`project-wiki/09_references/related_links.md` — reset to stub with blank `## Links` section.

## Step 5: Update INDEX.md

Update `project-wiki/INDEX.md`:

- Replace the title and summary with the project name.
- Remove links to deleted demo feature specs, flow specs, and ADRs from all sections.
- Keep the read path, domain sections, template library, and navigation structure intact.
- Update `last_updated` to today.

**Keep these files as-is** (they are generic and apply to any project):

- `project-wiki/GOVERNANCE.md`
- `project-wiki/01_onboarding/how_to_read_this_wiki.md`
- `project-wiki/99_templates/*` (all templates)
- All folder `README.md` files under subfolders

## Step 6: Output Summary

Report:

- project name used
- template path used
- files deleted (demo content)
- files reset to stubs
- files kept as-is
- next steps: which docs to fill in first
