Use `docs/ai/testing/feature-{name}.md` as the source of truth.

## Step 1: Gather Context (minimal)
- Ask for feature name if not provided (must be kebab-case).
- **Load template:** Read `docs/ai/testing/feature-template.md` to understand required structure.
- Then locate docs by convention:
  - Planning: `docs/ai/planning/feature-{name}.md`
  - Implementation (optional): `docs/ai/implementation/feature-{name}.md`

Always align test cases with acceptance criteria from the planning doc. If implementation notes are missing, treat planning as the single source of truth.

## Step 2: Scope (simple tests only)
- Focus on pure functions, small utilities, and isolated component logic.
- Test edge cases and logic branches.
- **Do NOT** write complex rendering tests, E2E flows, or integration tests requiring heavy setup.
- Keep tests simple and fast to run via command line.

## Step 3: Generate Unit Tests
- List scenarios: happy path, edge cases, error cases.
- Propose concrete test cases/snippets per main function/module.
- Ensure tests are deterministic (avoid external IO when possible).
- Focus on logic validation, not complex UI rendering or user flows.

## Step 4: Placement & Commands
- Place tests per `PROJECT_STRUCTURE.md`:
  - Colocated `*.spec.*` files with source, or
  - Under `__tests__/` mirroring source structure
- Provide run commands consistent with project:
  - Example: `npm test -- --run <pattern>` or language-specific runner
  - Ensure tests can be run individually for quick iteration
- Keep each test file small and focused.

## Step 5: Coverage Strategy (lightweight)
- Suggest coverage command if available (e.g., `npm test -- --coverage`).
- Default targets (adjust if project-specific):
  - Lines: 80%
  - Branches: 70%
- Highlight files still lacking coverage for critical paths.

## Step 6: Update Testing Doc
- Use structure from `docs/ai/testing/feature-template.md` to populate `docs/ai/testing/feature-{name}.md`.
- Fill cases/snippets/coverage notes following the template sections:
  - `## Unit Tests`
  - `## Integration Tests`
  - `## Manual Checklist`
  - `## Coverage Targets`
- Keep the document brief and actionable.
- Include run commands for quick verification.
- Ensure all required sections from template are present.

## Notes
- Tests should be simple enough to run quickly and verify logic correctness.
- Avoid complex test setup or mocking unless necessary.
- Focus on catching logic errors and edge cases, not testing frameworks or flows.
