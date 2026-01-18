# GitHub Copilot Sync Guide

Sync Claude Code workflows to GitHub Copilot format.

---

## Prerequisites

- Source: `.claude/commands/*.md`, `.claude/CLAUDE.md`
- Target: `.github/prompts/*.prompt.md`, `.github/copilot-instructions.md`

---

## Step 1: Fetch GitHub Copilot Documentation

**Search queries (try in order until successful):**
1. `"github.com" copilot custom instructions repository documentation`
2. `site:docs.github.com copilot custom instructions prompts`
3. `github copilot prompt files .github/prompts format`

**Key documentation URLs:**
- `https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot`
- `https://docs.github.com/en/copilot/how-tos/configure-custom-instructions`

**Extract and note:**
- Prompt file location: `.github/prompts/`
- File format: `*.prompt.md` naming convention
- Frontmatter structure (applyTo, excludeAgent, etc.)
- Custom instructions file: `.github/copilot-instructions.md`
- AGENTS.md support (location, format)

---

## Step 2: Conversion Rules

### Commands → Prompts (`.github/prompts/*.prompt.md`)

**Filename:** `{name}.prompt.md` format

**Frontmatter:**
- May need `applyTo` for path-specific prompts
- Keep `name` and `description`

**Tool references conversion:**
| Claude Code | GitHub Copilot |
|-------------|----------------|
| `AskUserQuestion(...)` | Ask user for clarification |
| `Task(subagent_type='Explore')` | Search codebase for... |
| `Read(file_path=...)` | Read file |
| `Write(file_path=...)` | Write file |
| `Edit(file_path=...)` | Edit file |
| `Glob(pattern=...)` | Find files |
| `Grep(pattern=...)` | Search pattern |
| `Bash(command=...)` | Run command |

**Remove:** Claude-specific skill references (Copilot doesn't have skills system)

**Keep:** Goal, Steps structure, acceptance criteria

### Skills

GitHub Copilot doesn't have a skills system. Options:
1. Inline skill content into relevant prompts
2. Add to `copilot-instructions.md` as guidelines
3. Skip skills (not applicable)

---

## Step 3: Templates

### Prompt Template

```markdown
---
name: {command-name}
description: {description}
---

## Goal

{goal from Claude command}

## Workflow Alignment

{workflow section - simplified}

## Step 1: {step name}

{converted step content - generic instructions}

...

## Notes

{notes section - remove Claude-specific references}
```

### copilot-instructions.md Template

```markdown
# Repository Instructions for GitHub Copilot

## Coding Philosophy

{core philosophy from .claude/CLAUDE.md}

## Workflow Guidelines

{workflow guidelines - converted to generic instructions}

## Code Standards

{code presentation, TODO policy, etc.}
```

---

## Step 4: Write Files

**Tools:**
- `mkdir -p .github/prompts`
- Write(file_path=".github/prompts/{name}.prompt.md")
- Write(file_path=".github/copilot-instructions.md")

---

## Step 5: Output Classification

```
GitHub Copilot (.github/prompts/):
  - create-plan.prompt.md: [STATUS]
  - execute-plan.prompt.md: [STATUS]
  - sync-workflow.prompt.md: [STATUS]

GitHub Copilot Base Instructions:
  - .github/copilot-instructions.md: [STATUS]
```
