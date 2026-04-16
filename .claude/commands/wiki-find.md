---
name: wiki-find
description: Retrieve canonical specs from the project wiki for a target topic — structured, sourced, and certainty-separated.
---

Retrieve accurate specifications from the project wiki for a target domain or topic. Extract from canonical docs only. Never guess. Separate confirmed, inferred, and unknown knowledge explicitly.

## Workflow Alignment

- Provide brief status updates (1-3 sentences) before important actions.
- Read in the prescribed order — do not skip root files.
- Do not edit any files — read and report only.
- If the wiki is incomplete, report the gap instead of filling it in.

---

## Step 0: Resolve Wiki Root

Determine `WIKI_ROOT` using this order:

1. **Absolute path provided** — if the prompt contains a path starting with `/`, `~`, or a Windows drive letter (e.g. `C:\`), use that path directly.
2. **No path specified** — use `project-wiki/` relative to the current working directory.

If the resolved path does not exist, stop and respond:

> The wiki folder `<WIKI_ROOT>` does not exist.
> Run `/wiki-init` first to set up the wiki for this project.

## Step 1: Read Root Files (Required, In Order)

Always read in this exact order before anything else:

1. `<WIKI_ROOT>/README.md`
2. `<WIKI_ROOT>/INDEX.md`
3. `<WIKI_ROOT>/GOVERNANCE.md`

These establish the navigation layer and canonical ownership rules. Do not skip.

## Step 2: Detect Domain and Locate Canonical Docs

Use `INDEX.md` to:

- Identify which domain the target topic belongs to (auth, billing, orders, etc.)
- Locate the canonical doc(s) for that domain

Prioritize in this order:

1. `confirmed` docs (highest authority)
2. `02_requirements/confirmed/business_rules.md` — always check for relevant rules
3. Feature specs (`03_features/`)
4. Flow specs (`04_flows/`)
5. ADRs (`06_decisions/`) — when architectural context is needed

**Scope control:** Select at most 5–10 docs per request. Do not load the full wiki.

## Step 3: Extract the Specification

From the selected canonical docs, extract:

- Feature behavior and capabilities
- Business rules and constraints
- User flows and sequences
- Edge cases
- Dependencies on other features or services

**Canonical-first rule:** When multiple docs mention the same logic, pick the canonical doc as the authoritative source. Treat others as references only.

**De-duplication rule:** Do not merge conflicting claims silently. If two docs describe the same behavior differently, surface the conflict explicitly — do not resolve it.

**No-assumption rule:** If a spec detail is not found in any doc, mark it as `Unknown`. Do not infer, guess, or fill in logic that is not present in the docs.

## Step 4: Synthesize Across Doc Types (When Applicable)

For full-spec requests, combine:

- Feature spec → what the system does (behavior)
- Flow spec → how it happens (sequence)
- Business rules → constraints and invariants

This multi-doc synthesis produces a complete picture. Only synthesize when the relevant layers are available; otherwise mark missing layers as `Unknown`.

When the topic touches regression-sensitive areas (flagged in `08_verification/regression_sensitive_areas.md`), call that out explicitly.

## Step 5: Structure the Output

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

## Step 6: Failure Handling

**No canonical spec found:**
> No canonical spec found for `<topic>`.
> Suggest: run `/wiki-add-doc` to create one.

**Spec conflict between docs:**
> Conflict detected between `<doc-A>` and `<doc-B>` on `<claim>`.
> Both sources shown below. Human confirmation required before treating either as authoritative.

**Spec incomplete:**
Fill `Confirmed` / `Inferred` / `Unknown` sections as appropriate. Do not fabricate missing logic to make the output appear complete.
