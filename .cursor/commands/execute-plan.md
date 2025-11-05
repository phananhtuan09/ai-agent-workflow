## Goal
Execute the feature plan by implementing tasks and persisting notes to docs.

### Prerequisites
- Feature name (kebab-case, e.g., `user-authentication`)
- Planning doc exists: `docs/ai/planning/feature-{name}.md`

## Step 1: Gather Context
- Ask for feature name if not provided (must be kebab-case).
- Load plan: `docs/ai/planning/feature-{name}.md`.
- **Load template:** Read `docs/ai/implementation/feature-template.md` to understand required structure.
- Ensure implementation doc exists or will be created: `docs/ai/implementation/feature-{name}.md`.

## Step 2: Build Task Queue
- Parse tasks (checkboxes `[ ]`, `[x]`) from the plan.
- Build prioritized task queue (top-to-bottom unless dependencies block).
- Identify blocked tasks and note reasons.

## Step 3: Implement Iteratively (per task)
For each task in queue:
1. Plan minimal change set:
   - Identify files/regions to modify
   - Map changes to acceptance criteria from plan
2. Implement changes:
   - Write/edit code according to the plan
   - Keep changes minimal and incremental
   - Avoid speculative changes beyond plan scope
3. Quick validation:
   - Run build/compile if available
   - Run fast unit/smoke tests if available
   - Fix immediate issues before proceeding
4. Persist notes to implementation doc:
   - File: `docs/ai/implementation/feature-{name}.md`
   - Append entry per completed task:
     - Files touched: `path/to/file.ext` (lines: x–y)
     - Approach/pattern used: brief description
     - Edge cases handled: list if any
     - Risks/notes: any concerns
5. Update planning doc:
   - Mark completed tasks `[x]` with brief note
   - Mark blocked tasks with reason

## Step 4: Implementation Doc Structure
**Before creating the implementation doc, ensure you have read:**
- `docs/ai/implementation/feature-template.md` - Template structure to follow

If creating implementation doc for first task:
- Use the structure from `feature-template.md` exactly
- Create `docs/ai/implementation/feature-{name}.md` with:
  - `# Implementation Notes: {Feature Name}`
  - `## Summary` - Brief description of overall approach
  - `## Changes` - Per-task entries with file paths, line ranges, approach
  - `## Edge Cases` - List of handled edge cases
  - `## Follow-ups` - TODOs or deferred work
- Follow the template format strictly

## Step 5: Quality Checks
After completing Step 4 for each task batch:
- Run linting on changed files (e.g., `eslint` if JavaScript/TypeScript project).
- Run type checks if applicable (e.g., `tsc --noEmit`).
- Fix issues (up to 3 attempts) before proceeding to the next task.

## Step 6: Next Actions
After completing tasks:
- Suggest running `code-review` to verify against standards
- Suggest running `writing-test` if edge cases need coverage
- Suggest running `check-implementation` to validate alignment with plan

## Notes
- Keep code changes minimal and focused on plan tasks
- Document all changes in implementation doc for later review/refactor
- Avoid implementing features not in the plan
