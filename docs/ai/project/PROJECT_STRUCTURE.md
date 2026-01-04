# Project Structure

> This document can be auto-generated via `generate-standards`. Edit manually as needed.

## Folders
- src/: source code
- tests/: all test files
  - unit/: unit test files (`*.spec.ts`, `*.test.ts`)
  - integration/: integration/E2E test files (`*.e2e.spec.ts`)
- docs/ai/project/: project docs (structure, conventions, patterns)
- docs/ai/planning/: feature plans
- docs/ai/implementation/: implementation notes per feature
- docs/ai/testing/: test plans per feature
  - `unit-{name}.md`: unit test docs (created by `/writing-test`)
  - `integration-{name}.md`: integration test docs (created by `/writing-integration-test`)

## Design Patterns (in use)
- Pattern A: short description + when to use
- Pattern B: short description + when to use

## Test Configuration

> This section is used by `/writing-test`, `/writing-integration-test`, and `/run-test` commands.
> Run `/generate-standards` to auto-detect and populate this section.

### Unit Tests
- Framework: [Vitest/Jest/Mocha/pytest/etc.]
- Run command: `[npm test / npx vitest run / pytest / etc.]`
- Config file: [vitest.config.ts / jest.config.js / pytest.ini / none]
- Test location: `tests/unit/`
- File pattern: `*.spec.ts` or `*.test.ts`

### Integration Tests
- Framework: [Playwright/Cypress/etc.]
- Run command: `npx playwright test`
- Config file: `playwright.config.ts`
- Test location: `tests/integration/`
- File pattern: `*.e2e.spec.ts`

## Notes
- Import/module conventions
- Config & secrets handling (if applicable)

## AI Docs Roles (existing only)
- `docs/ai/project/`: repository-wide conventions and structure; workflow overview and navigation live in `README.md`.
- `docs/ai/planning/`: feature plans using `feature-template.md` with Acceptance Criteria; plans should drive a todo checklist before coding.
- `docs/ai/implementation/`: per-feature implementation notes tracking what changed and why.
- `docs/ai/testing/`: test plans and results
  - `unit-{name}.md`: unit test docs (from `/writing-test`)
  - `integration-{name}.md`: integration test docs (from `/writing-integration-test`)
  - Run tests via `/run-test` command

## Guiding Questions (for AI regeneration)
- How is the codebase organized by domain/feature vs layers?
- What are the module boundaries and dependency directions to preserve?
- Which design patterns are officially adopted and where?
- Where do configs/secrets live and how are they injected?
- What is the expected test file placement and naming?
- Any build/deployment constraints affecting structure (monorepo, packages)?

