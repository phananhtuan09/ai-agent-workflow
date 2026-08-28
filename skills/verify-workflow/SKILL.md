---
name: verify-workflow
description: "Use when the human wants one command to verify implemented work end-to-end and get a short status back. Owns testcase planning, evidence collection through existing verify skills, a deterministic evidence gate, independent judging, bounded re-execution, regression scope, and a ready-to-paste fix handoff. Accepts an approved spec, a bug-fix summary, or a stated intent. Do not use to write production code or to repair failures."
---

# Verify Workflow

Own the verification phase behind one entry point and return a short status the human can act on.

This skill is a coordinator.
It does not drive browsers, write production code, or repair failures itself.
It routes work to existing verify skills, gates their evidence, judges their conclusions, and reports.

Status: experimental.
Do not add this skill to a standard workflow config until repeated real runs produce evidence.

## Supported Invocations

- `/verify-workflow {feature-slug}`
- `/verify-workflow {feature-slug} --mode spec --spec docs/ai/features/specs/{feature-slug}.md`
- `/verify-workflow {feature-slug} --mode fix --from docs/ai/features/summaries/{feature-slug}.md`
- `/verify-workflow` followed by a free-text description of what changed and why
- `/verify-workflow handoff {feature-slug}`
- `/verify-workflow handoff {feature-slug} --case TC-007`
- `/verify-workflow status {feature-slug}`

`handoff` and `status` never run tests.
They read the existing manifest only.

## Required Sources And Helpers

Read before planning any testcase:

- `references/evidence-contract.md` for required-evidence kinds, verdict classes, and judge rules.
- `references/intent-modes.md` when the run has no approved spec.
- `references/regression-scope.md` before selecting any regression testcase.

Resolve these helpers as sibling skill directories in the same installed skills root:

- `manual-checklist`: spec-derived testcase definitions and acceptance-criterion mapping.
- `verify-feature`: implementation-level evidence.
- `verify-runtime`: browser-driven end-to-end evidence, network, console, and screenshots.

Read a helper's `SKILL.md` only when routing work to that helper.
Do not reimplement helper behavior in this skill.
Do not modify a helper's rules to make a run pass.

Use these executable resources relative to this `SKILL.md`:

- `skills/verify-workflow/scripts/update_manifest.py`: create and update the run manifest.
- `skills/verify-workflow/scripts/validate_evidence.py`: deterministic evidence gate.

Never hand-edit the manifest when `update_manifest.py` supports the transition.
Never write a gate result the script did not produce.

## Input Modes

Resolve the mode before anything else, and record it in the manifest.

### Mode A — approved spec

Trigger: `--mode spec`, or `docs/ai/features/specs/{feature-slug}.md` exists.

The approved spec is the only source of truth for expected behavior.
Route testcase generation to `manual-checklist` and use its checklist unchanged.

### Mode B — bug fix

Trigger: `--mode fix`, or a `## Bug Fix Summary` block exists in the referenced summary.

The `fix-bug` summary is the oracle.
Follow `references/intent-modes.md` for the field mapping.

### Mode C — stated intent

Trigger: the human describes what changed and why, with no spec and no fix summary.

Restate the human's intent as an explicit intent contract, show it in at most five lines, and continue.
Follow `references/intent-modes.md`.

In every mode, changed files may be read to decide **where** to test.
Changed files, diffs, implementation summaries, and observed behavior may never decide **what is correct**.

## Internal Phases

The human sees none of these phase names.

1. **Resolve** the mode, oracle, feature slug, and manifest.
2. **Plan** feature testcases, then regression testcases per `references/regression-scope.md`.
3. **Collect** evidence by routing to `verify-feature`, then `verify-runtime`.
4. **Gate** every testcase with `validate_evidence.py`.
5. **Judge** each testcase per `references/evidence-contract.md`.
6. **Re-execute** at most once, only for `INSUFFICIENT_EVIDENCE`.
7. **Report** a short summary and write the handoff blocks.

Re-run behavior: read the existing manifest first.
Do not re-execute a testcase already judged `VERIFIED` unless its oracle changed or a `Must not break` contract requires it.

