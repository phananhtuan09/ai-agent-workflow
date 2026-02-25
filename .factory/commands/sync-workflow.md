---
description: Syncs Claude Code workflows to Cursor, GitHub Copilot, OpenCode, and Factory Droid formats.
---

## Goal

Sync Claude Code commands/workflows to selected target platforms by:
1. Asking user which platforms to sync
2. Fetching latest documentation for selected platforms
3. Analyzing source files and converting to target formats
4. Syncing AGENTS.md as universal base instructions

## Step 1: Select Target Platforms

**Tool:** Present questions to orchestrator

Request orchestrator to ask user which platforms to sync (multiple selection allowed):

```
{
  "question": "Which platforms do you want to sync to?",
  "header": "Platforms",
  "multiSelect": true,
  "options": [
    {"label": "Cursor", "description": ".cursor/commands/, .cursor/rules/"},
    {"label": "GitHub Copilot", "description": ".github/prompts/, copilot-instructions.md"},
    {"label": "OpenCode", "description": ".opencode/command/, skill/, agent/"},
    {"label": "Factory Droid", "description": ".factory/commands/, skills/, droids/"}
  ]
}
```

---

## Step 2: Load Common Analysis

**Reference:** Read and follow `docs/sync-workflow/common.md`

This step:
- Analyzes source Claude Code files (commands, skills, CLAUDE.md)
- Detects existing target files
- Classifies files as MISSING, OUTDATED, or CURRENT

---

## Step 3: Execute Platform-Specific Sync

For each selected platform, load and execute the corresponding guide:

### If Cursor selected:
**Reference:** Read and follow `docs/sync-workflow/cursor.md`

### If GitHub Copilot selected:
**Reference:** Read and follow `docs/sync-workflow/github-copilot.md`

### If OpenCode selected:
**Reference:** Read and follow `docs/sync-workflow/opencode.md`

### If Factory Droid selected:
**Reference:** Read and follow `docs/sync-workflow/factory-droid.md`

---

## Step 4: Sync AGENTS.md (Always Execute)

**IMPORTANT: Always sync AGENTS.md regardless of platform selection.**

Many AI coding tools use `AGENTS.md` as their base instruction file:
- OpenCode, Factory Droid - read natively
- Cursor, GitHub Copilot - support AGENTS.md

### 4a: Read Source

Read `.claude/CLAUDE.md` as the primary source.

### 4b: Convert Content

**Conversion rules for AGENTS.md:**

1. **Remove Claude-specific syntax:**
   - Remove `AskUserQuestion(...)` references
   - Remove `Task(subagent_type=...)` syntax
   - Convert `Read/Write/Edit` tool calls to generic instructions
   - Remove `.claude/skills/...` paths

2. **Keep universal content:**
   - Core coding philosophy
   - Workflow guidelines
   - File structure conventions
   - Communication guidelines
   - Code presentation rules
   - TODO policy
   - Git workflow
   - Quality gates

3. **Adapt tool references:**
   - `Glob(pattern=...)` → "Search for files matching pattern"
   - `Grep(pattern=...)` → "Search content for pattern"
   - `Bash(command=...)` → "Run command in terminal"

### 4c: Write to AGENTS.md

Write converted content to `AGENTS.md` at project root.

---

## Step 5: Summary Report

Generate sync report based on selected platforms:

```
## Workflow Sync Complete

### Platforms Synced
- [x] Cursor (if selected)
- [x] GitHub Copilot (if selected)
- [x] OpenCode (if selected)
- [x] Factory Droid (if selected)
- [x] AGENTS.md (always)

### Files Created/Updated
[List files per platform]

### Warnings
[Any conversion warnings]

### Next Steps
- Review converted files
- Test commands in each platform
- Commit changes
```

---

## Notes

### Platform Comparison Summary

| Feature | Claude Code | Cursor | GitHub Copilot | OpenCode | Factory Droid |
|---------|-------------|--------|----------------|----------|---------------|
| Commands | `.claude/commands/` | `.cursor/commands/` | `.github/prompts/` | `.opencode/command/` | `.factory/commands/` |
| Skills | `.claude/skills/*/SKILL.md` | `.cursor/rules/` | N/A | `.opencode/skill/*/SKILL.md` | `.factory/skills/*/SKILL.md` |
| Agents | N/A | N/A | N/A | `.opencode/agent/*.md` | `.factory/droids/*.md` |
| Base | `CLAUDE.md` | `CLAUDE.md` | `copilot-instructions.md` | `AGENTS.md` | `AGENTS.md` |

### When to Run This Command

- After adding/modifying Claude commands or skills
- After major updates to platform documentation
- Before releasing new version of ai-workflow-init package
- When team reports sync issues between platforms
