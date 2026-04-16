---
name: wiki-review-queue
description: List all wiki docs that need human review, grouped by priority.
---

# Wiki Review Queue

Scan the target project wiki and produce a prioritized list of docs that require human confirmation — docs with unconfirmed status, blank stub sections, or open questions.

## Inputs

- optional absolute wiki path override

## Codex Tool Mapping

- Claude `Read` → inspect files with shell reads
- Claude `Grep` → use `rg` to scan for status values, blank sections, and open question markers
- Claude `Bash` → list files under wiki folders
- No file edits — read and report only

## Step 0: Resolve Wiki Root

Determine `WIKI_ROOT` using this order:

1. **Absolute path provided** — if the prompt contains a path starting with `/`, `~`, or a Windows drive letter (e.g. `C:\`), use that path directly.
2. **No path specified** — use `project-wiki/` relative to the current working directory.

If the resolved path does not exist, stop and respond:

> The wiki folder `<WIKI_ROOT>` does not exist.
> Run `wiki-init` first to set up the wiki for this project.

## Workflow

### 1. Scan for Unconfirmed Status

Read all `.md` files under `WIKI_ROOT` (excluding `99_templates/`).

Use `rg` to flag any file where frontmatter contains:
- `status: proposed`
- `status: inferred`
- `status: draft`
- missing `status` field

### 2. Scan for Blank Stub Sections

Within each file, flag sections where the heading exists but the body is empty or contains only a placeholder:
- `Add project-specific terms here.`
- `_To be filled in._`
- `<!-- TODO -->`
- A heading followed immediately by the next heading with no content

Target section headings: `## Purpose`, `## Users`, `## Scope`, `## Problem`, `## Value`, `## Constraints`, `## Overview`, `## Process`, `## Strategy`, `## Known Risks`, `## Dependencies`, `## Rules`, `## In Scope`, `## Out of Scope`, `## Confirmed`, `## Inferred`.

### 3. Scan for Open Questions

Use `rg` to flag any file containing:
- A non-empty `## Open Questions` or `## Unknown` section
- Inline markers: `[?]`, `TBD`, `TODO`, `FIXME`

### 4. Group by Priority

| Priority | Folder | Reason |
|---|---|---|
| P1 | `01_onboarding/` | Blocks new members and AI context loading |
| P1 | `02_requirements/` | Blocks feature work and scope decisions |
| P2 | `03_features/` | Needed before implementation starts |
| P2 | `04_flows/` | Needed for flow-dependent features |
| P3 | `06_decisions/` | Important but not blocking daily work |
| P3 | `07_operations/` | Needed before first release |
| P3 | `08_verification/` | Needed before QA starts |
| P4 | `09_references/` | Fill as needed |
| P4 | Root files | `GLOSSARY.md`, `CHANGELOG.md` |

## Output Requirements

```
## Wiki Review Queue — <project-name>
Scanned: <N> files | Needs review: <N> files

### P1 — Fill These First
- [ ] 01_onboarding/project_overview.md — status: proposed, blank: Purpose, Users, Scope

### P2 — Before Feature Work
- [ ] 03_features/... — open questions: 2

### P3 — Before Release
- [ ] 07_operations/release_process.md — blank: Process

### P4 — Fill As Needed
- [ ] GLOSSARY.md — placeholder only

---
Suggested next step: start with P1 items, use `wiki-update` to fill each doc.
```

If all docs are confirmed and complete:
> All wiki docs are confirmed. No review items outstanding.
