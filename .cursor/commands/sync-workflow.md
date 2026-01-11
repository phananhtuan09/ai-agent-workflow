---
name: sync-workflow
description: Syncs Claude Code workflows to Cursor, GitHub Copilot, and OpenCode formats.
---

## Goal

Sync Claude Code commands/workflows to Cursor, GitHub Copilot, and OpenCode formats by:
1. Analyzing source files in `.claude/commands/` and `.claude/skills/`
2. Converting to target formats
3. Creating/updating target files

## Source Files

- `.claude/commands/*.md` - Commands
- `.claude/skills/**/*.md` - Skills (SKILL.md files)
- `.claude/CLAUDE.md` - Base instructions

## Target Files

- **Cursor**: `.cursor/commands/*.md`, `.cursor/CLAUDE.md`
- **GitHub Copilot**: `.github/prompts/*.prompt.md`, `.github/copilot-instructions.md`
- **OpenCode**: `.opencode/command/*.md`, `.opencode/skill/*/SKILL.md`, `AGENTS.md`

## Steps

1. Read all source commands and skills
2. Detect existing target files
3. Convert format (remove tool-specific syntax)
4. Write converted files
5. Sync base instruction files
6. Update AGENTS.md
7. Generate summary report

## Conversion Rules

### Tool Reference Conversion

| Claude Code | Generic Format |
|-------------|----------------|
| `AskUserQuestion(...)` | Ask user |
| `Task(subagent_type='Explore')` | Search codebase |
| `Read(file_path=...)` | Read file |
| `Write(file_path=...)` | Write file |
| `Edit(file_path=...)` | Edit file |
| `Glob(pattern=...)` | Find files |
| `Grep(pattern=...)` | Search content |
| `Bash(command=...)` | Run command |

### Platform Comparison

| Feature | Claude Code | Cursor | GitHub Copilot | OpenCode |
|---------|-------------|--------|----------------|----------|
| Commands | `.claude/commands/` | `.cursor/commands/` | `.github/prompts/` | `.opencode/command/` |
| Skills | `.claude/skills/*/SKILL.md` | `.cursor/rules/` | N/A | `.opencode/skill/*/SKILL.md` |
| Base instructions | `CLAUDE.md` | `CLAUDE.md` | `copilot-instructions.md` | `AGENTS.md` |

## Notes

- Run this after adding/modifying Claude commands or skills
- All platforms will have synchronized workflows
- Test commands in each platform after syncing
