# Runtime E2E Test Plans

This optional namespace stores durable runtime end-to-end acceptance and regression plans.

## Admission

Create a plan here only when runtime verification has multiple cases, crosses UI/API/data or operational boundaries, spans sessions, needs fixtures or cleanup, contains release blockers, or must be auditable later. Use direct proof for bounded same-session work.

A plan is execution memory, not product authority. Derive expected behavior from the current request and approved product or decision sources.

## Locations

- `docs/testing/active/<slug>.md`: ready, running, failed, blocked, or awaiting human review.
- `docs/testing/completed/<slug>.md`: completed plans whose evidence remains useful.

Delete routine completed plans when their history has no future reader.

## Required document shape

Use one Markdown file for the plan, execution ledger, summary, cleanup, and human sign-off. Free-form notes are allowed around the required fields.

```markdown
# Runtime E2E Test Plan: <name>

- Status: DRAFT
- Run ID: NOT_STARTED
- Environment: <runtime target>
- Tested revisions: NOT_STARTED
- Last updated: <ISO date/time>

## Scope

<observable behaviors and boundaries>

## Run summary

- Total: 1
- PASS: 0
- FAIL: 0
- BLOCKED: 0
- NOT_RUN: 1
- INVALIDATED: 0
- Release-blocking PASS: 0/1

## Human sign-off

- Decision: PENDING
- Reviewer: —
- Date: —
- Notes: Review release blockers, path fidelity, and subjective cases.

## Case D2 — Assign staff while editing a settled order

- Priority: RELEASE_BLOCKING
- Human judgment: NO

### Runtime path

Order List → Edit → select staff → Save adjustment; observe
`POST /orders/{id}/settled-corrections`; reload Order Detail.

### Expected

Save succeeds, the allocation persists after reload, totals and payments do not
change, and no unexpected runtime error is recorded.

### Execution

- Result: NOT_RUN
- Actual path: NOT_RUN
- Path match: NOT_RUN
- Observed: NOT_RUN
- Evidence: NOT_RUN
- Cleanup: NOT_RUN

### Notes

<optional preparation, supporting checks, failure history, or plan revision>
```

## Allowed values

- Plan status: `DRAFT`, `READY`, `RUNNING`, `FAILED`, `BLOCKED`, `AWAITING_HUMAN`, `COMPLETED`.
- Priority: `RELEASE_BLOCKING`, `NORMAL`.
- Human judgment: `YES`, `NO`.
- Result: `NOT_RUN`, `PASS`, `FAIL`, `BLOCKED`, `INVALIDATED`.
- Path match: `NOT_RUN`, `YES`, `NO`.
- Human decision: `PENDING`, `ACCEPTED`, `REJECTED`.
- Cleanup: `NOT_RUN`, `NOT_REQUIRED`, `COMPLETE`, `INCOMPLETE`.

## Runtime proof rules

- A case passes only through its declared runtime path and observable expected result.
- For UI behavior, exercise the actual application in a browser or device.
- Runtime API cases must call the running API and observe downstream state where relevant.
- Unit, widget, mocked, static, build, and source-inspection checks are supporting evidence only and cannot set a runtime case to `PASS`.
- An alternate endpoint or direct database mutation is not equivalent to the production path.
- A blocked production path remains `BLOCKED`; supporting checks do not upgrade it.
- After a fix, rerun the same failing runtime path.

## Evidence rules

A `PASS` case records:

- the actual runtime path;
- `Path match: YES`;
- the observed result;
- at least one auditable evidence reference;
- cleanup status when fixtures were created.

Evidence references should use repository-relative paths, request route/status, timestamps, correlation IDs, resource IDs, or artifact paths. Do not store secrets.

## Human review

The run summary is the review entrypoint. Human review should normally inspect:

1. Every release-blocking case.
2. Every `FAIL`, `BLOCKED`, or `INVALIDATED` case.
3. Cases marked `Human judgment: YES`.
4. Any `PASS` whose actual path or evidence appears unclear.

`AWAITING_HUMAN` means runtime execution is complete but subjective acceptance remains. Only an explicit human decision may set `Decision: ACCEPTED` and allow `Status: COMPLETED` when human judgment is required.

## Lifecycle

- `DRAFT`: cases are still being shaped.
- `READY`: runtime paths and expected outcomes are reviewable.
- `RUNNING`: evidence is being collected.
- `FAILED` or `BLOCKED`: unresolved runtime results remain.
- `AWAITING_HUMAN`: executable cases are complete and subjective review remains.
- `COMPLETED`: completion validation passes and required human sign-off is accepted.

Keep the summary and evidence ledger current so another session can audit the plan without relying on chat history.
