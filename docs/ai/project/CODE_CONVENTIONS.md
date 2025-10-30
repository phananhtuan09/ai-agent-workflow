# Code Conventions

> This document can be auto-generated via `generate-standards`. Edit manually as needed.

## Naming
- camelCase: variables, functions
- PascalCase: classes, types
- CONSTANT_CASE: constants

## Structure
- One primary concept per file
- Prefer functions < 50 lines; refactor into helpers when needed

## Error Handling & Logging
- Throw errors with clear messages
- Use appropriate log levels: debug/info/warn/error

## Tests
- Write unit tests first; add integration tests when necessary
- Test names should describe behavior

## Comments
- Only for complex logic or non-obvious decisions

## Guiding Questions (for AI regeneration)
- What languages/frameworks are used, and do they impose naming/structure patterns?
- What are the preferred file/module boundaries for this project?
- What error handling strategy is standard (exceptions vs result types), and logging levels?
- What is the minimum test level required per change (unit/integration/E2E)?
- Are there performance/security constraints that influence coding style?
- Any repository-wide conventions (imports order, lint rules, formatting tools)?
