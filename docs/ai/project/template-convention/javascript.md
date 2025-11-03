# JavaScript Conventions (Essential)

## Language
- Use ES Modules (`import`/`export`).
- Prefer `const` (default) and `let`; avoid `var`.
- Use strict equality `===`/`!==`.
- Prefer optional chaining `?.` and nullish coalescing `??` over `||` when `0/''/false` are valid values.

## Functions & Data
- Keep functions small and single-purpose.
- Avoid mutations; prefer immutable updates for objects/arrays.
- Return early (guard clauses) to reduce nesting.

## Errors & Async
- Use `async/await`; avoid unhandled promises (no floating promises).
- Throw Errors with clear messages; catch only to handle meaningfully.

## Style & Safety
- Avoid implicit globals; module scope only.
- Prefer explicit returns over side effects.
- Keep imports minimal and ordered (std/third-party/internal).

