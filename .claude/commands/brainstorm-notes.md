---
name: brainstorm-notes
description: Format and save an idea as a brainstorm note linked to its daily-notes source.
---

## Folder Structure

```
{BASE_DIR}/
  daily-notes/   ← source files (linked, not read)
  brainstorm/    ← Claude creates files here
```

**Default BASE_DIR (cross-platform):**
- Linux: `~/Documents/obsidian-dev`
- macOS: `~/Desktop/obsidian-dev`
- Windows: `%USERPROFILE%\\Documents\\obsidian-dev`

**Override in prompt:**
```
/brainstorm-notes dir folder: ~/source_code | {content}
```

---

## Goal

Receive idea content from the user, format it for readability without changing the substance, and save it as a brainstorm note linked to the originating daily-notes file.

---

## Step 1: Resolve BASE_DIR

Check if user specified `dir folder:` in prompt → use that path.

If not → detect OS:
```bash
uname -s  # Darwin  → ~/Desktop/obsidian-dev
          # Linux   → ~/Documents/obsidian-dev
          # Windows → %USERPROFILE%\Documents\obsidian-dev
```

Create dir if not exists:
```bash
mkdir -p {BASE_DIR}/brainstorm
```

---

## Step 2: Parse Prompt Input

Extract from the user's prompt:

- **Content**: the idea text the user provided (everything that is not a flag)
- **Source date** (optional): if user wrote `date: YYYY-MM-DD` → use it; otherwise default to today

**Examples:**
```
/brainstorm-notes build a CLI tool that syncs obsidian with github
/brainstorm-notes date: 2026-04-03 | thử dùng AI để tự động tóm tắt meeting notes
```

---

## Step 3: Determine Output File

Default: `{BASE_DIR}/brainstorm/{today}.md`

If file already exists → append (do not overwrite).

---

## Step 4: Format the Content

Reformat the user's idea for readability:
- Fix punctuation and line breaks if needed
- Use bullet points if the idea has multiple parts
- **Do not change wording, add interpretation, or expand the idea**
- Keep the user's original language (Vietnamese/English as written)

---

## Step 5: Write Brainstorm Entry

Append to `{BASE_DIR}/brainstorm/{today}.md`:

```markdown
---

### {title — first ~6 words of idea as heading}

Source: [[daily-notes/{source-date}]]

{formatted idea content}
```

**If file is new**, prepend a header first:

```markdown
---
created: {today}
status: raw
---

## Brainstorm — {today}

> Raw ideas linked to daily notes. Not yet specs.
```

---

## Step 6: Confirm

```
✓ Saved to: {BASE_DIR}/brainstorm/{today}.md

  Source: [[daily-notes/{source-date}]]
  Idea:   {first ~10 words}...

  When ready to develop:
    /requirements-orchestrator → full requirements
    /create-plan               → skip straight to planning
```
