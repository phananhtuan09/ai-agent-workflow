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

Ask user which test type to run:
1. Unit tests (from /writing-test)
2. Integration tests (from /writing-integration-test)
3. Both

## Step 2: Ask for Test Doc File

If user did not provide test doc file path:
1. List available test docs based on selected type
2. Ask user to select which test doc(s) to run

## Step 3: Parse Test Doc for Test Files

Read the test documentation file and extract:
- **Test Files Created** section: list of test file paths
- **Run Command** section: command to execute tests

## Step 4: Execute Tests

Run only the test files listed in the test doc:

**For Unit Tests (Vitest/Jest):**
```bash
npx vitest run tests/unit/[files...]
```

**For Integration Tests (Playwright):**
```bash
npx playwright test tests/integration/[files...]
```

## Step 5: Generate Summary Report

```markdown
## Test Execution Report

### Test Doc
- File: `docs/ai/testing/unit-{name}.md`
- Type: Unit / Integration

### Files Tested
- `tests/unit/test1.spec.ts` - ✓ Passed / ✗ Failed

### Results Summary
- Total Tests: X
- Passed: Y
- Failed: Z
- Duration: Xs

### Coverage (if available)
- Lines: X%
- Branches: Y%
- Functions: Z%

### Failed Tests (if any)
1. `test name` in `file.spec.ts`
   - Error: [error message]

### Recommendations
- [Any follow-up actions needed]
```

## Step 6: Update Test Doc (automatic)

Update the test doc with latest results:
- Date/time of run
- Pass/fail counts
- Coverage percentages

## Notes

- This command only runs tests listed in test documentation
- Does NOT discover or run tests outside the specified doc
- Use `/writing-test` or `/writing-integration-test` to generate test docs first
