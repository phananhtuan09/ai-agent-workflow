## Phase 2 Details — Validate workflow packet

### Files to modify
- `docs/ai/plans/subagent-v1-smoke-test.md` — refresh/append `## Enrich Summary`

### Files to create
- `docs/ai/plans/subagent-v1-smoke-test-phase-2-details.md` — generated phase detail file for Phase 2

### Relevant symbols
- `.pi/extensions/subagent/prompts.ts` — `buildExplorePrompt()`, `buildReviewReadinessPrompt()`

### Notes
- `review-readiness` is ephemeral by contract: it should read explicit spec/plan/detail paths and return in-session output only; no review artifact file should be created.
