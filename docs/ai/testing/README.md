---
phase: testing
title: Testing Documentation
description: Feature test plans and testing guidelines
---

# Testing Documentation

## Purpose
This directory contains test plans for individual features. These docs focus on simple, fast-running tests to verify logic correctness.

## Testing Workflow

### Creating Test Plans
Use the `writing-test` command to generate test plans:
- Command: `.cursor/commands/writing-test.md`
- Output: `docs/ai/testing/feature-{name}.md`
- Template: `docs/ai/testing/feature-template.md`

### Test Plan Structure
Each test plan follows the template structure:
- **Unit Tests**: Simple test cases for functions/components
  - Happy path scenarios
  - Edge cases
  - Error cases
- **Integration Tests**: Simple component interaction tests (if needed)
- **Manual Checklist**: Steps for manual verification
- **Coverage Targets**: Coverage goals and gaps

### Testing Philosophy
- **Focus**: Pure functions, small utilities, isolated component logic
- **Speed**: Tests must run quickly via command line
- **Simplicity**: Avoid complex rendering tests, E2E flows, or heavy setup
- **Purpose**: Catch logic errors and edge cases, not test frameworks

### Coverage Targets
Default targets (adjust if project-specific):
- Lines: 80%
- Branches: 70%

## Template Reference
See `feature-template.md` for the exact structure required for test plans.

## Related Documentation
- Planning docs: `../planning/`
- Implementation notes: `../implementation/`
- Project standards: `../project/`

---

**Note**: For complex E2E tests, performance testing, or bug tracking strategies, document these separately or in project-level documentation.
