---
name: wiki-impact-check
description: Perform a pre-change impact analysis using the project wiki and surface required doc follow-ups.
---

Use the target project wiki docs to assess the blast radius of a proposed code, logic, or documentation change before implementation starts.

## Workflow Alignment

- Provide brief status updates (1-3 sentences) before important actions.
- For medium or large impact reviews, create todos (14 words or fewer, verb-led). Keep one `in_progress` item.
- If the wiki is incomplete, report the gap instead of guessing.

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

## Step 1: Load Root and Verification Context

Read:

- `<WIKI_ROOT>/README.md`
- `<WIKI_ROOT>/INDEX.md`
- `<WIKI_ROOT>/GOVERNANCE.md`
- `<WIKI_ROOT>/02_requirements/confirmed/business_rules.md`

When available, also read:

- `<WIKI_ROOT>/08_verification/impact_analysis_rules.md`
- `<WIKI_ROOT>/08_verification/regression_sensitive_areas.md`

## Step 2: Find the Relevant Canonical Docs

- Locate the canonical business rules, feature docs, flow docs, ADRs, API docs, entity docs, or operations docs related to the target change.
- Follow the read path from `<WIKI_ROOT>/01_onboarding/how_to_read_this_wiki.md` when the affected area is broad or unclear.
- If the wiki does not contain enough context, list the missing surfaces explicitly.

## Step 3: Analyze the Change Surface

List the affected:

- business rules
- user flows
- APIs or contracts
- entities or state transitions
- ADRs
- regression-sensitive areas

Classify the proposed change as one of:

- additive
- modifying
- behavior-breaking

## Step 4: Determine Required Documentation Follow-up

- State which docs must be reviewed if the change is accepted.
- State which docs must be updated after implementation.
- Highlight any mismatch risk between intended behavior, current docs, and implementation.

## Step 5: Output Summary

Report:

- resolved `WIKI_ROOT`
- impacted docs
- impact summary
- risk summary
- required doc updates if the change proceeds
- missing knowledge gaps
