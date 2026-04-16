---
name: wiki-add-doc
description: Add a new wiki document (feature spec, flow spec, or ADR) only when no existing canonical doc already owns the topic.
---

Create a new document in the target project wiki. Detects the doc type from the prompt, selects the correct folder and template, and checks for duplicates before creating anything.

## Workflow Alignment

- Provide brief status updates (1-3 sentences) before important actions.
- For medium or large additions, create todos (14 words or fewer, verb-led). Keep one `in_progress` item.
- Do not create a new doc when an existing canonical doc should be updated instead.

---

## Step 0: Resolve Wiki Root

Determine `WIKI_ROOT` using this order:

1. **Absolute path provided** — if the prompt contains a path starting with `/`, `~`, or a Windows drive letter (e.g. `C:\`), use that path directly.
2. **No path specified** — use `project-wiki/` relative to the current working directory.

If the resolved path does not exist, stop and respond:

> The wiki folder `<WIKI_ROOT>` does not exist.
> Run `/wiki-init` first to set up the wiki for this project.

## Step 1: Detect Doc Type

Classify the requested doc from the user's prompt:

| Doc type | Keywords / signals | Folder | Template |
|---|---|---|---|
| **feature** | "feature", "functionality", "behavior", "capability" | `03_features/<domain>/` | `99_templates/template_feature_spec.md` |
| **flow** | "flow", "process", "sequence", "steps", "journey", "how X works end-to-end" | `04_flows/` | `99_templates/template_flow_spec.md` |
| **ADR** | "decision", "ADR", "architecture decision", "we decided", "why we chose" | `06_decisions/` | `99_templates/template_adr.md` |

If the doc type is ambiguous, ask:

> What type of doc do you want to create?
> - **A** — Feature spec (a product capability or behavior)
> - **B** — Flow spec (an end-to-end process or user journey)
> - **C** — ADR (an architecture or design decision)

## Step 2: Load Root and Domain Context

Read:

- `<WIKI_ROOT>/README.md`
- `<WIKI_ROOT>/INDEX.md`
- `<WIKI_ROOT>/GOVERNANCE.md`
- The relevant folder README for the target doc type

For **feature**: also read `<WIKI_ROOT>/02_requirements/confirmed/business_rules.md` and `<WIKI_ROOT>/03_features/README.md`.
For **ADR**: also read existing ADRs in `<WIKI_ROOT>/06_decisions/` to determine the next sequential number.

## Step 3: Check for an Existing Canonical Doc

Search for the topic across existing docs in the target folder and related folders.

- If an existing doc owns the topic → update it with `/wiki-update` instead.
- If a similar doc exists but the topic is distinct → proceed to create.

## Step 4: Create the New Doc

Use the matched template. Apply these rules per doc type:

**Feature spec**
- Choose the appropriate subfolder under `03_features/` (core / authoring / retrieval / verification / other)
- Set `status: proposed` unless the user explicitly confirms business logic
- Keep `Confirmed`, `Inferred`, `Unknown`, and `Open Questions` separated

**Flow spec**
- Place directly under `04_flows/`
- Name the file `<verb>-<noun>-flow.md` (e.g. `checkout-payment-flow.md`)
- Set `status: proposed`

**ADR**
- Number sequentially: `ADR-<NNN>-<short-slug>.md` (e.g. `ADR-004-use-postgres.md`)
- Fill in: Context, Options Considered, Decision, Consequences
- Set `status: proposed` — only the team can confirm an ADR
- ADRs are never deleted; use `/wiki-retire-doc` to supersede


## Step 5: Sync Retrieval Surfaces

- Update `<WIKI_ROOT>/INDEX.md` or the relevant folder entry point so readers can find the new doc.
- Update `<WIKI_ROOT>/CHANGELOG.md` if the addition is material.

## Step 6: Output Summary

Report:

- resolved `WIKI_ROOT`
- doc type detected
- chosen doc path
- why a new doc was created instead of updating an existing one
- related docs reviewed
- open questions or assumptions
