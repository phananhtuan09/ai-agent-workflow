---
name: brainstorm-notes
description: Format and save a raw idea as a brainstorm note linked to its source daily note in an Obsidian style workspace. Use when the user wants to capture idea text into a brainstorm file, override the base folder, or set a source note date.
---

# Brainstorm Notes

Save user-provided idea text into `{BASE_DIR}/brainstorm/{today}.md` and link it back to `daily-notes/{source-date}.md`. Reformat only for readability and do not change the substance, language, or intent.

## Workspace Layout

```text
{BASE_DIR}/
  daily-notes/
  brainstorm/
```

Default `BASE_DIR`:
- Linux: `~/Documents/obsidian-dev`
- macOS: `~/Desktop/obsidian-dev`
- Windows: `%USERPROFILE%\\Documents\\obsidian-dev`

Prompt overrides:
- `dir folder: <path>`
- `date: YYYY-MM-DD`

## Workflow

### 1. Resolve `BASE_DIR`

- If the prompt includes `dir folder:`, use that path.
- Otherwise detect the OS and map to the default path above.
- Create `{BASE_DIR}/brainstorm` if it does not exist.

Useful commands:
- `uname -s`
- `mkdir -p "{BASE_DIR}/brainstorm"`

### 2. Parse Prompt Input

- Treat everything that is not part of a recognized flag as idea content.
- If the prompt includes `date: YYYY-MM-DD`, use that as `source-date`.
- Otherwise default `source-date` to today.
- Use today for the output file name even if `source-date` is earlier.

Example prompts:
- `Use $brainstorm-notes to save this idea: build a CLI tool that syncs Obsidian with GitHub`
- `Use $brainstorm-notes dir folder: ~/source_code date: 2026-04-03 | try AI summaries for meeting notes`

### 3. Determine the Output File

- Resolve `today` with `date +%Y-%m-%d`.
- Write to `{BASE_DIR}/brainstorm/{today}.md`.
- If the file already exists, append. Never overwrite.

### 4. Reformat the Idea Content

- Fix punctuation, spacing, and line breaks when needed.
- Use bullets only when the idea clearly contains multiple parts.
- Preserve the user's original language exactly as written.
- Do not interpret, expand, summarize, or rewrite the idea beyond readability cleanup.

### 5. Write the Brainstorm Entry

If the file is new, prepend:

```markdown
---
created: {today}
status: raw
---

## Brainstorm - {today}

> Raw ideas linked to daily notes. Not yet specs.
```

Then append:

```markdown
---

### {title}

Source: [[daily-notes/{source-date}]]

{formatted idea content}
```

Title rules:
- Derive the heading from the first roughly 6 words of the idea.
- Clean up capitalization and punctuation only if needed for readability.

### 6. Confirm the Result

Return a short confirmation in this shape:

```text
Saved to: {BASE_DIR}/brainstorm/{today}.md

Source: [[daily-notes/{source-date}]]
Idea:   {first ~10 words}...

Suggested next steps:
- $requirements-orchestrator for full requirements
- $create-plan for direct planning
```
