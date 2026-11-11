# Decisions

Accepted product and domain rules, recurring technical conventions, and architecture, security, compatibility, or operational decisions that future work must respect.
Read the entries relevant to the change before altering behavior they may cover.

## How to record

- Record only what a human accepted: lasting behavior, a convention, or a decision stated in the conversation, or an answer to a decision question. Do not record routine implementation choices or anything merely inferred from code, tests, or history.
- Add one `##` entry per decision under Entries, newest first, in the format below. Keep it short; link a PR, proposal, or file for long rationale.
- Update the entry that owns a topic instead of adding a competing one.
- When a decision changes, edit its entry in place and update `Date` and `Source`. When it no longer applies, delete the entry. Git history keeps earlier versions.
- For a product or domain rule, write externally observable behavior from the consumer's perspective, with boundaries and failure behavior when they matter. For a technical convention, state when it applies and when it does not.
- Do not invent rules, rationale, or sources. When no accepting request can be found, write `Source: Unknown: no accepting request in repository history.` Use MUST, SHOULD, and MAY only for intentional strength.

```md
## <Short title>

Date: YYYY-MM-DD · Status: Active | Experimental
Source: Human request, YYYY-MM-DD: <one-line summary>

- Decision: <what was accepted; one rule per bullet when there are several>
- Why: <the reason, in one or two sentences>
- Constraints: <what future work must keep; omit when none>
```

## Entries

## Nightly Paseo friction sweep

Date: 2026-11-10 · Status: Experimental
Source: Human request, 2026-11-09: run `record-workflow-friction` every evening at 22:00 (UTC+7) over all Paseo projects, limited to sessions created or updated that day, with a new evidence label; 2026-11-10: still deep-dive sessions that already have observations.

- Decision: `record-workflow-friction` has a nightly sweep mode defined in `references/nightly-sweep.md`. A schedule the human installs starts a dedicated sweep agent; the repository ships no schedule.
- Decision: The sweep scans every project with a Paseo agent, including archived agents, keeps Paseo-backed sessions active since 00:00 local time on the run day, and deep-dives the first 5 triaged sessions plus any with a `#friction` note, even when observations already cite them.
- Decision: Each distinct friction becomes one observation with the evidence status `audit-detected-observation`; only a friction already recorded for the same session and category is skipped.
- Why: `record-workflow-friction` ran only on an explicit mid-task request, so friction was rarely recorded.
- Constraints: The sweep is read-only toward audited projects and agents and writes only observations and git-ignored traces in its own workspace. `workflow-evaluation` must corroborate an `audit-detected-observation` before upgrading it. The weekly session audit stays manual and unscheduled.

## Explore the served head before browser tests

