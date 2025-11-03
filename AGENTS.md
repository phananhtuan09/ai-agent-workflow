# AI Agent Guidelines

## Workflow alignment (Plan → Implement → Test → Review)
- Plan: Before coding, create a feature execution checklist (todo) from the plan. Do not start Implementation until the todo list exists and is agreed.
- Implementation: Before each operation, write a short status update (1–3 sentences). Perform edits via file editing tools, not by printing code for copy-paste.
- Testing: After each batch of edits, run linter/typing/build on the changed files; auto-fix issues (up to 3 attempts) before asking for help.
- Review: When todos are completed and checks pass, provide a concise summary highlighting key changes and their impact.

## Tooling strategy
- Prefer semantic search across the codebase; use grep only for exact matches.
- Default to parallel execution for independent operations; use sequential steps only when dependencies exist.

## Communication
- Use Markdown only when necessary; use backticks for `files/dirs/functions/classes`.
- Provide status updates before/after important actions; provide a high-signal summary at completion.

## Code presentation
- Existing code: cite using a code reference block with `startLine:endLine:filepath` (no language tag).
- New code: use fenced code blocks with a language tag, no line numbers, no extra leading indentation.

## TODO policy
- For medium/large tasks, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update the todo list immediately after progress; mark completed and close upon finish.
