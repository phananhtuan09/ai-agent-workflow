# Playwright plan and evidence contract

Use native Playwright Test files, not a restricted action language.
Paths below are relative to the project root; suite files live beside the Markdown plan.

## Suite file

```json
{
  "plan": "docs/testing/active/orders.md",
  "files": ["tests/orders.spec.ts", "playwright.config.ts", "package-lock.json"],
  "command": ["npx", "--no-install", "playwright", "test", "tests/orders.spec.ts"],
  "environment": "isolated-local",
  "revision": "web@<commit>; dirty-tree identity recorded in approved file hashes",
  "base": {
    "revision": "<merge-base commit>",
    "env": {"WEB_PORT": "5274", "DATA_DIR": ".data-base"},
    "setup": [["npm", "ci"]],
    "keep": ["package-lock.json"]
  },
  "determinism": {
    "env": {"FIXED_NOW": "2026-01-01T00:00:00Z", "SEED": "1"},
    "normalize": [{"pattern": "ord_[0-9a-f]{8}", "replacement": "ord_<ID>"}],
    "limits": ["Server-generated UUIDs are not seeded"]
  },
  "existing": {
    "suites": [
      {"id": "unit", "command": ["npx", "--no-install", "vitest", "run", "--reporter=junit", "--outputFile={report}"]},
      {"id": "e2e", "command": ["npx", "--no-install", "playwright", "test", "--reporter=junit"], "env": {"PLAYWRIGHT_JUNIT_OUTPUT_NAME": "{report}"}}
    ]
  },
  "cases": [
    {
      "id": "E2E-01",
      "kind": "browser",
      "classification": "new-behavior",
      "checks": [
        {"id": "ui_staff", "expected": "Staff B after reload", "source": "rendered DOM"},
        {"id": "saved_staff", "expected": "staff-b persisted", "source": "fresh API read"},
        {"id": "total", "expected": "unchanged from captured baseline", "source": "fresh API read"}
      ]
    },
    {
      "id": "PR-01",
      "kind": "pr-test",
      "classification": "new-behavior",
      "test": {"file": "e2e/orders.spec.ts", "title": "assigns staff"}
    }
  ]
}
```

`classification` is `new-behavior` (default; the case must fail on base) or `invariant` (expected to pass on base too).
Include at least one `invariant` case when declaring a base: invariant cases double as a base health probe, and if none of them passes on base the base run is treated as degraded.
A `pr-test` case runs a test the change itself added or modified, matched by file and title; it needs no tag or observations and its PASS is a native result only.
List PR test files in `files` (the tool rejects a `pr-test` whose file is not listed) and target them in `command` like any other test.
A suite needs at least one runtime case besides `pr-test` cases.

## Base revision

`base` is optional.
When present, `run` creates a detached worktree at `base.revision`, copies the approved `files` from the snapshot over it except those named in `keep`, runs each `setup` step there, then runs the same `command` with `base.env` added.
The tests therefore come from head and only the application comes from base; keep application code out of `files`, and list in `keep` any dependency manifest or lockfile that must stay at its base version.
`base.env` is required and must give the base instance its own ports and data so the two instances share no mutable state; setup steps and the test command both receive it.
Setup must reproduce what the head run relies on (dependencies, seed data, fixtures) so a base failure reflects the behavior rather than a missing prerequisite.
The rest of the environment is inherited as for the head run, so every shared or stateful endpoint the app reads must be overridden there.
`base.env` values are snapshotted into the bundle: use non-secret values only.
Setup steps run with a 30-minute timeout and log both output streams to `base/setup.log`.
The worktree is removed after the run and the outcome is recorded as `worktreeCleanup` in `base/run-manifest.json`.

## Determinism

`determinism` is optional; without it the summary states that time, seed data, randomness, and IDs are uncontrolled.
Copy its settings from the project runtime reference.

- `env`: non-secret variables that freeze time, seed data, or stub randomness where the app supports it. Both the head and base runs, and base setup, receive them; `base.env` must not override them.
- `normalize`: regular-expression rules applied to observed values before head and base are compared, for IDs, timestamps, and other values that differ between two correct instances. Normalize only noise; a rule that hides the behavior under test makes every case unprovable.
- `limits`: what the app cannot make deterministic. They appear in the summary and belong in the report's limits.

## Existing suites

