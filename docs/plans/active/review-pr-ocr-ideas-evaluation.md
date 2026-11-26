# Evaluate OCR-inspired changes to review-pr before building them

## Goal

Decide, with sandbox evidence, which of three candidate changes to `review-pr` are worth building.
The candidates come from a comparison with alibaba/open-code-review (OCR), whose review pipeline enforces file coverage, path-matched rules, and post-review positioning in code instead of in the prompt.

| ID | Candidate change | Hypothesis it must prove |
| --- | --- | --- |
| P1 | `review.json` lists every diff file as `reviewed` or `skipped: <reason>`; `validate_change.py report` rejects a list that differs from the diff | On a large PR, the current skill leaves diff files unread and misses defects that sit in them |
| P2 | A project-editable `review-rules.md` (path glob → checklist), matched to each diff file the way `risk-rules.md` matches signals | Defects that break a documented project convention are missed because the skill picks concerns freely |
| P3 | When the `ocr` CLI is installed, `review-pr` reads `ocr review --format json` output as suspicions only; each still has to pass the Finding Bar | OCR finds expected items the skill misses, and the Finding Bar removes its false positives |

Replacing `review-pr` with OCR is out of scope: OCR has no intent authority, PR-description check, or `review.json` handoff (decided in conversation, 2026-11-26).

## Method

Follow the testbed rules in the answers repository (`ai-workflow-testbed-answers/README.md`): fresh Sonnet session per run, the agent under test never sees the answers, reset `pr/NNN` after each run, three runs per arm and scenario.
Score `review-pr` only on expected items a diff read can establish (the answer key marks them `static: true`); runtime-only items are not this skill's job.

Arms:

| Arm | What runs | Built when |
| --- | --- | --- |
| A | `/review-pr` from the current kit | now (baseline) |
| O | OCR alone, `open-code-review-delegate` skill on the same model (no separate API key) | now |
| P1, P2, P3 | `/review-pr` with that one change, installed from a branch of this repository | only after its stage-1 trigger below fires |

Extra measures per run, beyond the scorecard template:

- Diff files never opened by the agent (from the session transcript: `Read`, `git show`, `git diff -- <path>` per file).
- Tokens and wall time, to compare with OCR's claimed cost.

Scenarios: 024, 027, 028 (existing defects), 001 and 025 (clean, precision), 031 (new: large PR, defects in low-salience files), 032 (new, held out: project-convention defects).
Scenario contents live only in the answers repository.

## Decision rules (fixed before any run)

Stage 1 runs arms A and O, 3 runs each, on every non-held-out scenario.

- Build P1 only if arm A leaves at least one diff file of 031 unopened in 2 of 3 runs, or misses a `static` item whose file it never opened.
  Otherwise record P1 as not needed: the skill already reads every file at this size.
- Build P2 only if arm A misses, in 2 of 3 runs, a `static` item that a rule written from the sandbox's documented conventions (README, `AGENTS.md`, `docs/`) would name.
  The rule table is written from those documents before P2's first run and never edited from a scorecard result; 032 (held out) confirms it.
- Build P3 only if arm O detects, in 2 of 3 runs, a `static` item that arm A misses in 2 of 3 runs.

Stage 2 runs each built arm 3 times on every non-held-out scenario, then once on 032. Accept the change when all hold:

- It detects its target items in 2 of 3 runs.
- No `static` item that arm A detected becomes `Missed`.
- Clean scenarios 001 and 025 keep 0 findings, and false positives per run do not rise above arm A's.
- Cost rises by less than 50% in tokens over arm A, or the human accepts the cost for the gain.

## Current state

- 2026-11-26: plan written; answer keys for 031 and 032 drafted in `ai-workflow-testbed-answers` branch `claude/review-pr-ocr-scenarios`.
- Next: build sandbox branches `pr/031` and `pr/032` from the keys (needs push access to `ai-workflow-testbed`), then stage 1.

## Dependencies

- Sandbox needs the OCR skills (`npx skills add alibaba/open-code-review`) and the `ocr` CLI for arm O; install on a separate sandbox commit, recorded in each scorecard.
- Runs must happen in sessions that cannot read the answers repository; this planning session can read it and must not run an arm.
