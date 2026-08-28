# Intent Modes

Read this file when a run has no approved spec.

`manual-checklist` owns testcase generation for mode A and requires an approved spec plus acceptance-criterion mapping.
Mode B and mode C have neither, so this coordinator generates their testcases directly using the rules below.

## Shared Boundary

The oracle is whatever the human or the fix summary explicitly states.

- Read changed files to decide **where** to test.
- Never read changed files, diffs, implementation summaries, or current behavior to decide **what is correct**.
- Never convert observed behavior into an expected result.
- If the oracle does not define an expected result for a branch that must be checked, record that testcase as `ORACLE_UNCLEAR`.
- Do not invent an expected result to make a testcase runnable.

## Mode B — Bug Fix Summary

Trigger: `--mode fix`, or the referenced summary contains a `## Bug Fix Summary` block written by `fix-bug`.

Map its fields directly:

| `fix-bug` field | Use as |
|---|---|
| `Bug` | testcase subject |
| `Root cause → Symptom` | the wrong behavior that must no longer occur |
| `Behavior changed` | expected result after the fix |
| `Reproduction` | testcase precondition and action |
| `Environment` | required runtime environment |
| `How to verify` items 1-3 | one feature testcase each |
| `How to verify` item 4 (adjacent paths) | regression candidates |
| `Impact → Blast radius L1 / L2` | regression scope, per `regression-scope.md` |
| `Residual risks` | explicitly out of scope; record, do not test |

Always generate these two feature testcases:

1. The original trigger no longer produces the reported wrong behavior.
2. The stated correct behavior now happens for the same trigger.

When `Reproduction` says the bug could not be reproduced, do not claim a fix was verified.
Record the limitation and mark the affected testcase `INSUFFICIENT_EVIDENCE`.

## Mode C — Stated Intent

Trigger: the human describes what changed and why, with no spec and no fix summary.

Build an intent contract from the human's own words and show it in at most five lines before testing:

```text
Đúng phải:  {expected behavior, in the human's terms}
Trước đây:  {behavior the human says was wrong, when stated}
Trigger:    {inputs, state, or sequence that exercises it}
Vùng liên quan: {files or modules the human named}
```

Then continue without waiting for confirmation.

Ask the human at most one batched question, and only when an expected result is materially absent and no assumption would be safe.
Prefer recording `ORACLE_UNCLEAR` over asking, when the rest of the run can still proceed.

Persist the intent contract in the manifest as the run's oracle so later runs and handoffs cite the same wording.

## Testcase Generation Rules For Mode B And Mode C

- One testcase is one independently executable check with an action and an expected result on one line.
- Use ids `TC-001`, `TC-002`, and so on, in a single stable sequence per feature slug.
- Leave `spec_mapping` empty; these modes have no acceptance criteria.
- Cover the stated expected behavior, the stated wrong behavior, and any boundary or failure state the oracle explicitly mentions.
- Do not generate testcases for behavior the oracle does not mention.
- Do not generate generic testcases such as "works correctly" or "handles errors".
- Declare required evidence per `evidence-contract.md`, including `dataset_discriminates` for any scoping or filtering claim.
- Preserve ids and human checkbox state when regenerating an existing checklist.

## Checklist Sections For Non-Spec Modes

Write the same Vietnamese checklist file used by mode A.

Differences:

- Replace the acceptance-criterion coverage line with the oracle source, for example `Nguồn kỳ vọng: Bug Fix Summary` or `Nguồn kỳ vọng: intent do người dùng nêu`.
- Omit `[AC...]` tags from testcase lines.
- Keep the regression section defined in `regression-scope.md`.
- Keep every other heading, icon, legend, and percentage rule identical to mode A so one reader can read both.