## Commands

Run these in order. Never write manifest fields or gate results by hand.

```bash
# 1. Resolve: create the run manifest.
python3 skills/verify-workflow/scripts/update_manifest.py init \
  --manifest docs/ai/features/verifications/{feature-slug}.manifest.json \
  --slug {feature-slug} --mode {spec|fix|adhoc} \
  --oracle-kind {spec|fix-summary|stated-intent} \
  --oracle-ref "{path or empty}" --oracle-text "{stated intent, adhoc only}"

# 2. Plan: record testcase definitions and required evidence.
python3 skills/verify-workflow/scripts/update_manifest.py set-testcases \
  --manifest {manifest} --testcases {json list, a file path, or -}

# 3. Collect: per testcase, record the helper self-report and tool observations.
python3 skills/verify-workflow/scripts/update_manifest.py record-executor \
  --manifest {manifest} --case {TC-ID} --status {pass|fail|partial|blocked} \
  --claim "{helper claim}" --source {verify-feature|verify-runtime}
python3 skills/verify-workflow/scripts/update_manifest.py record-observations \
  --manifest {manifest} --case {TC-ID} --observations {json object, path, or -} \
  --evidence-dir docs/ai/features/verifications/e2e-artifacts/{TC-ID}

# 4. Gate: the only writer of gate results.
python3 skills/verify-workflow/scripts/validate_evidence.py {manifest} --write

# 5. Judge: one verdict per testcase.
python3 skills/verify-workflow/scripts/update_manifest.py record-judge \
  --manifest {manifest} --case {TC-ID} --verdict {VERDICT} --reason "{why}"

# 6. Re-execute at most once, only for INSUFFICIENT_EVIDENCE.
python3 skills/verify-workflow/scripts/update_manifest.py bump-attempt \
  --manifest {manifest} --case {TC-ID} --changed "{what changed between attempts}"

# 7. Report: counts and the disagreement record.
python3 skills/verify-workflow/scripts/update_manifest.py summary --manifest {manifest}
```

`validate_evidence.py` exits `0` when nothing is insufficient, `1` when at least one testcase is insufficient, and `2` on a malformed manifest or plan.
Treat exit `2` as a planning defect to fix, not an evidence gap to report.

The scripts reject an invalid transition on purpose.
When one refuses, fix the input or the plan.
Never work around a refusal by editing the manifest directly.

## Helper Routing Boundary

- `manual-checklist` defines testcases and may not execute them.
- `verify-feature` and `verify-runtime` collect evidence and may not change testcase definitions or repair failures.
- The gate script decides only whether required evidence is present and structurally sufficient.
- The judge decides status and may not re-plan testcases, relax required evidence, or edit code.
- This coordinator owns the manifest, re-execution, verdicts, handoff, and the human-facing response.
- No role in this skill may modify production code, specs, or testcase expected results.

## Evidence Status Ownership

For this experiment, helper self-reported status is kept and then re-graded:

- Helpers write their own status as they do today.
- The judge independently re-grades every testcase from the manifest and raw evidence.
- When the judge disagrees with a helper, record both values and the reason.
- The final checklist status is the judge's value.
- Report `disagreement_cases` from `update_manifest.py summary` in every run.

This count is the experiment's primary measurement.
A run that cannot report it is incomplete.

## Regression

Every mode adds regression testcases for the surfaces impacted by the change.
Use ids `RG-001`, `RG-002`, and so on.
Regression testcases carry no acceptance-criterion mapping.
Write them in their own checklist section so `manual-checklist` rules stay intact.
Apply the scope limit, allowed oracles, and status rules in `references/regression-scope.md`.

## Human-Facing Output

Return a short status only.
Do not print the detailed report, per-testcase evidence, helper names, phase names, or browser steps.

