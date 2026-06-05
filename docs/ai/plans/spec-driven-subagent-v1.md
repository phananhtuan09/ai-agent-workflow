## Spec
docs/ai/specs/spec-driven-subagent-v1.md - ACs: #1 #2 #3 #4 #5

## Approach
Add project-local Pi extension assets that provide isolated review commands and an internal explore worker scaffold aligned to the spec-driven workflow. Extend the installer and package manifest so Pi resources are distributed with the repo and can be synced into target projects. Keep the initial scope lightweight: ephemeral outputs only, explicit artifact paths, and no persisted review files.

## Tasks

### Phase 1: Add Pi extension assets
- [x] Create a project-local Pi extension with role-specific delegated review commands
- [x] Add shared delegated runner and prompt builders for isolated subprocess execution
- [x] Add an internal explore worker surface for enrich-plan integration

### Phase 2: Wire Pi distribution support
- [x] Add Pi as a supported install target in tool configuration
- [x] Sync project-local Pi resources during installation
- [x] Include Pi assets in published package contents

### Phase 3: Document Pi workflow usage
- [x] Document Pi installation and command usage in the README
- [x] Document the initial behavior and scope limits for Pi users

## Test Checklist
- [ ] Manual: Install Pi assets into a test workspace and confirm `.pi/extensions/subagent/` is created
- [ ] Manual: Inspect `/review-spec` and `/review-readiness` command definitions for explicit path handling and ephemeral output behavior
- [ ] Manual: Verify installer still supports existing Codex, Claude, and Antigravity flows unchanged
