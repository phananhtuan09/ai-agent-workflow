# Regression Scope

Read this file before selecting any regression testcase.

Purpose: check whether the changed code broke behavior that is not part of the change.

## The Oracle Problem

An approved spec defines the new feature, not the behavior that already existed.
So regression testcases have no oracle in the spec, and inventing one produces tests that only describe the current implementation.

Allowed oracles, in priority order:

1. **Existing automated tests** covering the impacted surface.
   Run them and use their result directly.
2. **Observable integrity of the flow**: the flow still completes, no new console error, no required request fails, no navigation breaks.
3. **Nothing else.**

If a regression check requires knowing the previously correct behavior and neither oracle 1 nor oracle 2 can settle it, record `INSUFFICIENT_EVIDENCE` with the reason `không có nguồn định nghĩa hành vi cũ`.

Never derive an expected regression result from the current code, the diff, or a screenshot taken after the change.

## Deriving The Impacted Surface

Collect changed files first:

- mode A: files reported by the implementation summary, confirmed against the working tree.
- mode B: the `Impact → Blast radius` section of the `fix-bug` summary.
- mode C: the files the human named, plus files in the same module.

Then select level 1 only:

- **L1**: modules and routes that directly import, call, or render the changed code.
- L2 and shared infrastructure are recorded as unverified risk, not tested, unless the oracle explicitly requires them.

Prefer user-visible entry points that already exist in the application over synthetic checks.

## Selection Limits

- At most six regression testcases per run.
- Rank candidates by: shared route with the change, shared state or store, shared API endpoint, then same module.
- Never include a regression testcase that duplicates a feature testcase already planned.
- Never include a destructive flow such as delete, payment, or migration as a regression testcase.
- If more than six candidates exist, test the top six and record the remainder as unverified risk.

## Ids And Checklist Placement

- Use ids `RG-001`, `RG-002`, and so on.
- Regression testcases carry no acceptance-criterion mapping.
- Write them in their own checklist section so `manual-checklist` rules and its acceptance-criterion coverage math stay untouched:

```markdown
## Ca kiểm thử hồi quy
- [ ] 🔴 RG-001 — {hành động} → {kết quả mong đợi} — Nguồn: {test có sẵn | tính toàn vẹn luồng} — AI: Chưa chạy

## Rủi ro chưa kiểm
- {surface không được kiểm và lý do}
```

- Keep regression counts separate from spec testcase counts in every summary.
- Never let a regression result change the status of a feature testcase.

## Status Rules

- `VERIFIED` requires oracle 1 passing, or oracle 2 fully observed for the exact flow.
- Oracle 2 alone can never verify a business rule; it verifies only that the flow is not broken.
- A failing existing test is `CONFIRMED_FAILURE` and belongs in a fix handoff.
- A new console error, failed required request, or broken navigation on an L1 flow is `CONFIRMED_FAILURE`.
- Everything else unresolved is `INSUFFICIENT_EVIDENCE`.

## Interaction With `verify-runtime`

`verify-runtime` keeps execution bounded to the checklist it is given.
Regression testcases live in that checklist, so they are in bounds, and their `Spec mapping` column is written as `—`.

If `verify-runtime` declines a testcase because it has no acceptance-criterion mapping, stop and report it.
Do not relax `verify-runtime` rules from this skill.
