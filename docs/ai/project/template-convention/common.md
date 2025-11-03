# CODE_CONVENTIONS Common Rules (Template Preload)

> These rules are preloaded by the standards generator before analyzing the codebase. They establish non-negotiable, high-signal conventions. The generator should merge these rules first, then append auto-discovered patterns.

## Naming — Clarity & Descriptiveness
- Prefer meaningful, verbose names over abbreviations.
- Avoid 1–2 character identifiers (except conventional counters in very small scopes).

## Control Flow
- Prefer guard clauses (early returns) to reduce nesting depth.
- Handle errors and edge cases first.
- Avoid deep nesting beyond 2–3 levels.

## Error Handling
- Throw errors with clear, actionable messages.
- Do not catch errors without meaningful handling.

## Comments
- Add comments only for complex or non-obvious logic; explain "why", not "how".
- Place comments above code blocks or use language-specific docstrings.
- Avoid trailing inline comments.

## Formatting
- Match existing repository formatting tools and styles.
- Prefer multi-line over long one-liners or complex ternaries.
- Wrap long lines and do not reformat unrelated code.

## Types (for statically typed languages)
- Explicitly annotate public APIs and function signatures.
- Avoid unsafe casts or overly broad types (e.g., `any`).

## Change Discipline
- Perform changes via file editing tools; avoid pasting large code blobs in reviews.
- Re-read target files before editing to ensure accurate context.
- After edits, run only fast, non-interactive validation on changed files:
  - If ESLint is configured, run ESLint on changed paths (e.g., `eslint --max-warnings=0 <changed-paths>`). Use `--fix` when safe to auto-fix.
  - If TypeScript is used, run type-check only (e.g., `tsc --noEmit` or `tsc -p . --noEmit`).
  - Do NOT run Prettier as part of validation (formatting is enforced separately by tooling/CI).
  - Do NOT run full build or dev server (to avoid unnecessary time cost).
  - Attempt auto-fixes up to 3 times for linter issues before requesting help.

