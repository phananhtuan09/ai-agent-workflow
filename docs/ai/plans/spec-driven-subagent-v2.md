## Spec
docs/ai/specs/spec-driven-subagent-v2.md - ACs: #1 #2 #3 #4 #5

## Approach
Extend the existing Pi sub-agent extension instead of introducing a separate orchestration layer. Add one earlier plan-review command, a lightweight readiness-brief surface, and per-command opt-in automatic review chaining while keeping all output ephemeral. Keep automatic review behavior bounded to artifact phase boundaries and scoped to review assistance only, without autonomous code execution or durable review files.

## Tasks

### Phase 1: Extend review command surfaces
- [x] Add a dedicated pre-enrichment plan review command with concise contract-focused output
- [x] Add a readiness brief command that summarizes the highest-priority review focus before execution
- [x] Reuse and extend delegated prompt builders and subprocess execution helpers for the new review surfaces

### Phase 2: Add bounded automation controls
- [x] Define opt-in automatic review behavior for selected workflow boundaries
- [x] Wire per-command controls so automatic review remains explicit and bounded
- [x] Ensure automation only triggers review assistance and never autonomous code modification

### Phase 3: Keep output ephemeral
- [x] Keep new review surfaces aligned with explicit artifact-path handling and in-session output only
- [x] Confirm the extended workflow adds no durable review files or appended review artifacts by default or opt-in
- [x] Preserve traceability through concise custom output details instead of file persistence

### Phase 4: Document and verify the extended behavior
- [x] Document the new commands, automation options, and ephemeral-output behavior for Pi users
- [x] Add verification coverage for the new review surfaces, automation boundaries, and no-persistence behavior
- [x] Validate existing review commands continue to work unchanged when new options are not enabled

## Test Checklist
- [ ] Manual: Run the new pre-enrichment plan review command on a sample plan and confirm concise contract-focused output
- [ ] Manual: Run the readiness brief command on a reviewed artifact packet and confirm short execution-focus output
- [ ] Manual: Enable opt-in automatic review behavior and confirm it triggers only at the configured boundary
- [ ] Manual: Confirm all new review runs remain ephemeral and do not write review artifacts under `docs/ai/`
- [ ] Integration: Verify existing `/review-spec`, `/enrich-plan-pi`, and `/review-readiness` behavior remains unchanged by default
