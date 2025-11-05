## Goal
Initialize a new chat by loading and aligning to `AGENTS.md` so the AI agent consistently follows project rules (workflow, tooling, communication, language mirroring) from the first message.

## What this command does
1. Read `AGENTS.md` and extract the actionable rules.
2. Summarize responsibilities and constraints the agent must follow in this session.
3. Confirm language-mirroring: respond in the user's chat language; default to English if the user's language is unclear or ambiguous.
4. Acknowledge the 4-phase workflow and TODO discipline for future commands.

## Steps
1) Open and read `AGENTS.md` (project root).
2) Detect project languages/frameworks/libraries from repository metadata (e.g., `package.json`, `pyproject.toml`, lockfiles, config files). Update `docs/ai/project/CODE_CONVENTIONS.md` to include any missing key coding conventions (only important items like React, TypeScript, TailwindCSS, etc.).
3) Read files in `docs/ai/project/` to understand project context and standards.
4) Produce a short confirmation in the chat including:
   - Workflow alignment: Plan → Implement → Test → Review
   - Tooling strategy: semantic search first; parallelize independent steps
   - Communication: minimal Markdown; status updates; high-signal summaries; mirror user language (default English if unclear)
   - Code presentation: code references for existing code; fenced blocks for new code
   - TODO policy: create/update todos; keep only one `in_progress`
5) If any section is missing or unclear, ask a single concise clarification question; otherwise proceed silently in future commands.

## Output format (concise)
- Use the language of the triggering user message (mirror). If ambiguous, use English.
- One short paragraph confirming alignment + a 4–6 bullet checklist of the above items.
- No code unless strictly needed.

## Notes
- This command is idempotent—safe to re-run at the start of any chat.
- It does not modify files; it only sets expectations for subsequent commands.

