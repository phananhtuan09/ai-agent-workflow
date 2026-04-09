---
name: wiki-init
description: Initialize a project wiki in the current repo by copying the template structure and customizing it for the project.
---

# Wiki Init

Set up a fresh `project-wiki/` in the current project repository from the wiki template. Clears demo content, keeps governance and templates, and stubs out project-specific docs with the provided project name.

## Inputs

- **project name** — required
- **template path** — required. Path to the cloned wiki template repo
- **project description** — optional. One sentence describing the project

Example invocation:
```
wiki-init "Sagas" template:~/source_code/ai-projects-wiki
```

## Codex Tool Mapping

- Claude `Read/Edit/Write` → inspect files with shell reads and write stubs with `apply_patch`
- Claude `Bash` → run `cp -r` to copy template, `rm` to delete demo files
- Claude `AskUserQuestion` → ask when project name or template path is missing, or when overwrite confirmation is needed

## Workflow

### 0. Parse Inputs

Extract from the user prompt:

- **Project name** — required
- **Template path** — required (e.g. `template:~/source_code/ai-projects-wiki`)
- **Project description** — optional

If project name or template path is missing, stop and ask:

> To initialize the wiki, provide:
> - Project name: the name of this project
> - Template path: path to the cloned wiki template repo
>
> Example: `wiki-init "Sagas" template:~/source_code/ai-projects-wiki`

### 1. Pre-flight Checks

1. Verify the template path exists and contains a `project-wiki/` folder. If not, stop and report the invalid path.
2. Check if `project-wiki/` already exists in the current working directory.
   - If it exists, stop and ask: **"A `project-wiki/` folder already exists. Overwrite it? This will delete all existing wiki content."**
   - Only proceed if the user explicitly confirms.

### 2. Copy Template Structure

```bash
cp -r <template-path>/project-wiki/ ./project-wiki/
```

Verify the copy succeeded before continuing.

### 3. Remove Demo Content

Delete these files — they contain wiki-about-itself demo content:

**Feature specs (demo):**
```bash
rm project-wiki/03_features/core/feature-wiki-foundation.md
rm project-wiki/03_features/authoring/feature-doc-lifecycle-and-governance.md
rm project-wiki/03_features/retrieval/feature-index-and-navigation.md
rm project-wiki/03_features/verification/feature-validator-and-freshness.md
```

**Flow specs (demo):**
```bash
rm project-wiki/04_flows/doc-create-or-update-flow.md
rm project-wiki/04_flows/impact-analysis-flow.md
rm project-wiki/04_flows/discrepancy-reconciliation-flow.md
```

**ADRs (demo):**
```bash
rm project-wiki/06_decisions/ADR-001-docs-source-of-truth-boundary.md
rm project-wiki/06_decisions/ADR-002-one-canonical-doc-per-topic.md
rm project-wiki/06_decisions/ADR-003-visible-uncertainty.md
```

### 4. Reset Project-Specific Docs to Stubs

Use `apply_patch` to replace body content with minimal stubs. Keep frontmatter structure, update `title`, `summary`, and `last_updated`. Set all statuses to `proposed`.

Files to stub:

| File | Stub sections |
|------|--------------|
| `README.md` | Update title/description with project name; keep structure |
| `CHANGELOG.md` | Reset to header + one init entry |
| `GLOSSARY.md` | Reset to header + placeholder comment |
| `01_onboarding/project_overview.md` | `## Purpose`, `## Users`, `## Scope` — blank |
| `01_onboarding/business_context.md` | `## Problem`, `## Value`, `## Constraints` — blank |
| `01_onboarding/architecture_summary.md` | `## Overview` — blank |
| `02_requirements/confirmed/business_rules.md` | `## Confirmed` (none yet), `## Inferred` — blank |
| `02_requirements/confirmed/product_scope.md` | `## In Scope`, `## Out of Scope` — blank |
| `02_requirements/confirmed/constraints.md` | `## Constraints` — blank |
| `02_requirements/confirmed/non_functional_requirements.md` | `## Requirements` — blank |
| `07_operations/release_process.md` | `## Process` — blank |
| `07_operations/incident_known_risks.md` | `## Known Risks` — blank |
| `07_operations/dependency_notes.md` | `## Dependencies` — blank |
| `08_verification/test_strategy.md` | `## Strategy` — blank |
| `08_verification/impact_analysis_rules.md` | `## Rules` — blank |
| `08_verification/regression_sensitive_areas.md` | `## Areas` — blank |
| `08_verification/acceptance_criteria_patterns.md` | `## Patterns` — blank |
| `09_references/external_dependencies.md` | `## Dependencies` — blank |
| `09_references/third_party_services.md` | `## Services` — blank |
| `09_references/related_links.md` | `## Links` — blank |

### 5. Update INDEX.md

- Replace title and summary with the project name.
- Remove links to deleted demo feature specs, flow specs, and ADRs.
- Keep read path, domain sections, template library, and navigation structure.
- Update `last_updated` to today.

**Keep as-is** (generic, applies to any project):

- `GOVERNANCE.md`
- `01_onboarding/how_to_read_this_wiki.md`
- `99_templates/*`
- All subfolder `README.md` files

## Output Requirements

Report:

- project name and template path used
- files deleted (demo content)
- files reset to stubs
- files kept as-is
- next steps: which docs to fill in first (suggest: project_overview → business_context → business_rules → first feature spec)
