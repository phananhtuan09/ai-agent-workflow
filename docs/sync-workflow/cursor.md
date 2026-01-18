# Cursor Sync Guide

Sync Claude Code workflows to Cursor format.

---

## Prerequisites

- Source: `.claude/commands/*.md`, `.claude/skills/**/SKILL.md`
- Target: `.cursor/commands/*.md`, `.cursor/rules/`

---

## Step 1: Fetch Cursor Documentation

**Search queries (try in order until successful):**
1. `"cursor.com" rules for ai custom commands documentation`
2. `site:docs.cursor.com rules commands`
3. `cursor ai editor custom rules commands format`

**Key documentation URLs:**
- `https://docs.cursor.com/context/rules-for-ai`
- `https://docs.cursor.com/context/rules`
- `https://docs.cursor.com/chat/custom-modes`

**Extract and note:**
- Command file location: `.cursor/commands/` or `.cursor/rules/`
- File format: frontmatter structure, markdown body
- Supported frontmatter fields (name, description, etc.)
- Any special syntax or features (variables, context references)
- AGENTS.md support and location

---

## Step 2: Conversion Rules

### Commands (`.cursor/commands/*.md`)

**Frontmatter:**
- Keep `name` and `description`
- Adjust other fields per Cursor docs

**Tool references conversion:**
| Claude Code | Cursor |
|-------------|--------|
| `AskUserQuestion(...)` | Ask user |
| `Task(subagent_type='Explore')` | Workspace search |
| `Read(file_path=...)` | Read file |
| `Write(file_path=...)` | Write file |
| `Edit(file_path=...)` | Edit file |
| `Glob(pattern=...)` | Find files |
| `Grep(pattern=...)` | Search content |
| `Bash(command=...)` | Run command |

**Skill references:**
- Convert `.claude/skills/...` → `.cursor/rules/...` or inline

**Keep:** Goal, Steps, Notes sections structure

### Skills → Rules (`.cursor/rules/`)

Convert Claude skills to Cursor rules format.

---

## Step 3: Templates

### Command Template

```markdown
---
name: {command-name}
description: {description}
---

## Goal

{goal from Claude command}

## Workflow Alignment

{workflow section}

## Step 1: {step name}

{converted step content - replace Claude-specific tool syntax}

...

## Notes

{notes section}
```

### Rule Template (for skills)

```markdown
---
name: {skill-name}
description: {description}
---

{skill instructions converted to Cursor rule format}
```

---

## Step 4: Write Files

**Tools:**
- `mkdir -p .cursor/commands`
- `mkdir -p .cursor/rules`
- Write(file_path=".cursor/commands/{name}.md")
- Write(file_path=".cursor/rules/{name}.md")

**Also sync base instructions:**
- Copy `.claude/CLAUDE.md` → `.cursor/CLAUDE.md`

---

## Step 5: Output Classification

```
Cursor (.cursor/commands/):
  - create-plan.md: [STATUS]
  - execute-plan.md: [STATUS]
  - sync-workflow.md: [STATUS]

Cursor (.cursor/rules/):
  - frontend-design-fundamentals.md: [STATUS]
  - quality-code-check.md: [STATUS]

Cursor Base Instructions:
  - .cursor/CLAUDE.md: [STATUS]
```