```text
KẾT QUẢ: {ĐẠT | KHÔNG ĐẠT | CẦN BẠN XÁC NHẬN | BỊ CHẶN} — {lý do ngắn}

🟢 {n}/{total} spec   🟡 {n}/{total} spec   🔴 {n}/{total} spec
🟢 {n}/{total} regression

  🔴 {TC-ID}  {một dòng: thực tế sai gì}
  🟡 {TC-ID}  {một dòng: thiếu bằng chứng gì}

Checklist: docs/ai/features/checklists/{feature-slug}.md
Judge sửa {disagreement_cases}/{total} kết luận của executor.
```

Rules:

- Write the human-facing response in Vietnamese.
- List only non-green testcases, one line each.
- Omit the regression line when the run produced no regression testcase.
- When nothing is red or yellow, return at most three lines plus the checklist path.
- Never claim a verification the gate marked insufficient.
- When blocked, say what was unavailable and state that no checklist status was changed.

Offer `handoff` on the next line only when at least one testcase is `CONFIRMED_FAILURE`.

## Handoff

`handoff` reads the manifest and returns a paste-ready prompt for a separate fix session.
It never fixes anything.

Route by verdict:

- `CONFIRMED_FAILURE` from a bug or runtime defect: target `/fix-bug`.
- `CONFIRMED_FAILURE` that is missing scope from an approved spec: target `/execute-spec`.
- `INSUFFICIENT_EVIDENCE`: produce no fix prompt; state what the human must confirm.
- `ORACLE_UNCLEAR`: produce no fix prompt; state which expected result must be decided first.

Use `skills/verify-workflow/templates/fix-handoff.md` for both the artifact block and the prompt.
Every `CONFIRMED_FAILURE` must already have its `## Fix Handoff — {TC-ID}` block written in the verification artifact before `handoff` is offered.

A handoff prompt is valid only when the artifact block it points to contains a reproduction path, an environment record, and observed evidence pointers.
If any is missing, say so instead of emitting a prompt that will fail to reproduce.

## Artifacts

| Artifact | Owner | Purpose |
|---|---|---|
| `docs/ai/features/checklists/{feature-slug}.md` | `manual-checklist` for mode A, this skill for regression sections and final status | primary human-facing output |
| `docs/ai/features/verifications/{feature-slug}.md` | `verify-feature`, `verify-runtime`, this skill for handoff blocks | detailed evidence and fix input |
| `docs/ai/features/verifications/{feature-slug}.manifest.json` | this skill, through `update_manifest.py` | run state, gate results, judge verdicts, disagreement count |
| `docs/ai/features/verifications/e2e-artifacts/{TC-ID}/` | `verify-runtime` | raw screenshots, network, console |

Keep verification-artifact headings in English and their descriptions in Vietnamese, matching `verify-feature` and `verify-runtime`.
Keep the checklist fully in Vietnamese.
Never write secrets into any artifact, prompt, or response.

## MVP Boundaries

- Report failures; never fix them.
- Never dispatch a coding agent, even when the failure looks trivial.
- Re-execute a testcase at most once per run.
- Cap regression testcases per `references/regression-scope.md`.
- Do not add this skill to `docs/ai/workflows/*.json`; run it by hand next to the existing steps so both paths stay comparable.
- Do not modify `manual-checklist`, `verify-feature`, `verify-runtime`, or `orchestrator`.
- If a helper refuses work that this skill needs, stop and report it instead of relaxing the helper's rules.

## Orchestrator Contract

When this skill is run under `/orchestrator`, append exactly one HTML comment as the final output line:

- No confirmed failure, and every selected testcase reached a judged status:
  `<!-- orchestrator: outcome=continue provides=checklist_path,verify_verdict checklist_path=docs/ai/features/checklists/{feature-slug}.md -->`
- At least one `CONFIRMED_FAILURE`:
  `<!-- orchestrator: outcome=stop-fail -->`
- Any `ORACLE_UNCLEAR`:
  `<!-- orchestrator: outcome=stop-ask-human -->`
- Required inputs, environment, or helpers prevented meaningful verification:
  `<!-- orchestrator: outcome=stop-blocked -->`

Rules:

- Emit the comment only after the manifest, verification artifact, and checklist have been updated.
- Report the checklist path prominently in the human-readable response.
- If this skill runs standalone, the comment is optional.
