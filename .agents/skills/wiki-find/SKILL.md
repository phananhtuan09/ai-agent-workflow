---
name: wiki-find
description: Retrieve canonical specs from the project wiki for a target topic — structured, sourced, and certainty-separated.
---

# Wiki Find

Retrieve accurate specifications from the project wiki for a target domain or topic. Extract from canonical docs only. Never guess. Separate confirmed, inferred, and unknown knowledge explicitly.

## Inputs

- topic, domain, or question to look up (e.g. "checkout flow", "business rules for orders")
- optional absolute wiki path override

## Codex Tool Mapping

- Claude `Read` → inspect files with shell reads
- Claude `Grep` → use `rg` to locate canonical docs for the topic across INDEX, features, flows, and ADRs
- No file edits — read and report only

## Step 0: Resolve Wiki Root

Determine `WIKI_ROOT` using this order:

1. **Absolute path provided** — if the prompt contains a path starting with `/`, `~`, or a Windows drive letter (e.g. `C:\`), use that path directly.
2. **No path specified** — use `project-wiki/` relative to the current working directory.

If the resolved path does not exist, stop and respond:

> The wiki folder `<WIKI_ROOT>` does not exist.
> Run `wiki-init` first to set up the wiki for this project.

## Workflow

### 1. Read Root Files (Required, In Order)

Always read in this exact order before anything else:

1. `<WIKI_ROOT>/README.md`
2. `<WIKI_ROOT>/INDEX.md`
3. `<WIKI_ROOT>/GOVERNANCE.md`

Do not skip.

### 2. Detect Domain and Locate Canonical Docs

Use `INDEX.md` and `rg` to:

- Identify which domain the topic belongs to
- Locate the canonical doc(s) for that domain

Prioritize:

1. `confirmed` docs (highest authority)
2. `02_requirements/confirmed/business_rules.md` — always check for relevant rules
3. Feature specs (`03_features/`)
4. Flow specs (`04_flows/`)
5. ADRs (`06_decisions/`) — when architectural context is needed

**Scope control:** Select at most 5–10 docs. Do not load the full wiki.

### 3. Extract the Specification

From the selected canonical docs, extract:

- Feature behavior and capabilities
- Business rules and constraints
- User flows and sequences
- Edge cases
- Dependencies on other features or services

**Canonical-first rule:** Pick the canonical doc as the authoritative source. Treat others as references only.

**De-duplication rule:** If two docs describe the same behavior differently, surface the conflict explicitly. Do not resolve it silently.

**No-assumption rule:** If a spec detail is not found in any doc, mark it as `Unknown`. Do not infer or fabricate.

### 4. Synthesize Across Doc Types (When Applicable)

For full-spec requests, combine:

- Feature spec → what the system does (behavior)
- Flow spec → how it happens (sequence)
- Business rules → constraints and invariants

Only synthesize when the relevant layers are available; otherwise mark missing layers as `Unknown`.

When the topic touches regression-sensitive areas (flagged in `08_verification/regression_sensitive_areas.md`), call that out explicitly.

## Output Requirements

```
## Spec: <Topic Name>

### Overview
One paragraph summarizing what was found across canonical docs.

### Business Rules
- <rule> — source: <doc-id>

### Flows
- <flow name>: <brief description> — source: <doc-id>

### Edge Cases
- <case> — source: <doc-id>

### Dependencies
- <dependency> — source: <doc-id>

---

### Confirmed
Facts explicitly stated in confirmed docs.

### Inferred
Reasonable conclusions from proposed or inferred docs — not guaranteed.

### Unknown
Details not found in any doc. Do not guess.

### Open Questions
Gaps that require human input or a follow-up wiki update.

---

### Source Trace
| Doc | Path | Status |
|---|---|---|
| <doc-id> | <file-path> | confirmed / proposed / inferred |
```

**Failure handling:**

- No spec found → report "No canonical spec found for `<topic>`." and suggest `wiki-add-doc`.
- Conflict between docs → show both sources, mark as conflict, require human confirmation.
- Spec incomplete → fill Confirmed / Inferred / Unknown as appropriate. Do not fabricate missing logic.
