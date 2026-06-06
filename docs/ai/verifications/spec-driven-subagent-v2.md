# Verification: Spec-Driven Subagent v2

## Source
docs/ai/specs/spec-driven-subagent-v2.md

---

## Manual Verification

- [ ] AC1: Run `/review-plan @docs/ai/plans/subagent-v1-smoke-test.md` in Pi -> expect a concise verdict with `Verdict`, `Ready for enrich-plan`, `Plan contract issues`, `Coverage gaps`, `Ordering concerns`, and `Ambiguities`.
- [ ] AC2a: Run `/enrich-plan-pi @docs/ai/plans/subagent-v1-smoke-test.md --review-plan` in Pi -> expect the plan review to run automatically before enrichment and only at that configured boundary.
- [ ] AC2b: Run `/review-readiness @docs/ai/specs/subagent-v1-smoke-test.md @docs/ai/plans/subagent-v1-smoke-test.md @docs/ai/plans/subagent-v1-smoke-test-phase-1-details.md @docs/ai/plans/subagent-v1-smoke-test-phase-2-details.md --brief` -> expect the readiness review to run first and the readiness brief to run automatically after it.
- [ ] AC3: Run `/readiness-brief @docs/ai/specs/subagent-v1-smoke-test.md @docs/ai/plans/subagent-v1-smoke-test.md @docs/ai/plans/subagent-v1-smoke-test-phase-1-details.md @docs/ai/plans/subagent-v1-smoke-test-phase-2-details.md` -> expect a short execution-focus output with `Top risks`, `Open decisions`, and `Execution focus`.
- [ ] AC4a: During `/review-plan`, verify the command uses only the provided explicit plan path and returns output in-session only.
- [ ] AC4b: During `/enrich-plan-pi --review-plan` and `/review-readiness --brief`, verify no durable review files or appended review notes are created under `docs/ai/`.
- [ ] AC5: Inspect the opt-in automation behavior -> expect only review assistance to be chained, with no autonomous code modification and no broadened orchestration beyond artifact review.

---

## Automated Verification

- [ ] Unit: Validate `.pi/extensions/subagent/prompts.ts` prompt builders for `buildReviewPlanPrompt()` and `buildReadinessBriefPrompt()` produce the required output contracts.
- [ ] Integration: Start Pi with project-local extension discovery enabled and confirm `/review-plan` and `/readiness-brief` load without registration errors.
- [ ] Integration: Run existing `/review-spec`, `/enrich-plan-pi`, and `/review-readiness` without `--review-plan` or `--brief` -> expect their default behavior to remain unchanged.

---

## Edge Cases

- [ ] `/review-plan` with a nonexistent plan path -> expect a clear `Path not found` error and no delegated subprocess run.
- [ ] `/readiness-brief` with fewer than 3 resolved artifacts -> expect a usage warning and no delegated subprocess run.
- [ ] `/review-readiness --brief` with a missing detail file -> expect the command to fail fast during path resolution before any delegated review runs.
- [ ] `/enrich-plan-pi --review-plan` on a plan with invalid phase/task structure -> expect the normal enrich validation failure after the optional review step, without autonomous fallback behavior.

---

## Excluded (Out of Scope)

- Generic multi-agent orchestration beyond the defined review workflow
- Autonomous implementation agents that modify the codebase independently
- Persistent review files, appended review notes, or durable review history in v2
- Broad technical domain review at the business-spec stage
