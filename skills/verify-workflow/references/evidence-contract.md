# Evidence Contract

This file defines the shared vocabulary used by the gate script and the judge.
Read it before planning required evidence or assigning any status.

## Principle

A testcase is proven by artifacts a tool produced, never by an agent's description of what it saw.

An agent may write pointers and assertions.
It may not write an observation that cannot be traced to a recorded request, response, DOM read, dataset count, console entry, or stored file.

## Required Evidence Kinds

Every testcase declares `required_evidence` as a list of these kinds.
The gate script understands only these kinds and rejects unknown ones.

| Kind | Fields | Passes when |
|---|---|---|
| `artifact` | `path`, `artifact_type` | the file exists and is not empty |
| `request_param` | `url_contains`, `param`, `equals` or `equals_ref` | a recorded request matching `url_contains` carries `param` with the expected value |
| `request_absent_param` | `url_contains`, `param` | a matching request was recorded and does not carry `param` |
| `response_all` | `response_ref`, `field`, `equals` or `equals_ref` | the referenced response has at least one item and every item satisfies `field == value` |
| `dom_matches_response` | `response_ref` | recorded DOM item ids equal the referenced response item ids as sets |
| `dataset_discriminates` | `in_scope_min`, `out_of_scope_min` | recorded dataset counts meet both minimums |
| `request_after_reload` | `url_contains`, `param` | a request recorded in the `after_reload` phase matches and carries `param` |
| `no_new_console_error` | none | no console error was recorded for the testcase |
| `manual_judgment` | `reason` | never passes automatically; the gate returns `manual` |

`equals_ref` resolves a named value from `observations.refs`, for example the category the executor actually clicked.
Prefer `equals_ref` over a hardcoded value so the assertion compares two observed facts instead of one observed fact and one literal.

## Planning Required Evidence

Derive required evidence from the oracle, never from the implementation.

Rules:

- Every testcase asserting a filter, search, sort, or scoping rule must include `dataset_discriminates`.
  Without a negative example in the dataset, passing evidence cannot separate "filtered correctly" from "did not filter at all".
- Every testcase whose expected result depends on a server call must include `request_param` or `request_absent_param`.
  A correct-looking screen is not evidence that the correct request was sent.
- Every testcase asserting persistence across reload must include `request_after_reload`.
- Every testcase asserting displayed data must include `dom_matches_response`.
- Use `manual_judgment` only for genuinely subjective results, and state why in `reason`.
- Do not declare required evidence a configured driver cannot capture; record the limitation instead.

## Verdict Classes

The judge assigns exactly one verdict per testcase.

| Verdict | Checklist icon | Meaning | Routes to |
|---|---|---|---|
| `VERIFIED` | 🟢 | required evidence present and it proves the expected result | nothing |
| `CONFIRMED_FAILURE` | 🔴 | evidence proves the expected result did not happen | a separate fix session |
| `INSUFFICIENT_EVIDENCE` | 🟡 | the run did not prove the expected result either way | one bounded re-execution, then the human |
| `ORACLE_UNCLEAR` | 🔴 | the oracle does not define the expected result | the human, to decide the expected behavior |
| `BLOCKED` | 🔴 | environment, driver, data, or auth prevented execution | the human, to restore the environment |

`INSUFFICIENT_EVIDENCE` is not a defect claim.
Never send it to a fix session and never describe it as a bug.

## Judge Rules

The judge reads the manifest, the recorded observations, and the stored artifacts.

Hard rules:

- The judge may not assign `VERIFIED` to a testcase whose gate result is `insufficient`.
  The gate is a floor, not a suggestion.
- The judge may assign `INSUFFICIENT_EVIDENCE` to a testcase whose gate result is `pass`, when the recorded assertion does not measure the expected result.
- The judge may not add, remove, rewrite, or reorder testcases.
- The judge may not relax, drop, or substitute a required-evidence item.
- The judge may not read the executor's narrative as evidence.
  Only recorded observations and stored artifacts count.
- A `manual` gate result becomes `INSUFFICIENT_EVIDENCE` unless the oracle defines an objective assertion that was directly observed.
- Contradictory later evidence must downgrade an earlier `VERIFIED`.
- Lint, typecheck, build success, code inspection, and helper confidence can never produce `VERIFIED`.

## Disagreement Record

For every testcase, record the helper's self-reported status and the judge's verdict.

`update_manifest.py record-judge` records every verdict into `judge_history`, so a disagreement stays counted even when a re-execution later resolves it.

`update_manifest.py summary` reports two numbers:

- `disagreement_cases`: distinct testcases where the judge differed from the helper at least once.
- `disagreement_events`: every individual disagreement, including repeats across attempts.

Report the first one to the human as `Judge sửa {disagreement_cases}/{total} kết luận của executor`.
Use the second when analysing the experiment.

This number decides the experiment:

- consistently zero means the judge is redundant or rubber-stamping, and it should be removed;
- meaningful and correct means the helper self-report should lose its authority next;
- meaningful and wrong means required evidence is underspecified, so fix the plan, not the judge.

## Re-Execution

Re-execute a testcase only when its verdict is `INSUFFICIENT_EVIDENCE` and the missing evidence is something a second run can capture.

Rules:

- At most one re-execution per testcase per run.
- Re-execution may change fixtures, dataset, browser context, or capture settings.
- Re-execution may never change the testcase action, expected result, or required evidence.
- Never re-execute to obtain a different verdict for the same evidence.
- Record the attempt count and what changed between attempts.
