# Factory Droid Sync Guide

Sync Claude Code workflows to Factory Droid format.

---

## Prerequisites

- Source: `.claude/commands/*.md`, `.claude/skills/**/SKILL.md`, `.claude/CLAUDE.md`
- Target: `.factory/commands/*.md`, `.factory/skills/*/SKILL.md`, `.factory/droids/*.md`

---

## Step 1: Fetch Factory Droid Documentation

**Search queries (try in order until successful):**
1. `site:docs.factory.ai cli configuration commands skills`
2. `factory.ai droid custom commands skills documentation`
3. `factory droid cli configuration custom-droids`

**Key documentation URLs:**
- `https://docs.factory.ai/cli/configuration/custom-slash-commands` - Custom commands
- `https://docs.factory.ai/cli/configuration/skills` - Skills configuration
- `https://docs.factory.ai/cli/configuration/custom-droids` - Custom droids (sub-agents)

---

## Step 2: Conversion Rules

### Commands (`.factory/commands/*.md`)

**Location**: `.factory/commands/{name}.md` (workspace) or `~/.factory/commands/` (personal)

**File format:** Markdown (`.md`) or executable with shebang (`#!`)

**Frontmatter:**
- `description`: command description
- `argument-hint`: optional hint for arguments (e.g., `<feature-name>`)

**Arguments:**
- `$ARGUMENTS` for all text after command name
- Executable commands receive `$1`, `$2`, etc.

**Tool references conversion:**
| Claude Code | Factory Droid |
|-------------|---------------|
| `AskUserQuestion(...)` | (handled by TUI) |
| `Task(subagent_type='Explore')` | Search codebase |
| `Task(subagent_type='General')` | General analysis |
| `Read(file_path=...)` | Read file |
| `Write(file_path=...)` | Write file |
| `Edit(file_path=...)` | Edit file |
| `Glob(pattern=...)` | Find files |
| `Grep(pattern=...)` | Search content |
| `Bash(command=...)` | Run command |

### Skills (`.factory/skills/<name>/SKILL.md`)

**Location**: `.factory/skills/{skill-name}/SKILL.md` (workspace) or `~/.factory/skills/` (personal)

**File format:** `SKILL.md` or `skill.mdx`

**Frontmatter (required):**
- `name`: skill name (should match directory name)
- `description`: clear description of when to use the skill

**Content:** Markdown instructions for skill behavior

### Droids (`.factory/droids/*.md`)

**Location**: `.factory/droids/{droid-name}.md` (project) or `~/.factory/droids/` (personal)

**File format:** Markdown with YAML frontmatter and non-empty body

**Frontmatter:**
- `name`: Required, droid identifier (matches filename)
- `description`: Optional, shown in UI
- `model`: `inherit` (use default) or specific model identifier
- `reasoningEffort`: Optional (`low`, `medium`, `high`)
- `tools`: Array of tool IDs or category string

**Tool categories:**
- `read-only` - Read, LS, Grep, Glob
- `edit` - Write, Edit
- `execute` - Bash, shell commands
- `web` - WebSearch, WebFetch
- `mcp` - MCP tools

**Note:** `TodoWrite` tool is automatic for all droids.

---

## Step 3: Templates

### Command Template

```markdown
---
description: {description}
argument-hint: {optional hint for arguments, e.g., "<feature-name>"}
---

## Goal

{goal from Claude command}

## Instructions

{step-by-step instructions}

### Step 1: {step name}

{converted step content}
- Search codebase for relevant files
- Read and analyze existing code
- Write/edit files as needed

...

## Notes

{notes section}
```

### Skill Template

```markdown
---
name: {skill-name}
description: {description from Claude skill - explain when to trigger}
---

# {Skill Title}

## Instructions

1. {step 1}
2. {step 2}
3. {step 3}

## Guidelines

- {guideline 1}
- {guideline 2}
```

### Droid Template

```markdown
---
name: {droid-name}
description: {description of what this droid does}
model: inherit
reasoningEffort: medium
tools: ["Read", "LS", "Grep", "Glob"]
---

You are a specialized {role} droid.

## Focus

- {behavior 1}
- {behavior 2}
- {behavior 3}

## Guidelines

- {guideline 1}
- {guideline 2}
```

---

## Step 4: Write Files

**Tools:**
- `mkdir -p .factory/commands`
- `mkdir -p .factory/skills/{name}`
- `mkdir -p .factory/droids`
- Write(file_path=".factory/commands/{name}.md")
- Write(file_path=".factory/skills/{name}/SKILL.md")
- Write(file_path=".factory/droids/{name}.md") - only if custom droid needed

**Skill name mapping:**
- `.claude/skills/design/figma-extraction/` → `.factory/skills/figma-extraction/`
- `.claude/skills/architecture/quality-code-check/` → `.factory/skills/quality-code-check/`
- `.claude/skills/ux/accessibility/` → `.factory/skills/ux-accessibility/`

---

## Step 5: Output Classification

```
Factory Droid Commands (.factory/commands/):
  - create-plan.md: [STATUS]
  - execute-plan.md: [STATUS]
  - sync-workflow.md: [STATUS]

Factory Droid Skills (.factory/skills/):
  - figma-extraction/SKILL.md: [STATUS]
  - quality-code-check/SKILL.md: [STATUS]
  - frontend-design-fundamentals/SKILL.md: [STATUS]

Factory Droid Droids (.factory/droids/):
  - code-reviewer.md: [STATUS] (if custom review workflow)
  - No custom droids needed otherwise
```

---

## Factory Droid-Specific Notes

1. **Skills are native**: Factory Droid reads skills from `.factory/skills/*/SKILL.md`

2. **AGENTS.md is native**: Factory Droid reads `AGENTS.md` from root - no conversion needed

3. **Command management:**
   - Reload commands: Press `R` in `/commands`
   - Import existing commands: Press `I` in `/commands`

4. **Droid tool arrays:**
   - Array format: `["Read", "LS", "Grep", "Glob"]`
   - Category string: `"read-only"`, `"edit"`, `"execute"`, `"web"`, `"mcp"`
   - Combine as needed for custom permissions

5. **Example droids:**
   - `code-reviewer`: `tools: ["Read", "LS", "Grep", "Glob"]` - read-only review
   - `security-sweeper`: `tools: ["Read", "Grep", "WebSearch"]` - security analysis
   - `docs-writer`: `tools: ["Read", "Write", "Edit", "Glob"]` - documentation

6. **Reasoning effort:**
   - `low`: Fast, simple tasks
   - `medium`: Balanced (default)
   - `high`: Complex analysis tasks
