# OpenCode Sync Guide

Sync Claude Code workflows to OpenCode format.

---

## Prerequisites

- Source: `.claude/commands/*.md`, `.claude/skills/**/SKILL.md`, `.claude/CLAUDE.md`
- Target: `.opencode/command/*.md`, `.opencode/skill/*/SKILL.md`, `.opencode/agent/*.md`, `AGENTS.md`

---

## Step 1: Fetch OpenCode Documentation

**Search queries (try in order until successful):**
1. `site:opencode.ai docs agents commands skills`
2. `opencode.ai documentation configuration`
3. `opencode ai terminal commands skills agents`

**Key documentation URLs:**
- `https://opencode.ai/docs/agents/` - Agents configuration
- `https://opencode.ai/docs/commands/` - Custom commands
- `https://opencode.ai/docs/skills/` - Agent skills
- `https://opencode.ai/docs/rules/` - Rules (AGENTS.md)
- `https://opencode.ai/docs/config/` - Configuration

---

## Step 2: Conversion Rules

### Commands (`.opencode/command/*.md`)

**Location**: `.opencode/command/{name}.md`

**Frontmatter:**
- `description` (required)
- `agent: build` for commands that modify code
- `agent: plan` for read-only commands
- `model`: optional model override
- `subtask`: optional subtask flag

**Arguments:**
- `$ARGUMENTS` for all text after command
- `$1`, `$2`, etc. for positional args

**Tool references conversion:**
| Claude Code | OpenCode |
|-------------|----------|
| `AskUserQuestion(...)` | (handled by TUI) |
| `Task(subagent_type='Explore')` | `@explore` mention |
| `Task(subagent_type='General')` | `@general` mention |
| `Read(file_path=...)` | `@filename` reference |
| `Write(file_path=...)` | Write instruction |
| `Edit(file_path=...)` | Edit instruction |
| `Bash(command=...)` | `` !`command` `` syntax |

### Skills (`.opencode/skill/<name>/SKILL.md`)

**Location**: `.opencode/skill/{skill-name}/SKILL.md`

**Name validation:**
- Lowercase alphanumeric with hyphens
- 1-64 characters
- Directory name must match `name` in frontmatter

**Frontmatter (required):**
- `name`: skill name
- `description`: 1-1024 chars
- `license`: optional (e.g., MIT)
- `compatibility`: optional (e.g., opencode)
- `metadata`: optional key-value pairs

### Agents (`.opencode/agent/*.md`)

**Built-in agents (don't need to create):**
- `build` - Primary agent with all tools (default)
- `plan` - Read-only analysis agent
- `general` - Subagent for complex tasks
- `explore` - Subagent for codebase exploration

**Create custom agents only if needed.**

**Frontmatter:**
- `description`: agent description
- `mode`: `primary` or `subagent`
- `model`: model identifier
- `temperature`: optional
- `tools`: tool permissions object
- `permission`: skill permissions

---

## Step 3: Templates

### Command Template

```markdown
---
description: {description}
agent: build
---

{goal and instructions from Claude command}

## Instructions

{step-by-step instructions}

### Step 1: {step name}

{converted step content}
- Use @explore to search codebase
- Use @filename to reference files
- Use !`command` for shell output

...

## Notes

{notes section}
```

### Skill Template

```markdown
---
name: {skill-name}
description: {description from Claude skill, 1-1024 chars}
license: MIT
compatibility: opencode
metadata:
  category: {category}
  source: claude-code
---

## What I do

{capabilities from Claude skill}

## When to use me

{triggers and conditions from Claude skill}

## Instructions

{step-by-step instructions from Claude skill}
```

### Agent Template (if custom needed)

```markdown
---
description: {agent description}
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
tools:
  write: false
  edit: false
  bash: false
permission:
  skill:
    "*": allow
---

{system prompt for agent behavior}

Focus on:
- {behavior 1}
- {behavior 2}
- {behavior 3}
```

---

## Step 4: Write Files

**Tools:**
- `mkdir -p .opencode/command`
- `mkdir -p .opencode/skill/{name}`
- `mkdir -p .opencode/agent`
- Write(file_path=".opencode/command/{name}.md")
- Write(file_path=".opencode/skill/{name}/SKILL.md")
- Write(file_path=".opencode/agent/{name}.md") - only if custom agent needed

**Skill name mapping:**
- `.claude/skills/design/figma-extraction/` → `.opencode/skill/figma-extraction/`
- `.claude/skills/architecture/quality-code-check/` → `.opencode/skill/quality-code-check/`
- `.claude/skills/ux/accessibility/` → `.opencode/skill/ux-accessibility/`

---

## Step 5: Output Classification

```
OpenCode Commands (.opencode/command/):
  - create-plan.md: [STATUS]
  - execute-plan.md: [STATUS]
  - sync-workflow.md: [STATUS]

OpenCode Skills (.opencode/skill/):
  - figma-extraction/SKILL.md: [STATUS]
  - quality-code-check/SKILL.md: [STATUS]
  - frontend-design-fundamentals/SKILL.md: [STATUS]

OpenCode Agents (.opencode/agent/):
  - Using built-in agents (build, plan, explore, general)
  - [custom agent name]: [STATUS] (if any)
```

---

## OpenCode-Specific Notes

1. **Skills are native**: OpenCode reads `.claude/skills/*/SKILL.md` directly! But for clarity, also create `.opencode/skill/*/SKILL.md`

2. **AGENTS.md is native**: OpenCode reads `AGENTS.md` and `CLAUDE.md` from root - no conversion needed

3. **Command syntax special features:**
   - Arguments: `$ARGUMENTS` for all, `$1`, `$2` for positional
   - Shell output: `` !`git status` `` injects command output
   - File references: `@src/file.ts` includes file content

4. **Agent modes:**
   - `primary`: Main agents (Tab to switch)
   - `subagent`: Invoked by `@mention` or by primary agents
