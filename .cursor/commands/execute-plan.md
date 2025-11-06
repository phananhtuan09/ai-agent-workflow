## Goal
Execute the feature plan by implementing tasks and persisting notes to docs.

## Workflow Alignment
- Provide brief status updates (1–3 sentences) before each operation.
- For medium/large tasks, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update todos immediately after progress; mark completed upon finish.
- Perform edits via file editing tools, not by printing code for copy-paste.

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
1. **Status update**: Brief note (1–3 sentences) on what will be done.
2. Plan minimal change set:
   - Identify files/regions to modify
   - Map changes to acceptance criteria from plan
3. Implement changes:
   - Write/edit code according to the plan
   - Keep changes minimal and incremental
   - Avoid speculative changes beyond plan scope
4. Quick validation:
   - Run build/compile if available
   - Run fast unit/smoke tests if available
   - Fix immediate issues before proceeding
5. Persist notes to implementation doc:
   - File: `docs/ai/implementation/feature-{name}.md`
   - Append entry per completed task:
     - Files touched: `path/to/file.ext` (lines: x–y)
     - Approach/pattern used: brief description
     - Edge cases handled: list if any
     - Risks/notes: any concerns
6. Update planning doc:
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
- Detect available tools from project config (e.g., `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, build files) and run the appropriate non-interactive checks.
- Linting on changed files (prefer non-interactive):
  - JavaScript/TypeScript: `npx eslint .` or `pnpm eslint .` (add `--max-warnings=0` if desired)
  - Python: `ruff .` or `flake8 .`
  - Go: `golangci-lint run` or `go vet ./...`
  - Rust: `cargo clippy -- -D warnings`
  - Java: `./gradlew check` or `mvn -q -DskipTests=false -Dspotbugs.failOnError=true verify`
  - Scope to changed files when possible for speed
- Type checks (non-emitting where applicable):
  - TypeScript: `npx tsc --noEmit`
  - Python: `mypy .` (if configured) or `pyright` if present
  - Go/Rust/Java: rely on compiler/type system via build step
- Parallelize lint and type-check when safe; fix issues (up to 3 attempts) before proceeding.

## Step 6: Next Actions
After completing tasks:
- Suggest running `code-review` to verify against standards
- Suggest running `writing-test` if edge cases need coverage
- Suggest running `check-implementation` to validate alignment with plan

## Notes
- Keep code changes minimal and focused on plan tasks
- Document all changes in implementation doc for later review/refactor
- Avoid implementing features not in the plan
- Modifies source code per plan scope; updates `docs/ai/implementation/feature-{name}.md` and checkboxes in `docs/ai/planning/feature-{name}.md`. Does not modify unrelated files.
- Idempotent: safe to re-run; appends entries or updates checkboxes deterministically.
