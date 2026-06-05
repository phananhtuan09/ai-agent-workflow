## Spec
docs/ai/specs/subagent-v1-smoke-test.md - ACs: #1 #2 #3 #4 #5

## Approach
Use a trivial two-phase plan so `/enrich-plan-pi` can map files and `/review-readiness` can compare artifacts.

## Tasks

### Phase 1: Prepare smoke-test artifacts
- [ ] Add a temporary note file target for the demo flow
- [ ] Add a tiny usage note describing the demo scope

### Phase 2: Validate workflow packet
- [ ] Enrich the plan into phase detail files
- [ ] Review readiness across spec, plan, and details

## Test Checklist
- [ ] Manual: Run `/review-spec` on the smoke-test spec
- [ ] Manual: Run `/enrich-plan-pi` on the smoke-test plan
- [ ] Manual: Run `/review-readiness` on the smoke-test artifact packet

## Enrich Summary
Total files: 3 (1 modified, 2 created)
Phase 1: Prepare smoke-test artifacts: 1 files · Phase 2: Validate workflow packet: 2 files

Details:
- Phase 1 → docs/ai/plans/subagent-v1-smoke-test-phase-1-details.md
- Phase 2 → docs/ai/plans/subagent-v1-smoke-test-phase-2-details.md
