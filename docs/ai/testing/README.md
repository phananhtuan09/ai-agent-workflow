---
phase: testing
title: Testing Documentation
description: Feature test plans and testing guidelines
---

# Testing Documentation

## Purpose
This directory contains test plans for individual features. These docs focus on simple, fast-running tests to verify logic correctness. Tests are automatically generated and executed by AI agents.

## Testing Workflow

### Creating Test Plans
Use the `writing-test` command to generate test plans and test code:
- Command: `.cursor/commands/writing-test.md`
- Output: `docs/ai/testing/feature-{name}.md`
- Template: `docs/ai/testing/feature-template.md`

### Automatic Test Generation
The `writing-test` command automatically:
1. **Analyzes code** from implementation notes or source files
2. **Generates test code** with comprehensive test cases:
   - Happy path scenarios
   - Edge cases (null, undefined, empty, boundaries)
   - Parameter combinations
   - Error handling
   - Type safety checks
   - Property-based tests (when applicable)
3. **Runs tests** automatically with detailed logging
4. **Analyzes coverage** and generates additional tests to fill gaps
5. **Updates test documentation** with results and coverage

### Test Plan Structure
Each test plan follows the template structure:
- **Test Files Created**: List of all generated test files
- **Unit Tests**: Test cases organized by function/component
  - Happy path scenarios
  - Edge cases (null, undefined, empty, boundaries)
  - Parameter variations
  - Error cases
  - Type safety checks
  - Property-based tests
- **Run Command**: Command to execute tests
- **Last Run Results**: Test execution summary with coverage
- **Coverage Targets**: Coverage goals and current status

### Testing Philosophy
- **Focus**: Pure functions, small utilities, isolated component logic, parameter variations
- **Speed**: Tests must run quickly via command line
- **Simplicity**: Avoid complex rendering tests, E2E flows, or heavy setup
- **Purpose**: Catch logic errors and edge cases through systematic testing
- **Automation**: AI agents excel at generating comprehensive test cases and running them automatically

### Test Types (AI Agent Strengths)
AI agents excel at automatically generating:
1. **Logic Testing**: Function behavior with various parameters
2. **Edge Cases**: Null, undefined, empty, boundary values systematically
3. **Parameter Combinations**: Cartesian products and systematic variations
4. **Error Handling**: Invalid inputs, exceptions, error messages
5. **Type Safety**: Type mismatches, missing properties, contract violations
6. **Property-Based Testing**: Mathematical properties (commutativity, associativity, idempotency)
7. **Coverage Analysis**: Identifying and filling coverage gaps
8. **Regression Testing**: Test generation from code changes and bug reports

### Test Types (Not in Scope)
The workflow focuses on simple, fast tests. Complex tests should be handled separately:
- Integration tests between multiple services (requires heavy setup)
- Complex UI rendering tests (requires heavy DOM setup)
- E2E flows or end-to-end user journey tests
- Performance/load testing
- Tests requiring external API calls or database connections

### Coverage Targets
Default targets (adjust if project-specific):
- Lines: 80%
- Branches: 70%
- Functions: 90%

Coverage is automatically analyzed and gaps are filled by generating additional tests.

## Template Reference
See `feature-template.md` for the exact structure required for test plans.

## Related Documentation
- Planning docs: `../planning/`
- Implementation notes: `../implementation/`
- Project standards: `../project/`

---

**Note**: For complex E2E tests, performance testing, or bug tracking strategies, document these separately or in project-level documentation. The `writing-test` command focuses on automated, logic-focused testing that AI agents excel at.