`existing` lists the project's own test suites (unit, integration, e2e), copied from the project runtime reference.
A suite with a `base` must declare it; when the project has no suites of its own, write `"existing": {"suites": [], "reason": "<why>"}`.
`run` runs each suite on head in the project root and on base in the base worktree, after putting every file it copied from the head snapshot back to its base version, so each revision runs its own tests. Base runs also receive `base.env`; neither receives `determinism.env`.
Write `{report}` where the suite takes its JUnit XML output path, in an argument or an `env` value; the tool replaces it with a file in the bundle.
With a report the tool compares each test; without one it compares exit codes only.
Tests whose name carries one of the plan's case tags (`[E2E-01]`) are left out: the plan's own cases are judged as cases.
A test that passes on base and fails on head is run once more on head, with the whole suite, before it counts as a new failure.

Each test is classified from its base and head outcomes:

- `NEW_FAILURE`: fails on head on both attempts, and passed or did not exist on base.
- `UNSTABLE`: fails on head, then passes on the rerun.
- `PRE_EXISTING`: fails on base and head; not caused by the change.
- `FIXED`: fails on base, passes on head.
- `REMOVED`: passes on base, missing or skipped on head.

Each suite gets one status:

- `NEW_FAILURE`: at least one new failure. The suite cannot complete.
- `NEEDS_REVIEW`: an unstable or removed test and no new failure. Completion needs an accepted human sign-off.
- `PRE_EXISTING`: only failures that base has too. Report them apart from the change's results; they do not block it.
- `NOT_COMPARABLE`: a report is missing or unreadable, there was no usable base and head has failures, or both revisions exit non-zero without a per-test report. Completion needs an accepted human sign-off.
- `PASS`: none of the above.

When the app has no server-side clock control, freeze browser time in the test with `page.clock.setFixedTime()` or `page.clock.install()` and say so in `limits` if server time still varies.
Read rendered values only after a web-first assertion (for example `await expect(row).toBeVisible()`) has confirmed the data loaded; `innerText()` and `textContent()` do not wait for data and make results timing-dependent.

List every executed local dependency in `files`, including helpers, fixture modules, configs, dependency manifests/lockfiles, and approved baselines.
Use one test per case, titled `[E2E-01] descriptive title`.
The command must target exactly these tests with one configured browser project and one repeat.
Expand cases explicitly when multiple roles, inputs, browsers, or viewports are acceptance requirements.
Do not use `test.fail`, conditional skips, or retries to turn an unmet outcome into acceptance.
Configure `trace: 'on'` for browser cases after reviewing privacy implications.
The evidence tool adds native JSON reporting and a per-run output directory.
The environment label and revision are declarations; record actual service versions/config identity separately when they differ from the checkout.

## Structured observations

Tests attach one `runtime-observations` JSON document after recording checkpoints.
Register cleanup in `finally`/fixture teardown and attach the final cleanup outcome even on failure where possible.
Use Playwright `expect` assertions in addition to attaching observations.
Do not manually fabricate actual values or pass flags.

```ts
const baseline = await readPersistedOrder(orderId);
// Drive the real UI save path, then reload and read the persisted order again.
const actual = await readPersistedOrder(orderId);
const observations = {
  actualPath: `Order Detail -> Edit -> Save -> Reload; PATCH /api/orders/${orderId}`,
  checks: [
    { id: 'ui_staff', source: 'rendered DOM after reload',
      expected: 'Staff B', actual: await page.getByTestId('staff').innerText() },
    { id: 'saved_staff', source: `GET /api/orders/${orderId}`,
      expected: 'staff-b', actual: actual.staffId },
    { id: 'total', source: `GET /api/orders/${orderId}`,
      expected: baseline.total, actual: actual.total }
  ],
  cleanup: 'COMPLETE'
};
await test.info().attach('runtime-observations', {
  body: Buffer.from(JSON.stringify(observations)),
  contentType: 'application/json'
});
for (const check of observations.checks) {
  expect(check.actual, check.id).toEqual(check.expected);
}
```

