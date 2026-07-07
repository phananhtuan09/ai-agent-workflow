---
name: manual-checklist
description: "Use when the human is ready to sign off after all AI verification steps complete. Bundles spec, summary, and verification artifacts into a single scannable checklist with immediate status visibility. Trigger phrases: \"manual checklist\", \"sign off checklist\", \"review checklist\", \"create checklist\", \"generate checklist\". Do not use for re-running verification, modifying code, or syncing the spec."
---

# Manual Checklist

Bundle all workflow artifacts (spec, summary, verification) into a single human-readable checklist for sign-off.

## When To Run

- The human triggers this step explicitly (e.g. `/manual-checklist`)
- Only after `/verify-runtime` has completed, or the human confirms the feature is implementation-complete enough to review
- Do NOT auto-run this step as part of `/verify-runtime` or any other step

## Input

- Required: spec path (e.g. `docs/ai/specs/{feature}.md`)
- Read if present: summary path (e.g. `docs/ai/summaries/{feature}.md`)
- Read if present: verification path (e.g. `docs/ai/verifications/{feature}.md`)

## Output

Write to: `docs/ai/checklists/{feature}.md`

## Pre-Checklist: Determine Status

Before writing, read all available artifacts and determine the overall status from evidence:

- `Ready for Sign-off`: all ACs are either AI-verified or deferred; no `Blocked / Stuck` items; human-verify items remain but are the only thing between now and sign-off
- `Needs Human Verify`: implementation and runtime checks passed, but one or more ACs require human manual testing before sign-off
- `Blocked`: one or more required artifacts (spec, summary, verification) missing, or one or more ACs `Blocked / Stuck` in implementation/runtime
- `In Progress`: not all ACs are implemented or verified yet (summary shows `Not Done / Blocked`)
- `Drift Detected`: summary's `## Decisions` or runtime results contradict the latest synced spec; human must confirm before sign-off

## Checklist Format

```markdown
# Manual Checklist — {feature}

## Status
{status} — {one-sentence reason}

## Feature Snapshot
- Tier: {Lite|Standard|Extended}
- ACs: {total N}
- Spec: docs/ai/specs/{feature}.md ✓
- Summary: docs/ai/summaries/{feature}.md {✓|✗ missing}
- Verification: docs/ai/verifications/{feature}.md {✓|✗ missing}
- Verification Status: {Pass|Partial|Fail|Blocked|N/A}

## AI Verified
- AC1 → {evidence summary, e.g. "typecheck passed, unit test covers path"} (src: verification)
- AC2 → {evidence summary} (src: verification)
...

## Needs Human Verify
- AC3 → {concrete test step, e.g. "Open /settings, click save, check toast appears"}
- AC4 → {concrete test step}
...

## Blocked / Stuck
- AC5 → {reason blocked, e.g. "Needs staging env with real data"} — unblock by: {what's needed}
...

## Drift / Open Questions
- {any decision in summary that conflicts with spec}
- {unresolved open question from spec}

## Sign-off
- [ ] I have read the spec and verified all manual checklist items
- [ ] I have corrected any drift (files changed: ...)
- [ ] Feature is ready to merge / deploy

## Source Artifacts
- Spec: docs/ai/specs/{feature}.md
- Summary: docs/ai/summaries/{feature}.md
- Verification: docs/ai/verifications/{feature}.md
- Key files: {paths to primary implementation files}
```

## Rules

### Language
- All checklist output files must be written in Vietnamese
- Spec, summary, and verification artifacts may be in English; translate terse summaries into Vietnamese when writing the checklist
- Keep evidence pointers (file paths, commands, test names) in their original English

### Artifact Reading
- Read the spec, summary, and verification artifact before producing the checklist
- If verification artifact exists but only has implementation-level sections (no runtime), treat `Needs Runtime Verification` items as `Needs Human Verify`
- If summary is missing, treat all ACs as `Not Done` and set status to `In Progress`
- If verification is missing but summary exists, mark status `Blocked` with reason "verification artifact missing"

### Status Rules
- Produce the status from actual evidence in the artifacts, not from inference
- Put status first so the human sees it before scrolling
- Never mark a feature `Ready for Sign-off` when any AC is `Blocked / Stuck`

### Content Rules
- Keep each list item terse; the goal is scannability, not re-narrating the spec
- Map every acceptance criterion to exactly one of: `AI Verified`, `Needs Human Verify`, `Blocked / Stuck`
- If an AC is not listed in any section, it belongs in `Blocked / Stuck` with reason "not yet implemented"
- Preserve evidence pointers (file path, line range, command output) instead of inline-quoting large blocks
- For `Needs Human Verify`, write concrete test steps the human can execute immediately; do not repeat the AC text verbatim

### Artifact Boundaries
- Do NOT modify the spec, summary, or verification file from this step
- Do NOT re-verify anything that was already verified
- Do NOT claim behavior the AI did not already verify

### Refresh Rules
- If `docs/ai/checklists/{feature}.md` already exists, refresh all sections from current artifacts
- Preserve the human's existing `## Sign-off` block — move it to the bottom, do not reset or delete checkmarks
- If a previously signed-off item now shows as `Blocked` or `Drift Detected`, flag it explicitly in `## Drift / Open Questions`

## Done When

- All ACs from the spec are mapped to exactly one status section
- Status header reflects honest evidence
- `## Sign-off` block is present and human-ready (no auto-checked boxes)
- File is written to `docs/ai/checklists/{feature}.md`
