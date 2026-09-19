---
name: runtime-e2e-test-plan
description: Create, execute, resume, or audit a durable runtime end-to-end test plan. Use for multi-case acceptance or regression verification across real UI, API, database, filesystem, process, or external-service boundaries. The plan records auditable runtime evidence and simple human sign-off. Do not use unit, widget, mocked, or source-inspection checks to pass runtime cases.
---

# Runtime E2E Test Plan

Create and run auditable runtime test plans without replacing model judgment with a rigid script.

## Source of truth

Read `docs/testing/README.md` before creating, executing, resuming, or auditing a plan. Store active plans in `docs/testing/active/` and useful completed plans in `docs/testing/completed/`.

Validate the artifact with:

```bash
python3 skills/runtime-e2e-test-plan/validate_test_plan.py <plan.md> --mode plan
python3 skills/runtime-e2e-test-plan/validate_test_plan.py <plan.md> --mode completion
```

Runtime adapters rewrite the skill path when installed.

## Project runtime reference

Before planning or execution, read
`skills/runtime-e2e-test-plan/references/project-runtime.md`. This file is a
project-local template that maintainers customize after installation with the
actual service commands, readiness signals, environment profile, required
variable names, authentication, fixtures, evidence locations, cleanup, and safety
constraints.

Treat the reference as operational configuration, not product authority. Never
execute placeholder commands or invent environment values. `Status: READY` means
the project has verified the documented preflight. If the file is missing or
unconfigured, inspect existing repository configuration and runbooks for facts
you can establish safely. Record unresolved runtime prerequisites as blockers;
never compensate with a lower-level or mocked path. Never write secret values into
the reference or a test plan.

## Boundaries

Use this capability when verification has multiple cases, crosses runtime boundaries, must survive sessions, needs fixtures or cleanup, includes release blockers, or needs later audit.

Do not create a durable plan for a small same-session check that can be reproduced and proved directly.

A runtime case exercises the running system through its real user or operational entrypoint. Unit, widget, mocked, static-analysis, build, and source-inspection checks may supplement a run, but they never make a runtime case pass.

The agent remains free to choose tools, fixture construction, execution order, debugging strategy, and additional observations. The fixed constraints are:

1. Exercise the declared runtime path.
2. Observe the declared outcome.
3. Record clear evidence.
4. Never convert unavailable or alternate-path proof into `PASS`.

## Mode: create or revise a plan

1. Read the project runtime reference, current request, and the smallest relevant product, domain, architecture, code, configuration, and runtime surfaces.
2. Derive cases from observable behavior, boundaries, failures, and material negative paths.
3. Trace each release-blocking case far enough to name the real production path: user action or operational trigger, runtime entrypoint, boundary request, and persisted or visible outcome.
4. Separate agent-verifiable behavior from subjective human judgment.
5. Define fixtures and cleanup using the project's documented runtime capabilities without prescribing unnecessary implementation details.
6. Mark the plan `READY` only after every case has a runtime path and observable expected result.
7. Run the validator in `plan` mode.

Do not freeze an implementation detail unless it identifies the production path or observable contract. If several valid runtime methods exist, describe the required boundary and outcome rather than one exact tool command.

## Mode: execute or resume a plan

1. Read the entire plan, project runtime reference, and current repository authority.
2. Run the documented preflight where needed; do not start against a prohibited or unidentified environment.
3. Record the tested revisions, environment, configuration identity, and a unique run ID without storing secrets.
4. Mark the plan `RUNNING` and update evidence immediately after each case.
5. Execute the declared runtime path. For visible UI behavior, use the actual application and browser or device at a relevant viewport.
6. Record the actual path, whether it matched, observed outcome, and evidence references.
7. Mark:
   - `PASS` only when the declared runtime path and expected outcome were observed.
   - `FAIL` when the path runs and the outcome differs.
   - `BLOCKED` when the required runtime path cannot be exercised.
   - `INVALIDATED` when accepted intent changed and the old case no longer represents the required behavior.
8. When authorized to fix a failure, preserve the failure evidence, fix the cause, and rerun the same runtime case. Supporting automated checks do not replace the rerun.
9. Complete cleanup and record its status.
10. Update the run summary and set the suite status:
   - `FAILED` or `BLOCKED` while material cases remain unresolved.
   - `AWAITING_HUMAN` when machine-verifiable cases pass but subjective review remains.
   - `COMPLETED` only after required human sign-off is accepted.
11. Run the validator in `completion` mode before claiming the plan complete or ready for human sign-off.

## Path fidelity

An alternate endpoint, direct database mutation, lower-level method, test double, or automation-only shortcut is not the declared production path unless the case explicitly targets it.

If the production path changes because accepted behavior changed, revise the case and note why. Do not revise a path merely because another path is easier to test.

## Evidence

Evidence must let another session determine what actually ran without replaying the entire conversation. Prefer stable repository-relative paths and identifiers:

- browser screenshot or recording path
- request method, route, and status
- correlation or trace ID
- runtime log path and relevant timestamp
- persisted resource ID and observed post-reload state
- generated file or exported document path

Never copy secrets, tokens, cookies, passwords, or production-sensitive payloads into the plan.

## Human sign-off

Keep human review small. The reviewer checks:

1. Summary counts and release blockers.
2. `Runtime path` versus `Actual path` for important cases.
3. Evidence for failures, blockers, and subjective UI/UX cases.
4. The running product directly where judgment is subjective.

The agent may prepare the sign-off section but must never set `Decision: ACCEPTED` without an explicit human decision.

## Audit mode

For an existing plan:

1. Run the validator.
2. Check every release blocker and a risk-based sample of normal cases.
3. Verify that `PASS` cases used matching runtime paths and observable outcomes.
4. Open referenced evidence when a claim is material or suspicious.
5. Report unsupported results separately from product failures.
6. Rerun only cases whose evidence is missing, contradictory, stale, or insufficient.