Date: 2026-11-09 · Status: Active
Source: Human request, 2026-11-09: write the exploration step for runtime-e2e-test as a Playwright script, open a PR, and test it on a testbed first (PR #94).

- Decision: Before writing browser tests, `runtime-e2e-test` explores the served head with `evidence.py explore`. A Playwright driver walks declared flows in Chromium and records what each step shows: the accessibility snapshot, test IDs, select options, requests, and console errors.
- Decision: A suite with `head` and a `browser` case MUST list an exploration record of that head. `validate` and `run` refuse a record of another commit, and any literal locator in the listed test files that no recorded step shows, unless the suite lists it in `unexplored` with a reason.
- Decision: An exploration target must match exactly one visible element, as a strict Playwright locator does. Light mode explores with `writes: true`. Durable mode explores with `writes: false` before approval, which blocks every non-GET request.
- Why: In real validate runs the agent wrote locators from source without opening a page and paid for it in reruns. On the testbed, exploring first caught strict-mode traps before any test existed, and no rerun was caused by a wrong locator.
- Constraints: Records are approved inputs: they are hashed with the suite, kept in the run bundle, and counted by `audit`. Credential values and project secrets never stay in the record or in the kept flows. The check proves a locator's text was shown, not that the locator matches one element, and locators built at runtime are counted, not checked. Exploration does not settle wait timing.

## Grill mode in brainstorm-partner

Date: 2026-11-08 · Status: Active
Source: Human request, 2026-11-08: update issue #92 with the review fixes and the two `grilling` ideas, then implement it.

- Decision: `brainstorm-partner` has two modes. Explore is the default and unchanged; Grill is an opt-in interview that settles every open feature or design decision before implementation, adapted from mattpocock/skills `grilling` (MIT).
- Decision: Grill starts only when the user asks or accepts an offer. It asks the whole frontier of open decisions each round, looks up facts instead of asking, states purely technical choices as assumptions, and stays read-only; recording or implementing is offered as a choice at exit.
- Why: Hard feature logic was being silently assumed and reworked later, and a separate grill skill would overlap `brainstorm-partner`, `proposal-designer`, and `planner`.
- Constraints: Keep one thinking-partner skill and do not rename it. Grill must not override the minimal-questions default and must work in repositories without this kit's docs layout.

## Compact installed protocol docs

Date: 2026-11-08 · Status: Active
Source: Human requests, 2026-11-08: compact the installed docs; delete `docs/product/`, `docs/observed/`, `docs/runbooks/`, and `docs/patterns/`; keep decisions in one file edited in place, merge the existing records into it, and drop the plans README.

- Decision: By default the installer copies only `AGENTS.md`, `docs/WORKFLOW.md`, and `docs/DECISIONS.md`, which is seeded from `templates/DECISIONS.md` and is never this repository's own file.
- Decision: Every accepted decision, product rule, and convention is an entry in `docs/DECISIONS.md`. Entries are edited in place when they change and deleted when they stop applying.
- Decision: There is no product, observed, runbook, or pattern namespace. Knowledge inferred from code is never recorded, and `runtime-e2e-test` keeps startup steps only in its project runtime reference.
- Decision: `docs/WORKFLOW.md` is the single index of `docs/` locations and holds the plan rules, so `docs/plans/` has no README. `AGENTS.md` keeps only the always-applicable rules.
- Why: Ten protocol files in eight directories were more than the human could track, four namespaces were never used, and decisions are few enough to fit in one file.
- Constraints: Retired protocol paths stay allowed in installed state, so `update --apply` retires unmodified copies and keeps edited ones. `docs/PRODUCT.md` stays a derived brief, and this file wins when they disagree.

## Senior code review skill

Date: 2026-11-04 · Status: Experimental
Source: Unknown: no accepting request in repository history.

- Decision: `skills/senior-code-review/` is an opt-in, report-only command (`disable-model-invocation: true`, `disallowed-tools: Edit`, Codex `allow_implicit_invocation: false`), distributed alone through the `senior-review` bundle.
- Decision: It reviews in a fixed order: context, approach, hard-to-reverse decisions, correctness, internal design, operability and tests, details. Each review picks the 2–3 dimensions that matter from the project-customizable `references/review-catalog.md`.
- Decision: It writes a Vietnamese report with at most 10 findings (at most 3 `nit`), each with location, severity, failure scenario or change cost, direction, `verified` / `suspected`, and `Sửa ngay` / `Để sau`.
- Why: No other skill gave the human a senior-level critique of their code's approach, design, and boundaries; `review-pr` reports only merge-blocking defects.
- Constraints: It never reads `docs/learning/` or feeds a learning assessment, produces no merge status, and does not check PR descriptions or human intent. It does not re-run `quality-code-check` rules or `security-performance-check` probes, is not in the `validate` bundle, and `validate-change` never runs it. Report-only is enforced by instruction: `Write` and `Bash` stay available.

## Security and performance check skill

Date: 2026-10-30 · Status: Experimental
Source: Human request, 2026-10-30: implement #50 PR 1–3 per the agreed plan comment.

- Decision: `skills/security-performance-check/` has `security`, `performance`, and `both` tracks, is distributed through the `security-performance` bundle, and is included in `validate`. It stays experimental until sandbox scorecards show stable true- and false-positive rates.
- Decision: The security track uses the signal table in `references/security-signals.md` and per-finding JSON plus a run summary validated by `scripts/check_findings.py`. The report has the sections `Bảo mật`, `Hiệu năng`, and `Giới hạn`.
- Decision: The performance track uses `references/performance-signals.md` (exact and noisy metrics, parseable thresholds), base and head worktrees, interleaved runs, an A/A noise floor, and NEW / PRE_EXISTING classification. Collectors need no install: Playwright through `runtime-e2e-test` and build output, plus Lighthouse only when the project already has it.
- Decision: When the skill is installed, `validate-change` records its optional step as `SKIPPED` with `recommended` or `no-signal` (`MISSING` only when it is not installed). Its risk step turns diff matches against the installed signal files into `separateTests` with a ready command. A `risk.json` without `separateTests` must re-run `risk`.
- Why: Validate runs left security and performance risks as passive signals; checking them needs a dedicated report-only skill that does not tie `validate-change` status to the check.
- Constraints: It never modifies application code, probes only allowed local or dev hosts, and sends no data to third parties. `Giới hạn` always states the run is not a penetration test, CVE audit, or load test. Signal files are project-customizable and survive `update --apply`; no other skill copies their rows, and `validate-change` reuses the parser. Statistical gates stay deferred: median, range, and the A/A floor only.

## Validate-change composite

Date: 2026-10-29 · Status: Active
Source: Human request, 2026-10-29: implement issue #51 (validate-change composite), adopting the research ideas that fit the repository.

- Decision: `skills/validate-change/` is distributed through the `validate` bundle with the skills it calls and starts only from `/validate-change` (Claude Code `disable-model-invocation: true`, Codex `allow_implicit_invocation: false`).
- Decision: The composite performs no checks itself. It writes one expectation list, K1..Kn, each tagged `prompt`, `spec`, `assumption`, or `agent-intent`. `review-pr` and `runtime-e2e-test` consume that list instead of deriving intent, and a PR description is never an intent source.
- Decision: Deterministic, project-editable rules in `references/risk-rules.md` decide whether the human confirms the list before checks run. They cover money, data, and permission signals, weakened tests, size, shared files, configuration, intent with no human source, and recorded conflicts. High-risk changes also get one independent audit in a fresh context that sees only the expectations and the runtime evidence. A headless run that needs the gate ends with `NEEDS_HUMAN`.
- Decision: Steps pass state as JSON files in one run directory. `scripts/validate_change.py` validates enums, IDs, references, counts, and the head commit, recomputes risk from the diff, verifies the runtime bundle, and computes the overall status worst first. It never parses prose. `review-pr` writes its handoff only when the composite calls it.
- Why: Each skill derived intent separately and could disagree, review findings never reached runtime testing, and the human reconciled three outputs.
- Constraints: Each specialist skill stays independently usable, and no workflow step requires the composite. It never modifies application code. Security, performance, and accessibility signals appear only under `Cần test riêng`, never as defects, and never change the status. Computed values stay in generated files, not prose. The risk thresholds are uncalibrated starting values.

## Global brainstorm-partner, smart-commits, and triage

Date: 2026-10-23 · Status: Active
Source: Human request, 2026-10-23: move `brainstorm-partner`, `smart-commits`, and `triage` into `global-skills/` and update the READMEs.

- Decision: The three skills live only under `global-skills/` and are installed machine-wide by following `global-skills/README.md`. No bundle installs them, and the `issue-triage` bundle is removed. `planner` still routes to them by name and falls back to `docs/WORKFLOW.md` when they are not installed.
- Why: Their content does not depend on this kit's docs layout, and the owner wants them in every project without installing them per repository.
- Constraints: Global skills must not assume this kit's docs layout and read kit files only when present. A skill exists in exactly one source tree, `skills/` or `global-skills/`. `update --apply` retires earlier project copies.

## Weekly session audit

Date: 2026-10-22 · Status: Experimental
Source: Human request, 2026-10-22: implement issue #31, "Add a manual weekly session audit with a findings ledger".

- Decision: `workflow-evaluation` has a weekly session audit mode defined in `references/weekly-audit.md`. The human starts it manually in a dedicated session and supplies the project folders; nothing else is scanned.
- Decision: Sources are local Claude Code and Paseo sessions, with Paseo resolved to its provider transcript. The extractor's `--triage` option inventories the projects, filters by transcript timestamps (default 7 days), and ranks sessions by observable signals, `#friction` notes first. Only the top N (default 5) are deep-dived.
- Decision: Each audit writes a Vietnamese Markdown report and updates one findings ledger under `docs/evaluation/reports/`, with the statuses, response ladder, and escalation rule from issue #31.
- Why: `record-workflow-friction` was never used, so there was no evidence for deciding which skill to improve, and the retrospective audit covered one project with no memory across audits.
- Constraints: No schedule, cron job, or hook is installed. The audit is read-only toward audited projects. It stays labeled experimental, with its hypothesis and success criteria, until audits provide runtime evidence. The full HTML evaluation stays unchanged; `record-workflow-friction` gained only the nightly sweep recorded above.

## Think in code for bulk data

Date: 2026-10-22 · Status: Experimental
Source: Human request, 2026-10-22: implement GitHub issue #28, adding the think-in-code rule for bulk data to `docs/WORKFLOW.md` with a measured real case.

- Decision: The execution rule in `docs/WORKFLOW.md` applies: for roughly five or more files or 300 or more lines of bulk data, write a small script that prints only the needed result. Reading code to understand or change it is never bulk data. Scripts live in a temporary or git-ignored directory and stay rerunnable.
- Why: Agents loaded raw logs and payloads to extract a few facts. One measured case, a 983,679-byte session transcript, cut context by about 99.9%; a realistic baseline of partial reads would save less.
- Constraints: The rule is guidance with approximate thresholds. It adds no skill, command, hook, or tool. Do not describe it as proven until more tasks support it. Success means script plus output stays below 10% of the raw data size and no review finds a change made without reading the changed component because of this rule. Removing the rule lines reverts it.

## Agent-maintained durable knowledge

Date: 2026-11-08 · Status: Active
Source: Human request, 2026-10-19: let the AI agent manage documentation instead of the human. Human request, 2026-11-08: stop recording inferred knowledge.

- Decision: The agent records accepted knowledge itself before reporting a task, with no separate human request, approval, or edit.
- Decision: Knowledge is accepted when a human explicitly states lasting behavior, a decision, or a convention, or answers a decision question. Choosing a next step accepts nothing, and a request scoped to one task is not a lasting rule unless the human says it should apply going forward.
- Decision: Knowledge inferred from code, tests, history, or runtime behavior is never recorded. When code changes no human requested disagree with an entry, the agent reports the drift and keeps the entry.
- Decision: `manage-project-knowledge` invoked without a topic maintains all project documentation: it records accepted knowledge, checks entries against code and reports drift, and tidies. The agent asks only when intended-behavior sources conflict.
- Why: When recording was a human chore, knowledge stayed empty or stale, and writing inferred knowledge as authority would turn existing defects into rules.
- Constraints: Knowledge changes appear in the task report. Record only what should outlive the task.

## Manual planner mode

Date: 2026-10-16 · Status: Active
Source: Unknown: no accepting request in repository history.

- Decision: `skills/planner/` is distributed through the `planner-mode` bundle with `quality-code-check` and `manage-project-knowledge`. The human turns it on with `/planner`; it then applies for the rest of the conversation and is never invoked automatically.
- Decision: For each prompt it places the task on the workflow map, runs the fitting step or skill, and ends with two or three numbered next steps, one marked as recommended.
- Decision: It asks first before git actions, outward actions, and unresolved product, security, compatibility, or operational decisions. An explicit request, or choosing a numbered option that names that exact action, approves that action only.
- Decision: For an ambiguous prompt it resolves what it can from repository evidence, acts on cheap reversible guesses while stating them, and offers concrete readings as choices when a wrong guess would be expensive.
- Why: The human spent effort writing the next prompt. The earlier hook-enforced `coder` capability, which this replaced and removed, was heavier than that need and limited to Claude Code.
- Constraints: Plain instructions with no hooks, installed for Claude Code, Codex, and Antigravity. It must not override `AGENTS.md`, `docs/WORKFLOW.md`, or the stop points of the skills it routes to. A report format set by an assigning prompt replaces the next-step choices.

## Canonical skill source

Date: 2026-09-19 · Status: Active
Source: Unknown: no accepting request in repository history.

- Decision: `skills/` is the only canonical skill tree. This repository never generates or keeps `.agents/skills/` or `.claude/skills/` mirrors; runtime skill directories are installation outputs in target repositories.
- Why: Mirrors duplicate the source, drift, and make the kit look like a consumer project.
- Constraints: Change skills only under `skills/`. Maintenance commands validate skills without generating mirrors. Runtime path adaptation happens in memory or in the target repository during installation.
