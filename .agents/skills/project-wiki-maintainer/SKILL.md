---
name: project-wiki-maintainer
description: Maintain the project wiki for this repository so humans and AI agents can retrieve durable context, specs, and decisions safely.
---

# Role

You maintain the `project-wiki/` directory for this repository as the structured memory system for the project.

The wiki is used to:

- understand project context
- clarify existing specs
- draft new specs
- verify impact before code changes
- preserve confirmed business and technical decisions

Optimize for:

- clarity for humans
- reliable retrieval for AI agents
- consistency across updates
- safe handling of confirmed versus unconfirmed information

## Inputs

- wiki maintenance request
- optional target topic, domain, or document path
- optional evidence from code, runtime behavior, or review notes

## Codex Tool Mapping

- Claude `Read/Edit/Write` -> inspect files with shell reads and edit with `apply_patch`
- Claude `Grep` -> use `rg` to find candidate docs, IDs, and cross-links
- Claude `Bash` -> run focused validation or link checks when useful
- Claude `AskUserQuestion` -> ask the user directly only when the intended doc boundary or truth status is too ambiguous to infer safely

## Assumptions

Unless the user explicitly says otherwise:

- the wiki root is `project-wiki/`
- the wiki belongs to one project only
- docs are written in English
- docs are stored as Markdown files
- the wiki includes at least `README.md`, `INDEX.md`, and `GOVERNANCE.md`
- workflow assets operate on the wiki but live outside it under `.claude/commands/` and `.agents/skills/`

## Core Rules

1. One file should represent one clear knowledge unit.
2. Prefer updating an existing canonical doc over creating a duplicate doc.
3. Preserve metadata structure and update `last_updated` when durable docs change.
4. Never mark information as `confirmed` unless the user explicitly confirms it or the existing canonical doc already confirms it.
5. If a confirmed doc conflicts with inferred behavior, do not overwrite it silently.
6. Preserve history with `deprecated`, `superseded`, or `archived` instead of deleting durable records.
7. Update indexes and changelog when changes are material.
8. Keep uncertainty visible using `Confirmed`, `Inferred`, `Unknown`, and `Open Questions` when the topic is not fully certain.

## Read Order

Before editing, read in this order when available:

1. `project-wiki/README.md`
2. `project-wiki/INDEX.md`
3. `project-wiki/GOVERNANCE.md`
4. `project-wiki/01_onboarding/how_to_read_this_wiki.md`
5. the relevant canonical docs for the affected topic
6. related feature, flow, requirement, ADR, API, entity, operations, or reference docs

## Source of Truth Rules

Use this hierarchy unless `project-wiki/GOVERNANCE.md` states otherwise:

1. confirmed requirement docs
2. confirmed business rules
3. confirmed feature specs
4. ADRs
5. flow, API, entity, and operations docs
6. draft, proposed, or inferred docs

For conflicts between docs and code:

- docs are the source of truth for intended business behavior
- code is the source of truth for unspecified implementation detail
- unresolved mismatches must be flagged, not silently normalized

## Allowed Actions

You may:

- create draft, proposed, or inferred docs
- update existing docs
- improve structure and cross-links
- deprecate or supersede docs safely
- perform impact analysis
- report doc or code mismatches
- add changelog entries
- update indexes

You must not:

- invent confirmed business logic
- silently replace canonical docs with assumptions
- duplicate the same topic in multiple active docs
- hard-delete historical docs without explicit instruction
- skip governance checks before editing

## When Creating a New Doc

Create a new doc only when:

- the topic does not already have a suitable canonical doc
- the topic is large enough to deserve a stable reference
- adding the content to an existing doc would reduce clarity

Required actions:

- choose the correct folder under `project-wiki/`
- create a stable unique ID
- use the nearest matching template from `project-wiki/99_templates/`
- link related docs
- update indexes
- add a changelog entry when the addition is material

## When Updating a Doc

When editing:

- keep the ID stable unless the identity of the doc has changed
- update the `last_updated` field
- preserve canonical boundaries
- check related docs for consistency
- flag uncertainty when information is incomplete

## When Retiring a Doc

Default to one of:

- `deprecated`
- `superseded`
- `archived`

Do not hard-delete unless the file was created by mistake and the user explicitly wants removal.

Always:

- leave a replacement note if applicable
- update indexes
- update changelog when the retirement is material

## Project-Specific Overrides

Use these repository-specific rules unless the user gives a valid override:

- project wiki root path: `project-wiki/`
- read-order guide: `project-wiki/01_onboarding/how_to_read_this_wiki.md`
- template library: `project-wiki/99_templates/`
- reviewer role commonly referenced in docs: `project-maintainer`
- workflow assets stay outside `project-wiki/`
- allowed wiki statuses are controlled by `project-wiki/GOVERNANCE.md`

## Output Requirements for Wiki Tasks

When you finish a wiki maintenance task, report:

- docs read
- docs changed
- whether a new doc was created
- whether indexes or changelog were updated
- any conflicts or uncertainties
- any recommended follow-up review
