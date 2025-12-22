---
name: writing-test
description: Generates comprehensive test files with edge cases, parameter variations, and coverage analysis.
---

Use `docs/ai/testing/feature-{name}.md` as the source of truth.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- For medium/large tasks, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update todos immediately after progress; mark completed upon finish.
- Default to parallel execution for independent operations; use sequential steps only when dependencies exist.

## Step 1: Gather Context (minimal)

- Ask for feature name if not provided (must be kebab-case).
- **Load template:** Read `docs/ai/testing/feature-template.md` to understand required structure.
- **Load planning doc:** Read `docs/ai/planning/feature-{name}.md` for:
  - Acceptance criteria (test alignment)
  - Implementation plan (files to test)
  - Functions/components that need coverage
- **Detect test framework:** Check `package.json` to identify test framework (Vitest, Jest, Mocha, pytest, etc.). If no test runner found, create skeleton test and report missing runner.
- **Load standards:**
  - `docs/ai/project/PROJECT_STRUCTURE.md` for test file placement rules
  - `docs/ai/project/CODE_CONVENTIONS.md` for coding standards

**Source of truth:** Planning doc acceptance criteria + actual source code implementation.

## Step 2: Scope (logic and component tests only)

- **Focus on:**
  - Pure function logic: test with various input parameters (happy path, edge cases, invalid inputs)
  - Component logic: test component behavior with different props/parameters (without complex rendering)
  - Utility functions: test return values, error handling, boundary conditions
  - Parameter variations: systematically test different combinations of parameters
  - Edge cases: null, undefined, empty values, boundary values
  - Error handling: invalid inputs, exceptions, error messages
  - Type safety: type mismatches, missing properties, contract violations
  - Property-based testing: mathematical properties (commutativity, associativity, idempotency)
- **DO NOT write:**
  - Integration tests between multiple modules/services (requires heavy setup)
  - Complex UI rendering tests requiring heavy DOM setup
  - E2E flows or end-to-end user journey tests
  - Tests requiring external API calls, database connections, or network mocking
  - Performance/load testing
- **Dependency isolation (mocking):**
  - Mock external dependencies (API clients, database connections, file system)
  - Mock imported utilities/hooks if they have side effects
  - Keep internal logic unmocked (test actual implementation)
  - Use test framework's mocking utilities (vi.mock, jest.mock, unittest.mock)
- Keep tests simple, fast, and deterministic.

## Step 3: Analyze Code & Generate Tests (automatic)

**Analyze implementation:**
- Read files from `docs/ai/implementation/feature-{name}.md` or scan source
- Identify functions/components: signatures, parameters, return types, exceptions
- Map: input types → expected outputs → edge cases → error cases

**Generate test files:**
- Create test file per `PROJECT_STRUCTURE.md` (colocated `*.spec.*` or `__tests__/`)
- Follow naming conventions from `CODE_CONVENTIONS.md`

**Test coverage strategy:**
- **Happy path**: normal parameters → expected output
- **Edge cases**: null, undefined, empty, boundaries (min/max, 0, -1)
- **Parameter combinations**: systematically test input variations
- **Error handling**: invalid inputs, exceptions, error messages
- **Type safety**: wrong types, missing properties
- **Property-based** (if applicable): commutativity, associativity, idempotency

**For complex test suites (>15 test cases):**
- Use Task tool with `subagent_type='general-purpose'`
- Task prompt: "Generate comprehensive test cases for [function] covering happy path, edge cases, error handling, and parameter combinations"

## Step 4: Run Tests with Logging (automatic)

**Execute test command** (non-interactive):
- Vitest: `npx vitest run --passWithNoTests`
- Jest: `npx jest --ci --passWithNoTests`
- Mocha: `npx mocha --reporter spec`
- pytest: `pytest -v --tb=short`

**Display output:**
- Test execution progress and results (pass/fail, timing)
- Test summary (total/passed/failed/skipped)
- Error messages and stack traces for failures
- Coverage report (lines, branches, functions %)

**If tests fail:**
- Analyze failure reason (test logic vs implementation bug)
- **Fix test logic** if test expectations are incorrect
- **Report implementation bug** if source code violates acceptance criteria (do NOT auto-fix source code)
- Re-run tests after fixing test logic
- Update testing doc with results

## Step 5: Coverage Gap Analysis (automatic)

**Analyze coverage report:**
- Identify untested branches/lines/functions

**Generate additional tests:**
- Create test cases for uncovered branches/lines/functions
- Re-run tests with coverage
- Verify targets met (default: 80% lines, 70% branches)
- Continue until targets met or all practical cases covered

## Step 6: Update Testing Doc

Use structure from `docs/ai/testing/feature-template.md` to populate `docs/ai/testing/feature-{name}.md`.

Fill with:

- **Test Files Created**: List all test files generated with paths
- **Test Cases Summary**: Brief summary of what was tested (function/component + key scenarios)
  - Happy path scenarios
  - Edge cases covered
  - Parameter variations tested
  - Error scenarios handled
  - Property-based tests (if any)
- **Run Command**: Command to execute tests
- **Last Run Results**: Summary of test execution
  - Total/passed/failed count
  - Coverage percentages (lines, branches, functions)
  - Any notable findings or issues
- **Coverage Targets**: Coverage goals and current status

Ensure all required sections from template are present. Keep the document brief and actionable.

## Step 7: Verify Tests Pass

- Ensure all generated tests pass successfully
- Ensure coverage targets are met (default: 80% lines, 70% branches)
- If any test fails:
  - Debug test logic and fix test expectations
  - **OR** report implementation bug to user (if source code violates acceptance criteria)
- Re-run tests after fixing test logic

## Notes

- Tests should be simple enough to run quickly and verify logic correctness
- Focus on catching logic errors and edge cases through systematic parameter variation
- Avoid complex test setup or mocking unless necessary for logic isolation
- All tests must be automatically runnable via command line
- Test execution must show clear, detailed logging in terminal
- AI excels at: edge case generation, parameter combinations, property-based testing, coverage analysis
- Keep tests deterministic (avoid external dependencies, random values without seeds, time-dependent logic)

**Scope boundaries:**
- **Creates:** Test files only (*.spec.*, *.test.*)
- **Modifies:** Test files only when fixing test logic
- **Does NOT edit:** Non-test source files (implementation code)
- **If implementation bug found:** Report to user; do NOT auto-fix source code
- Idempotent: safe to re-run; updates test doc deterministically
