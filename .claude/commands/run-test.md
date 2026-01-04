---
name: run-test
description: Executes tests based on test documentation files with summary report.
---

## Goal

Execute tests defined in `docs/ai/testing/` documentation files and provide a summary report.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- For medium/large tasks, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update todos immediately after progress; mark completed upon finish.

## Step 1: Ask Test Type

**Tool:** AskUserQuestion

Ask user which test type to run:

```
Question: Which test type do you want to run?
Options:
  1. Unit tests (from /writing-test)
  2. Integration tests (from /writing-integration-test)
  3. Both
```

## Step 2: Ask for Test Doc File

**Tool:** AskUserQuestion (if not provided as argument)

If user did not provide test doc file path:

1. List available test docs based on selected type:
   - Unit tests: `docs/ai/testing/unit-*.md`
   - Integration tests: `docs/ai/testing/integration-*.md`
   - Both: all `unit-*.md` and `integration-*.md` files

2. Ask user to select which test doc(s) to run:
   ```
   Question: Which test doc do you want to run?
   Options: [list discovered files]
   ```

## Step 3: Parse Test Doc for Test Files

**Tool:** Read(file_path=selected_test_doc)

Read the test documentation file and extract:

- **Test Files Created** section: list of test file paths
- **Run Command** section: command to execute tests

**Expected format in test doc:**
```markdown
## Test Files Created
- `tests/unit/test-file.spec.ts` - Description
- `tests/unit/another-test.spec.ts` - Description

## Run Command
```bash
npx vitest run tests/unit/test-file.spec.ts
```
```

**Robust file path extraction:**
Use flexible parsing to handle various formatting:
- With backticks: `- \`tests/unit/file.spec.ts\` - Description`
- Without backticks: `- tests/unit/file.spec.ts - Description`
- With or without description: `- tests/unit/file.spec.ts`
- Different list markers: `- `, `* `, `1. `

**Regex patterns for extraction:**
```
# Pattern 1: With backticks
`([^`]+\.(?:spec|test|e2e\.spec)\.[jt]sx?)`

# Pattern 2: Without backticks (path followed by space-dash or end of line)
(?:^[-*\d.]\s*)([^\s`]+\.(?:spec|test|e2e\.spec)\.[jt]sx?)(?:\s|$)
```

**Fallback parsing:**
- If regex fails, look for any path containing `tests/unit/` or `tests/integration/`
- Extract file paths that end with `.spec.ts`, `.test.ts`, or `.e2e.spec.ts`

**Validate extracted files:**
- Check each file exists before running
- Report missing files to user (do not fail silently)

## Step 4: Execute Tests

**Tool:** Bash

Run only the test files listed in the test doc:

**For Unit Tests (Vitest/Jest):**
```bash
# Vitest
npx vitest run tests/unit/[file1] tests/unit/[file2] ...

# Jest
npx jest tests/unit/[file1] tests/unit/[file2] ...
```

**For Integration Tests (Playwright):**
```bash
npx playwright test tests/integration/[file1] tests/integration/[file2] ...
```

**Execution rules:**
- Only run files explicitly listed in the test doc
- Do NOT run entire test suite
- Capture stdout/stderr for report

## Step 5: Generate Summary Report

After test execution, provide a summary report:

```markdown
## Test Execution Report

### Test Doc
- File: `docs/ai/testing/unit-{name}.md`
- Type: Unit / Integration

### Files Tested
- `tests/unit/test1.spec.ts` - ✓ Passed / ✗ Failed
- `tests/unit/test2.spec.ts` - ✓ Passed / ✗ Failed

### Results Summary
- Total Tests: X
- Passed: Y
- Failed: Z
- Skipped: W
- Duration: Xs

### Coverage (if available)
- Lines: X%
- Branches: Y%
- Functions: Z%

### Failed Tests (if any)
1. `test name` in `file.spec.ts`
   - Error: [error message]
   - Expected: [expected value]
   - Received: [actual value]

### Recommendations
- [Any follow-up actions needed]
```

## Step 6: Update Test Doc (optional)

If user confirms, update the test doc with latest results:

**Tool:** Edit(file_path=test_doc)

Update "Last Run Results" section with:
- Date/time of run
- Pass/fail counts
- Coverage percentages
- Any new issues found

## Notes

- This command only runs tests listed in test documentation
- Does NOT discover or run tests outside the specified doc
- Provides focused execution for feature-specific testing
- Use `/writing-test` or `/writing-integration-test` to generate test docs first

**Test type detection:**
- `unit-*.md` → Unit tests in `tests/unit/` (Vitest/Jest)
- `integration-*.md` → Integration tests in `tests/integration/` (Playwright)

**If both types selected:**
1. Run unit tests first
2. Run integration tests second
3. Combine results in single report
