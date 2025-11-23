# Implementation Notes: {Feature Name}

Note: All content in this document must be written in English.

## Summary

- Short description of the solution approach

## Changes

### Phase 1: [Phase Name]

- [ ] [ACTION] path/to/file (lines: x–y) — Summary of change
  ```
  Pseudo-code:
  - function/logic outline
  - key variables/state
  ```
- [ ] [ACTION] path/to/file (lines: a–b) — Summary of change
  ```
  Pseudo-code:
  - logic structure
  ```

### Phase 2: [Phase Name]

- [ ] [ACTION] path/to/file — Summary of change
  ```
  Pseudo-code:
  - ...
  ```

Notes:

- ACTION must be one of: ADDED | MODIFIED | DELETED | RENAMED
- For MODIFIED files, use sub-bullets for each distinct logic change and include line ranges.
- Pseudo-code shows logic structure and key steps, not actual implementation code.
- Each phase groups related tasks; phases execute sequentially.
- Use only one phase for small features (≤ 5 tasks); use multiple phases for larger features.

## Edge Cases

- List of handled edge cases

## Follow-ups

- TODOs or deferred work

## Execution Discipline

- Before each edit, provide a short status update describing the next action (1–3 sentences).
- Perform edits via file editing tools; avoid printing large code blocks for copy-paste.
- After each batch of edits, run linter/type/build on changed files; auto-fix issues (up to 3 attempts) before requesting review.
