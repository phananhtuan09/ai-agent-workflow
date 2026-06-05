# Verification: Spec-Driven Subagent v1

## Source
docs/ai/specs/spec-driven-subagent-v1.md

---

## Manual Verification

- [x] AC1: Run `/review-spec @docs/ai/specs/subagent-v1-smoke-test.md` in Pi -> expect a concise verdict with issues, ambiguities, and missing cases in the required output format.
  - Evidence: executed successfully on 2026-06-05 via `MSYS_NO_PATHCONV=1 pi --mode json -p --no-session --thinking minimal "/review-spec @docs/ai/specs/subagent-v1-smoke-test.md"`
  - Result: returned `Verdict`, `Ready for planning`, `Issues`, `Ambiguities`, `Missing cases` in isolated custom output.
- [x] AC2: Run `/enrich-plan-pi @docs/ai/plans/subagent-v1-smoke-test.md` in Pi -> expect one delegated explore run per phase and generated phase detail files that map likely files/symbols for implementation.
  - Evidence: executed successfully on 2026-06-05 via `MSYS_NO_PATHCONV=1 pi --mode json -p --no-session --thinking minimal "/enrich-plan-pi @docs/ai/plans/subagent-v1-smoke-test.md"`
  - Result: returned `subagent-loading` + `subagent-enrich-plan`, regenerated both phase detail files, and refreshed `## Enrich Summary` in `docs/ai/plans/subagent-v1-smoke-test.md`.
  - Follow-up fix: corrected `parseExploreSection()` in `.pi/extensions/subagent/index.ts` so `Files to modify` / `Files to create` bullets are counted correctly and included in summary totals; also added `### Relevant symbols` output to generated phase detail files.
- [x] AC3: Run `/review-readiness @docs/ai/specs/subagent-v1-smoke-test.md @docs/ai/plans/subagent-v1-smoke-test.md @docs/ai/plans/subagent-v1-smoke-test-phase-1-details.md @docs/ai/plans/subagent-v1-smoke-test-phase-2-details.md` -> expect a concise verdict with coverage gaps, unresolved ambiguity, and human review focus.
  - Evidence: executed successfully on 2026-06-05 via `MSYS_NO_PATHCONV=1 pi --mode json -p --no-session --thinking minimal "/review-readiness @docs/ai/specs/subagent-v1-smoke-test.md @docs/ai/plans/subagent-v1-smoke-test.md @docs/ai/plans/subagent-v1-smoke-test-phase-1-details.md @docs/ai/plans/subagent-v1-smoke-test-phase-2-details.md"`
  - Result: returned `Verdict`, `Ready for execute-plan`, `Spec -> Plan gaps`, `Plan -> Details gaps`, `Residual ambiguity`, `Human review focus`.
- [x] AC4a: During `/review-spec`, verify delegated work runs in an isolated child Pi subprocess -> expect review output returned in the current interaction only.
  - Evidence: output arrived as custom in-session messages (`subagent-loading`, `subagent-review-spec`) with no persisted review artifact file created.
- [x] AC4b: During `/review-readiness`, verify no review result file is created or appended under `docs/ai/` -> expect ephemeral output only.
  - Evidence: only the pre-created smoke-test artifacts exist; the command produced in-session custom output and did not write review notes.
- [x] AC5a: Run `/review-spec` with an explicit spec path -> expect the command to resolve and use only the provided file.
  - Evidence: explicit `@docs/ai/specs/subagent-v1-smoke-test.md` path resolved and review completed.
- [x] AC5b: Run `/review-readiness` with explicit spec/plan/detail paths -> expect the command to reject missing files and use only the provided artifacts.
  - Evidence: explicit packet of 4 paths resolved and review completed against those artifacts.

---

## Automated Verification

- [ ] Unit: Validate `.pi/extensions/subagent/prompts.ts` prompt builders produce the required review/explore output contracts.
- [x] Integration: Start Pi with project-local extension discovery enabled and confirm `/review-spec`, `/review-readiness`, `/enrich-plan-pi`, and internal `explore_phase` load without registration errors.
  - Evidence: all three commands executed from project-local extension discovery in `pi --mode json -p --no-session` runs on 2026-06-05 with no registration/startup errors.
- [ ] Integration: Abort a delegated review mid-run -> expect child process termination and no stuck loading indicator.

---

## Edge Cases

- [ ] `/review-spec` with a nonexistent path -> expect a clear "Path not found" error and no delegated subprocess run.
- [ ] `/review-readiness` with fewer than 3 resolved artifacts -> expect a usage warning and no delegated subprocess run.
- [ ] `explore_phase` with empty `phaseName` or empty `tasks` -> expect a structured failure payload instead of broad exploration.
- [ ] Delegated child Pi exits without assistant text -> expect fallback output from stderr or `No review output produced.`

---

## Excluded (Out of Scope)

- Automatic review steps that run without user request
- Persistent review result files or appended review notes
- Generic autonomous multi-agent orchestration beyond the defined workflow support
- Independent user-facing exploration commands outside plan enrichment
