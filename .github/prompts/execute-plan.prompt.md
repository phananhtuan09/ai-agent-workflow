---
name: 'execute-plan'
description: 'Executes the implementation doc tasks, edits code, and persists notes.'
agent: 'agent'
tools: ['runCommands', 'runTasks', 'edit', 'search/readFile', 'extensions', 'problems', 'changes', 'fetch', 'todos']
---
## Goal

Execute the feature plan by implementing tasks from the implementation doc and persisting notes to docs.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before each operation.
- For medium/large tasks, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update todos immediately after progress; mark completed upon finish.
- Perform edits via file editing tools, not by printing code for copy-paste.

### Prerequisites

- Feature name (kebab-case, e.g., `user-authentication`)
- Implementation doc exists: `docs/ai/implementation/feature-{name}.md`
- Planning doc exists: `docs/ai/planning/feature-{name}.md` (reference only; tasks are driven by implementation doc)

## Step 1: Gather Context

- Ask for feature name if not provided (must be kebab-case).
- Load implementation doc: `docs/ai/implementation/feature-{name}.md`.
- **Load template:** Read `docs/ai/implementation/feature-template.md` to understand required structure.

### 1a: Phase Progress Detection

If implementation doc exists, scan for phase markers (`### Phase X:`):

- **Count total phases** in the document
- **Detect last completed phase**: Find the highest phase where ALL tasks (checkbox `[x]`) are marked complete
- **Detect current phase**: Find the first phase with incomplete tasks (`[ ]` marks)
- **Show summary to user**:
  ```
  Found 3 phases.
  - Phase 1 (Database Setup): Complete [x]
  - Phase 2 (API Endpoints): In Progress [2/4 tasks done]
  - Phase 3 (Frontend): Not Started

  Resuming Phase 2...
  ```

If no phases detected (old format):
- Treat entire "Changes" section as single phase (backward compatible)

## Step 2: Build Task Queue

- Parse tasks (checkboxes `[ ]`, `[x]`) from **current phase only** (from phase detection in Step 1a):
  - Primary source: Tasks under `### Phase X:` with `[ ] [ACTION] ...` entries (incomplete only).
  - For `[MODIFIED]` files, parse sub-bullets representing distinct logic items with line ranges.
  - **Skip completed phases** entirely (do not re-execute)
- Build prioritized task queue (top-to-bottom unless dependencies block).
- Identify blocked tasks and note reasons.

Note: Do not include Follow-ups section unless explicitly in current phase.

## Step 3: Implement Iteratively (per task)

For each task in queue:

1. **Status update**: Brief note (1–3 sentences) on what will be done.
2. Plan minimal change set:
   - Identify files/regions to modify
   - Map changes to acceptance criteria from plan (reference if needed)
3. Implement changes:
   - Write/edit code according to the implementation doc entries (`[ACTION]` items)
   - Keep changes minimal and incremental
   - Avoid speculative changes beyond implementation scope
4. Quick validation:
   - Run build/compile if available
   - Run fast unit/smoke tests if available
   - Fix immediate issues before proceeding
5. Persist notes to implementation doc:
   - File: `docs/ai/implementation/feature-{name}.md`
   - Update the relevant `[ ]` entry to `[x]` when completed
   - For `MODIFIED` files with sub-bullets, mark each completed sub-bullet `[x]`
   - Include line ranges and concise summaries as per template
6. Update implementation doc:
   - Mark completed tasks `[x]` with brief notes
   - Mark blocked tasks with reason
   - Do not mirror completion state in the planning doc

## Step 4: Implementation Doc Structure

**Before creating the implementation doc, ensure you have read:**

- `docs/ai/implementation/feature-template.md` - Template structure to follow

If creating implementation doc for the first task (should already exist from create-plan):

- Use the structure from `feature-template.md` exactly
- Ensure these sections exist:
  - `# Implementation Notes: {Feature Name}`
  - `## Summary` - Brief description of overall approach
  - `## Changes` — Use `[ ] [ACTION] ...` format with allowed actions ADDED | MODIFIED | DELETED | RENAMED
    - For MODIFIED, use sub-bullets with line ranges and per-logic summaries
  - `## Edge Cases` - List of handled edge cases
  - `## Follow-ups` - TODOs or deferred work
  - `## Execution Discipline`

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

## Step 6: Phase Completion Check (NEW)

After completing all tasks in current phase:

1. **Mark phase complete** in implementation doc (optional visual marker)
2. **Check remaining phases**:
   - If more incomplete phases exist:
     ```
     ✓ Phase 2 complete!
     Ready for Phase 3 (Frontend)?
     Run: /execute-plan
     ```
   - If this is final phase:
     ```
     ✓ All phases complete!
     Ready for code review?
     Run: /code-review
     ```

## Step 7: Next Actions

After all phases complete:

- Suggest running `code-review` to verify against standards
- Suggest running `writing-test` if edge cases need coverage
- Suggest running `check-implementation` to validate alignment with implementation entries

If phases remain:
- User runs `/execute-plan` again; Phase detection (Step 1a) will resume correctly

## Notes

- Keep code changes minimal and focused on implementation tasks
- Document all changes in the implementation doc; use checkboxes to track progress
- Avoid implementing features not in the implementation doc scope
- Modifies source code per implementation scope; updates `docs/ai/implementation/feature-{name}.md`. Does not modify unrelated files.
- Idempotent: safe to re-run; updates checkboxes deterministically.