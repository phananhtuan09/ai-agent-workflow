## Done
- Updated `docs/ai/specs/spec-driven-subagent-v2.md` so the v2 source of truth matches the implemented ephemeral Pi review workflow.
- Marked all implementation tasks complete in `docs/ai/plans/spec-driven-subagent-v2.md` based on the existing Pi subagent code.
- Documented Pi review commands, opt-in automation flags, and ephemeral-output behavior in `README.md`.
- Added `docs/ai/verifications/spec-driven-subagent-v2.md` to cover plan review, readiness brief, bounded automation, unchanged default behavior, and no-persistence expectations.

## Not Done / Blocked
- Manual Pi command execution was not run in this pass, so the v2 verification checklist remains unchecked.
- No unit or integration test suite was added for the Pi extension prompt builders or delegated-runner flows.

## Verified
- AC1 ⚠ existing code path present in `.pi/extensions/subagent/index.ts` / not manually executed in this pass.
- AC2 ⚠ opt-in flags `--review-plan` and `--brief` exist in `.pi/extensions/subagent/index.ts` / not manually executed in this pass.
- AC3 ⚠ `readiness-brief` command and prompt builder exist / not manually executed in this pass.
- AC4 ⚠ spec/documentation now align with ephemeral review behavior / no runtime verification executed in this pass.
- AC5 ⚠ implementation remains review-only and does not autonomously modify code outside the parent command flow / not runtime-tested in this pass.

## Not Verified
- AC1 No test execution evidence yet
- AC2 No test execution evidence yet
- AC3 No test execution evidence yet
- AC4 No test execution evidence yet
- AC5 No test execution evidence yet