This is a shape example, not a fixture implementation: emit `COMPLETE` only after cleanup actually succeeds.
Use `NOT_REQUIRED` for read-only cases; incomplete cleanup prevents acceptance.
Check evidence uses equality of JSON values; express other predicates as observed boolean comparisons and retain the underlying measurements in extra fields.
For invariants, retain baseline resource identity, values, observation time, and source in the document.
For requests, retain method/route/status and sanitized checkpoint values.
API cases use `kind: "api"` and retain request/downstream observations rather than a browser trace.
Boolean-only observations without supporting values are weak proof for an auditor.
Declared expectations are human-reviewed semantics; the tool cannot infer whether an observed value was derived honestly or whether a query bypasses the intended boundary.

## Commands

```bash
python3 <skill-root>/scripts/evidence.py validate <suite.json> --root <project>
# Only after explicit human approval, never as an agent's own decision:
python3 <skill-root>/scripts/evidence.py approve <suite.json> --root <project> --reviewer <human-id>
python3 <skill-root>/scripts/evidence.py run <suite.json> --root <project> --out <new-run-directory>
python3 <skill-root>/scripts/evidence.py audit <run-directory>
```

`approve` snapshots the suite and declared files in `<suite.json>.approval.json` by hash.
`run` rejects stale approval, creates a new directory, snapshots approved inputs, records the command/environment/revision and git identity, and executes without a shell.
The project must perform authorized preflight and acquire any required shared-state lock before invoking `run`.
Keep the lock through fixture cleanup; release it using the project's interruption-safe procedure.
`RUNTIME_E2E_RUN_ID` is available to fixtures, and `PLAYWRIGHT_JSON_OUTPUT_NAME` selects the native result file.
Do not permit tests to write generated output into approved files.

The bundle includes `inputs/`, `approval.json`, `run-manifest.json`, `native.json`, `artifacts/`, `stdout.log`, `stderr.log`, `results.json`, `summary.md`, and `integrity.json`.
With a base, `base/` holds the base run's manifest, native results, artifacts, and logs.
`existing/<id>/` holds each existing suite's head and rerun report and log; `base/existing/<id>/` holds the base ones. Their exit codes are in the two manifests.
Snapshots make the audit independent of later working-tree changes.
Attachment paths in native results are normalized to bundle-relative locations.
Only per-run artifact files and inline observations are accepted as attachments.
Keep the bundle locally unless its privacy/retention policy authorizes sharing it.

## Result and audit semantics

- `PASS`: native execution passed on the first attempt, all declared observation checks match, required evidence exists, and cleanup completed or was unnecessary.
- `FAIL`: native failure or a recorded expected/actual mismatch, including flaky retry-pass.
- `BLOCKED`: passing native execution lacks required proof/cleanup; malformed or missing output prevents acceptance.
- `NOT_RUN`: skipped or absent test; never coverage credit.

Each case also gets a `proof` value, computed from the head and base results:

- `PROVEN`: head PASS and base FAIL.
- `NON_PROVING`: a `new-behavior` case with head PASS and base PASS; it does not count as a passing case.
- `NOT_PROVEN`: no base declared, base degraded (unresolvable revision, worktree or setup failure, unusable native report, or global errors such as an app that did not start), base NOT_RUN/BLOCKED, a base failure where a retry attempt passed (flaky on base), or a base failure whose mismatched checks all match once normalized (the difference was only IDs, timestamps, or other normalized noise).
- `NOT_REQUIRED`: an `invariant` case.
- `NOT_EVALUATED`: head did not PASS.

When both runs recorded observations, `baseDiff` lists the checks whose actual values still differ between base and head after normalization.
A base failure counts as proof only when the base run itself was not degraded; the reason names the base error or mismatched checks so an auditor can confirm the failure came from the behavior, not the environment.
`run` and `audit` exit nonzero when any case is `NON_PROVING`, and when an existing suite is `NEW_FAILURE`, `NEEDS_REVIEW`, or `NOT_COMPARABLE`.

The tool exits nonzero for any result other than PASS or an execution failure.
It records all attempts, and rejects duplicate/undeclared tests rather than silently broadening coverage.
`audit` checks bundle integrity and recomputes the generated results/summary, including `proof`, from the raw head and base results.
It does not automatically establish `SUPPORTED`: Agent B still inspects assertions, trace/request checkpoints, baseline values, persistence sources, safety and approval provenance.
Do not alter the bundle to repair failures; create a newly approved run instead.
For prerequisites discovered before execution, record the blocker in the Markdown ledger; do not manufacture a native PASS or a fake run bundle.
