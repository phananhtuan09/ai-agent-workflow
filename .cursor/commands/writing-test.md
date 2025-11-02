Use `docs/ai/testing/feature-{name}.md` as the source of truth.

## Step 1: Gather Context (minimal)
- Ask for feature name if not provided (must be kebab-case).
- **Load template:** Read `docs/ai/testing/feature-template.md` to understand required structure.
- Then locate docs by convention:
  - Planning: `docs/ai/planning/feature-{name}.md`
  - Implementation (optional): `docs/ai/implementation/feature-{name}.md`
- **Detect test framework:** Check `package.json` and project structure to identify test framework (Vitest, Jest, Mocha, pytest, etc.)
- **Load standards:** Read `docs/ai/project/PROJECT_STRUCTURE.md` for test file placement rules
- **Load conventions:** Read `docs/ai/project/CODE_CONVENTIONS.md` for coding standards

Always align test cases with acceptance criteria from the planning doc. If implementation notes are missing, treat planning as the single source of truth.

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
- Keep tests simple, fast, and deterministic.

## Step 3: Analyze Code to Test
Read implementation files from `docs/ai/implementation/feature-{name}.md` or scan source code files:
- Identify all functions/components that need testing:
  - List each function with its signature (parameters, return type, exceptions)
  - List each component with its props interface
  - List each class with its methods and properties
- For each function/component, identify:
  - Input parameter types and possible values
  - Expected outputs for different inputs
  - Edge cases (null, undefined, empty, boundaries, min/max values)
  - Error cases (invalid inputs, exceptions, error messages)
  - Control flow branches (if/else, switch cases, loops)
  - Mathematical properties (if applicable): commutativity, associativity, idempotency, invariants

## Step 4: Generate Test Code (automatic)
For each function/component identified:

1. **Create test file** according to `PROJECT_STRUCTURE.md`:
   - Colocated `*.spec.*` or `*.test.*` files with source, OR
   - Under `__tests__/` or `tests/` mirroring source structure
   - Follow naming conventions from `CODE_CONVENTIONS.md`

2. **Write complete test code** with:
   - Test framework setup (imports, describe blocks, test utilities)
   - Multiple test cases per function/component:
     - **Happy path**: normal parameters → expected output
     - **Edge cases**: empty/null/undefined inputs, boundary values (min/max, 0, -1, empty strings/arrays)
     - **Parameter combinations**: systematically test different combinations of parameters (cartesian product when practical)
     - **Error cases**: invalid inputs, exceptions, error messages
     - **Type safety**: wrong types, missing properties, extra properties
     - **Property-based**: verify mathematical properties if applicable
   - Clear, descriptive test names describing what is being tested
   - Assertions using appropriate test framework syntax

3. **Focus on logic testing:**
   - For functions: test return values, side effects (if any), error handling
   - For components: test output/logic with different props (avoid complex rendering - use lightweight snapshots or logic checks)
   - For classes: test methods independently with various inputs
   - Test parameter combinations systematically

4. **Generate edge cases systematically:**
   - For each parameter, generate: null, undefined, empty, zero, negative, max/min values
   - Test type mismatches: wrong types, missing required properties
   - Test boundary conditions: off-by-one errors, overflow/underflow

5. **Property-based testing (when applicable):**
   - Identify mathematical/algorithmic properties
   - Generate property-based tests: commutativity, associativity, idempotency, invariants
   - Test with random inputs following constraints

**Example test structure:**
```javascript
import { describe, it, expect } from 'vitest';
import { functionToTest } from './source-file';

describe('functionToTest', () => {
  it('should return correct value with normal parameters', () => {
    // Test with standard inputs
  });
  
  it('should handle edge case with empty input', () => {
    // Test boundary
  });
  
  it('should handle null input', () => {
    // Test null handling
  });
  
  it('should handle different parameter combinations', () => {
    // Test various param combinations
  });
  
  it('should throw error with invalid input', () => {
    // Test error handling
  });
  
  it('should maintain idempotency property', () => {
    // Property-based test
  });
});
```

## Step 5: Run Tests with Logging (automatic)
After generating test code:

1. **Execute test command** based on detected framework:
   - Vitest: `npm test` or `npx vitest run`
   - Jest: `npm test` or `npx jest`
   - Mocha: `npm test` or `npx mocha`
   - pytest: `pytest` or `python -m pytest`
   - Other: detect from `package.json` scripts

2. **Capture and display output** in terminal with detailed logging:
   - Show test execution progress (which tests are running)
   - Show test results (pass/fail) for each test case with execution time
   - Show test summary (total tests, passed, failed, skipped)
   - Show any error messages, stack traces, or assertion failures for failures
   - Show coverage report if available (lines, branches, functions coverage)
   - Format output clearly for readability

3. **Log format example:**
   ```
   === Running tests for feature: {name} ===
   
   RUN  test-file-1.spec.js
     ✓ should handle normal case (2ms)
     ✓ should handle edge case (1ms)
     ✗ should handle invalid input (3ms)
       
       Error: Expected error to be thrown
       at test-file-1.spec.js:25
       
     ✓ should handle parameter combinations (5ms)
     ✓ should maintain property (1ms)
   
   Test Files:  1 passed | 0 failed | 1 total
   Tests:       4 passed | 1 failed | 5 total
   Time:        0.012s
   
   Coverage:
   - Lines: 82% (lines covered / total lines)
   - Branches: 75% (branches covered / total branches)
   - Functions: 90% (functions covered / total functions)
   ```

4. **If tests fail:**
   - Analyze failure reason from logs
   - Fix test code or implementation as needed
   - Re-run tests until all pass
   - Update implementation doc if code changes were needed

## Step 6: Coverage Gap Analysis (automatic)
After initial test generation and execution:

1. **Analyze coverage report:**
   - Identify untested branches/conditions
   - Identify untested lines/paths
   - Identify untested functions/methods

2. **Generate additional tests automatically:**
   - For each uncovered branch: create test case
   - For each uncovered line: ensure it's reachable by existing tests or add new test
   - For each uncovered function: create test cases

3. **Re-run tests and verify coverage:**
   - Execute tests again with coverage
   - Verify coverage targets are met (default: 80% lines, 70% branches)
   - Continue generating tests until targets are met or all practical cases are covered

## Step 7: Update Testing Doc
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

## Step 8: Verify Tests Pass
- Ensure all generated tests pass successfully
- Ensure coverage targets are met (default: 80% lines, 70% branches)
- If any test fails, debug and fix issues
- Update implementation doc if code changes were needed
- Re-run tests to confirm fixes

## Notes
- Tests should be simple enough to run quickly and verify logic correctness
- Focus on catching logic errors and edge cases through systematic parameter variation
- Avoid complex test setup or mocking unless necessary for logic isolation
- All tests must be automatically runnable via command line
- Test execution must show clear, detailed logging in terminal
- AI excels at: edge case generation, parameter combinations, property-based testing, coverage analysis
- Keep tests deterministic (avoid external dependencies, random values without seeds, time-dependent logic)
