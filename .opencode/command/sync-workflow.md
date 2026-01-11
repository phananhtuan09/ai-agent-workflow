---
name: sync-workflow
description: Syncs Claude Code workflows to Cursor, GitHub Copilot, and OpenCode formats.
---

## Goal

Sync Claude Code commands/workflows to Cursor, GitHub Copilot, and OpenCode formats by:
1. Fetching latest documentation for target platforms
2. Analyzing format differences
3. Converting and updating target files (commands, skills, agents, base instructions)

## Prerequisites

- Source (Claude Code):
  - `.claude/commands/*.md` - Commands
  - `.claude/skills/**/*.md` - Skills (SKILL.md files)
  - `.claude/CLAUDE.md` - Base instructions
  - `AGENTS.md` - Agent instructions

- Targets:
  - **Cursor**: `.cursor/commands/*.md`, `.cursor/rules/`
  - **GitHub Copilot**: `.github/prompts/*.prompt.md`, `.github/copilot-instructions.md`
  - **OpenCode**: `.opencode/command/*.md`, `.opencode/skill/*/SKILL.md`, `.opencode/agent/*.md`, `AGENTS.md`

---

## Step 1: Fetch Latest Documentation (Web Search)

**CRITICAL: Always fetch latest docs before syncing to ensure format compliance.**

**Tool:** WebSearch or WebFetch

### 1a: Fetch Cursor Documentation

Search for latest Cursor rules and commands documentation:

**Search queries (try in order until successful):**
1. `"cursor.com" rules for ai custom commands documentation`
2. `site:docs.cursor.com rules commands`
3. `cursor ai editor custom rules commands format`

**Key documentation URLs to fetch:**
- `https://docs.cursor.com/context/rules-for-ai`
- `https://docs.cursor.com/context/rules`
- `https://docs.cursor.com/chat/custom-modes`

**Extract and note:**
- Command file location: `.cursor/commands/` or `.cursor/rules/`
- File format: frontmatter structure, markdown body
- Supported frontmatter fields (name, description, etc.)
- Any special syntax or features (variables, context references)
- AGENTS.md support and location

### 1b: Fetch GitHub Copilot Documentation

Search for latest GitHub Copilot custom instructions documentation:

**Search queries (try in order until successful):**
1. `"github.com" copilot custom instructions repository documentation`
2. `site:docs.github.com copilot custom instructions prompts`
3. `github copilot prompt files .github/prompts format`

**Key documentation URLs to fetch:**
- `https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot`
- `https://docs.github.com/en/copilot/how-tos/configure-custom-instructions`

**Extract and note:**
- Prompt file location: `.github/prompts/`
- File format: `*.prompt.md` naming convention
- Frontmatter structure (applyTo, excludeAgent, etc.)
- Custom instructions file: `.github/copilot-instructions.md`
- AGENTS.md support (location, format)

### 1c: Fetch OpenCode Documentation

Search for latest OpenCode documentation:

**Search queries (try in order until successful):**
1. `site:opencode.ai docs agents commands skills`
2. `opencode.ai documentation configuration`
3. `opencode ai terminal commands skills agents`

**Key documentation URLs to fetch:**
- `https://opencode.ai/docs/agents/` - Agents configuration
- `https://opencode.ai/docs/commands/` - Custom commands
- `https://opencode.ai/docs/skills/` - Agent skills
- `https://opencode.ai/docs/rules/` - Rules (AGENTS.md)
- `https://opencode.ai/docs/config/` - Configuration

**Extract and note:**

**Agents** (`.opencode/agent/*.md` or `opencode.json`):
- Primary agents: Build (default), Plan (read-only)
- Subagents: General, Explore
- Config options: mode, model, tools, permissions, prompt, description
- Frontmatter format for markdown agents

**Commands** (`.opencode/command/*.md`):
- Location: `.opencode/command/` (project) or `~/.config/opencode/command/` (global)
- Frontmatter: description, agent, model, subtask
- Arguments: `$ARGUMENTS`, `$1`, `$2`, etc.
- Shell output: `` !`command` ``
- File references: `@filename`

**Skills** (`.opencode/skill/<name>/SKILL.md`):
- Location: `.opencode/skill/<name>/SKILL.md` or `.claude/skills/<name>/SKILL.md`
- Frontmatter: name (required), description (required), license, compatibility, metadata
- Name validation: lowercase alphanumeric with hyphens, 1-64 chars
- Description: 1-1024 chars

**Rules** (`AGENTS.md`):
- Location: project root or `~/.config/opencode/AGENTS.md`
- Also reads: `CLAUDE.md`, `.cursor/rules/*.md`
- Can reference external files via `opencode.json` instructions field

### 1d: Document Format Summary

After fetching, create internal summary:

```
## Cursor Format
- Location: [discovered path]
- Frontmatter: [fields]
- Special features: [features]
- AGENTS.md: [supported? location?]

## GitHub Copilot Format
- Prompts location: [discovered path]
- Instructions location: [discovered path]
- Frontmatter: [fields]
- Special features: [features]
- AGENTS.md/CLAUDE.md: [supported? location?]

## OpenCode Format
- Agents: .opencode/agent/*.md (mode, model, tools, permissions, prompt)
- Commands: .opencode/command/*.md (description, agent, model, subtask)
- Skills: .opencode/skill/<name>/SKILL.md (name, description)
- Rules: AGENTS.md (also reads CLAUDE.md)
- Config: opencode.json
```

**Error handling:**
- Web search fails: Use cached knowledge + warn user docs may be outdated
- URL fetch fails: Try alternative URLs or search queries
- Format changed significantly: Alert user, show differences

---

## Step 2: Analyze Source (Claude Code)

### 2a: Analyze Commands

**Tools:**
- Glob(pattern=".claude/commands/*.md")
- Read(file_path=...) for each command

**For each Claude command, extract:**
- Frontmatter: name, description
- Goal section
- Step-by-step instructions
- Tool references (AskUserQuestion, Read, Write, Edit, Task, etc.)
- Skill references (`.claude/skills/...`)
- Notes and guidelines

### 2b: Analyze Skills

**Tools:**
- Glob(pattern=".claude/skills/**/SKILL.md")
- Read(file_path=...) for each skill

**For each Claude skill, extract:**
- Skill name and category (from path)
- SKILL.md content
- Triggers and usage conditions
- Instructions and guidelines

### 2c: Analyze Base Instructions

**Tools:**
- Read(file_path=".claude/CLAUDE.md")
- Read(file_path="AGENTS.md")

**Build inventory:**
```
| Type    | Name              | Description                          | Location              |
|---------|-------------------|--------------------------------------|-----------------------|
| Command | create-plan       | Generates feature planning doc       | .claude/commands/     |
| Command | execute-plan      | Implements tasks from planning doc   | .claude/commands/     |
| Skill   | figma-extraction  | Extract design from Figma            | .claude/skills/design/|
| Skill   | quality-code-check| Linting and type checking            | .claude/skills/arch/  |
| Rules   | CLAUDE.md         | Base instructions                    | .claude/              |
| Rules   | AGENTS.md         | Agent instructions                   | root                  |
```

---

## Step 3: Detect Existing Target Files

**Tools:**
- Glob(pattern=".cursor/commands/*.md")
- Glob(pattern=".github/prompts/*.prompt.md")
- Glob(pattern=".opencode/command/*.md")
- Glob(pattern=".opencode/skill/*/SKILL.md")
- Glob(pattern=".opencode/agent/*.md")
- Read(file_path=...) for each existing file

**Compare and classify:**
- **Missing**: Source exists but not in target
- **Outdated**: Target exists but content differs significantly
- **Current**: Target matches source (skip)

**Output classification:**
```
Cursor (.cursor/commands/):
  - create-plan.md: OUTDATED (source modified)
  - execute-plan.md: CURRENT (skip)
  - sync-workflow.md: MISSING (new)

GitHub Copilot (.github/prompts/):
  - create-plan.prompt.md: OUTDATED
  - execute-plan.prompt.md: CURRENT (skip)
  - sync-workflow.prompt.md: MISSING (new)

OpenCode Commands (.opencode/command/):
  - create-plan.md: MISSING (new)
  - execute-plan.md: MISSING (new)

OpenCode Skills (.opencode/skill/):
  - figma-extraction/SKILL.md: MISSING (new)
  - quality-code-check/SKILL.md: MISSING (new)

OpenCode Agents (.opencode/agent/):
  - No custom agents needed (use built-in Build/Plan)
```

---

## Step 4: Convert Format (Claude → Targets)

### 4a: Claude → Cursor Conversion

**Conversion rules:**
1. **Frontmatter**: Keep `name` and `description`, adjust other fields per Cursor docs
2. **Tool references**: Convert Claude-specific tools to Cursor equivalents
   - `AskUserQuestion(...)` → Generic "ask user" instruction
   - `Task(subagent_type='Explore')` → "Use workspace search and analysis"
   - `Read(file_path=...)` → `read [path]` or similar
   - `Write(file_path=...)` → `write to [path]`
   - `Edit(file_path=...)` → `edit [path]`
3. **Skill references**: Convert `.claude/skills/...` → `.cursor/rules/...` or inline
4. **Keep**: Goal, Steps, Notes sections structure

**Template for Cursor:**
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

### 4b: Claude → GitHub Copilot Conversion

**Conversion rules:**
1. **Filename**: `{name}.prompt.md` format
2. **Frontmatter**: May need `applyTo` for path-specific prompts
3. **Tool references**: Convert to generic instructions (Copilot has different tool model)
   - `AskUserQuestion(...)` → "Ask user for clarification"
   - `Task(subagent_type='Explore')` → "Search codebase for..."
   - `Read/Write/Edit` → Generic file operation instructions
4. **Remove**: Claude-specific skill references (Copilot doesn't have skills system)
5. **Keep**: Goal, Steps structure, acceptance criteria

**Template for GitHub Copilot:**
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

### 4c: Claude → OpenCode Conversion

**OpenCode has 3 main concepts to sync: Commands, Skills, and Agents**

#### 4c-1: Commands (`.opencode/command/*.md`)

**Location**: `.opencode/command/{name}.md`

**Conversion rules:**
1. **Frontmatter**: Convert to OpenCode format
   - `name` → (filename becomes name)
   - `description` → `description`
   - Add `agent: build` for commands that modify code
   - Add `agent: plan` for read-only commands
2. **Arguments**: Convert to OpenCode placeholder format
   - Named args → `$ARGUMENTS` or `$1`, `$2`, etc.
3. **Tool references**: Convert to OpenCode instructions
   - `AskUserQuestion(...)` → Remove (OpenCode handles differently)
   - `Task(subagent_type='Explore')` → "Use @explore to search codebase"
   - `Read(file_path=...)` → "Read file at path" or use `@filename`
   - `Write/Edit` → "Write/edit file at path"
4. **Skill references**: Convert to OpenCode skill tool calls
   - `.claude/skills/xyz/SKILL.md` → "Load skill xyz" or inline

**Template for OpenCode Command:**
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

#### 4c-2: Skills (`.opencode/skill/<name>/SKILL.md`)

**Location**: `.opencode/skill/{skill-name}/SKILL.md`

**Conversion rules:**
1. **Directory structure**: Create `.opencode/skill/{name}/SKILL.md`
2. **Name validation**: Convert to lowercase-hyphenated, 1-64 chars
   - `quality-code-check` ✓
   - `figma-extraction` ✓
3. **Frontmatter** (required):
   - `name`: skill name (must match directory name)
   - `description`: 1-1024 chars
   - `license`: optional (e.g., MIT)
   - `compatibility`: optional (e.g., opencode)
   - `metadata`: optional key-value pairs
4. **Content**: Convert Claude skill instructions

**Template for OpenCode Skill:**
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

**Claude → OpenCode skill name mapping:**
- `.claude/skills/design/figma-extraction/` → `.opencode/skill/figma-extraction/`
- `.claude/skills/architecture/quality-code-check/` → `.opencode/skill/quality-code-check/`
- `.claude/skills/ux/accessibility/` → `.opencode/skill/ux-accessibility/`

#### 4c-3: Agents (`.opencode/agent/*.md`)

**Location**: `.opencode/agent/{agent-name}.md`

**OpenCode built-in agents (don't need to create):**
- `build` - Primary agent with all tools (default)
- `plan` - Read-only analysis agent
- `general` - Subagent for complex tasks
- `explore` - Subagent for codebase exploration

**Create custom agents only if needed:**
- For specialized workflows not covered by built-in agents
- For agents with specific tool permissions or models

**Template for OpenCode Agent:**
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

**When to create custom agents:**
- `code-reviewer` - If you have a specialized review workflow
- `docs-writer` - For documentation-focused tasks
- `security-auditor` - For security-focused analysis

---

## Step 5: Write Converted Files

**Tools:**
- Write(file_path=".cursor/commands/{name}.md")
- Write(file_path=".github/prompts/{name}.prompt.md")
- Write(file_path=".opencode/command/{name}.md")
- Write(file_path=".opencode/skill/{name}/SKILL.md")
- Write(file_path=".opencode/agent/{name}.md") - only if custom agent needed

**For each item needing sync (MISSING or OUTDATED):**

1. Apply conversion rules from Step 4
2. Create directories if needed:
   - `mkdir -p .opencode/command`
   - `mkdir -p .opencode/skill/{name}`
   - `mkdir -p .opencode/agent`
3. Write to target location
4. Log what was created/updated

**Error handling:**
- Directory doesn't exist: Create it first
- File write fails: Retry once, then notify user
- Conversion uncertain: Add TODO comment in output file
- Skill name validation fails: Adjust name to meet requirements

---

## Step 6: Sync Base Instruction Files

**Check and sync base instruction files across all platforms:**

### Source files:
- `.claude/CLAUDE.md` - Claude Code base instructions (PRIMARY SOURCE)

### Target files by platform:

| Platform | Base Instructions | Notes |
|----------|-------------------|-------|
| Cursor | `.cursor/CLAUDE.md` | Also reads AGENTS.md |
| GitHub Copilot | `.github/copilot-instructions.md` | Merge sources |
| OpenCode | `AGENTS.md` | Primary instruction file |
| Other tools | `AGENTS.md` | Universal standard |

**Conversion for each platform:**

1. **Cursor**: Copy `.claude/CLAUDE.md` → `.cursor/CLAUDE.md`
2. **GitHub Copilot**: 
   - Merge into `.github/copilot-instructions.md`
   - Remove Claude-specific tool syntax

---

## Step 7: Sync AGENTS.md (FINAL STEP - CRITICAL)

**IMPORTANT: This is the final and most critical step.**

Many AI coding tools use `AGENTS.md` as their base instruction file:
- **OpenCode** - reads `AGENTS.md` natively
- **Cursor** - supports `AGENTS.md`
- **GitHub Copilot** - supports `AGENTS.md`
- **Other AI tools** - increasingly adopting `AGENTS.md` standard

### 7a: Read Source

**Tool:** Read(file_path=".claude/CLAUDE.md")

Read the Claude Code base instructions from `.claude/CLAUDE.md`.

### 7b: Convert Content

**Conversion rules for AGENTS.md:**

1. **Remove Claude-specific syntax:**
   - Remove `AskUserQuestion(...)` tool references
   - Remove `Task(subagent_type=...)` syntax
   - Convert `Read/Write/Edit` tool calls to generic instructions
   - Remove `.claude/skills/...` paths (use generic skill references)

2. **Keep universal content:**
   - Core coding philosophy
   - Workflow guidelines (Plan → Implement → Test → Review)
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
   - `WebFetch(url=...)` → "Fetch URL content"

4. **Add universal slash commands section:**
   - List commands that work across platforms
   - Note platform-specific variations

### 7c: Write to AGENTS.md

**Tool:** Write(file_path="AGENTS.md")

Write the converted content to `AGENTS.md` at project root.

**Template for AGENTS.md:**
```markdown
# AI Agent Workflow Standards

## Core Coding Philosophy

Apply these principles when providing solutions, generating code, or making technical decisions:

### 1. Simplicity First
{content from .claude/CLAUDE.md}

### 2. Deep Understanding
{content from .claude/CLAUDE.md}

### 3. Multiple Options
{content from .claude/CLAUDE.md}

### 4. Think Ahead
{content from .claude/CLAUDE.md}

---

## Core Workflow: Plan → Implement → Test → Review

### Workflow Alignment
{content from .claude/CLAUDE.md - converted to generic instructions}

## File Structure
{content from .claude/CLAUDE.md}

## Tooling Strategy
{content from .claude/CLAUDE.md - generic tool references}

## Communication
{content from .claude/CLAUDE.md}

## Code Presentation
{content from .claude/CLAUDE.md}

## TODO Policy
{content from .claude/CLAUDE.md}

## Git Workflow
{content from .claude/CLAUDE.md}

## Slash Commands
- `/create-plan` - Generate planning doc
- `/execute-plan` - Implement tasks from planning doc
- `/modify-plan` - Modify plan after implementation
- `/code-review` - Validate against standards
- `/generate-standards` - Update CODE_CONVENTIONS.md
- `/writing-test` - Generate tests from acceptance criteria
- `/init-chat` - Load project rules (AGENTS.md)

## Quality Gates
{content from .claude/CLAUDE.md}

---
```

### 7d: Verify Sync

After writing, verify:
1. `AGENTS.md` exists at project root
2. Content is valid markdown
3. No Claude-specific syntax remains
4. All sections are present

**Notify user:**
```
✓ AGENTS.md synced from .claude/CLAUDE.md
  - Removed Claude-specific syntax
  - Converted tool references to generic instructions
  - All AI coding tools will now read the same base instructions
```

---

## Step 8: Summary Report

**Generate sync report:**

```
## Workflow Sync Complete

### Documentation Fetched
- Cursor docs: [date] - [version/status]
- GitHub Copilot docs: [date] - [version/status]
- OpenCode docs: [date] - [version/status]

### Files Synced

#### Cursor (.cursor/commands/)
- [x] create-plan.md - UPDATED
- [x] execute-plan.md - SKIPPED (current)
- [x] sync-workflow.md - CREATED

#### GitHub Copilot (.github/prompts/)
- [x] create-plan.prompt.md - UPDATED
- [x] execute-plan.prompt.md - SKIPPED (current)
- [x] sync-workflow.prompt.md - CREATED

#### OpenCode Commands (.opencode/command/)
- [x] create-plan.md - CREATED
- [x] execute-plan.md - CREATED
- [x] sync-workflow.md - CREATED

#### OpenCode Skills (.opencode/skill/)
- [x] figma-extraction/SKILL.md - CREATED
- [x] quality-code-check/SKILL.md - CREATED
- [x] design-fundamentals/SKILL.md - CREATED
- [x] ux-accessibility/SKILL.md - CREATED

#### OpenCode Agents (.opencode/agent/)
- [x] Using built-in agents (build, plan, explore, general)
- [ ] No custom agents needed

#### Base Instructions (CRITICAL)
- [x] .cursor/CLAUDE.md - UPDATED (from .claude/CLAUDE.md)
- [x] .github/copilot-instructions.md - UPDATED
- [x] **AGENTS.md - SYNCED FROM .claude/CLAUDE.md** ← Final step

### AGENTS.md Sync Summary
- Source: .claude/CLAUDE.md
- Target: AGENTS.md (project root)
- Status: ✓ Synced
- Changes:
  - Removed Claude-specific tool syntax
  - Converted to generic instructions
  - Compatible with: OpenCode, Cursor, GitHub Copilot, other AI tools

### Warnings
- [any conversion warnings or manual review needed]

### Next Steps
- Review converted files for platform-specific adjustments
- Test commands in each platform:
  - Claude Code: `/create-plan`
  - Cursor: `/create-plan`
  - GitHub Copilot: Use prompt file
  - OpenCode: `/create-plan`
- Commit changes: `git add . && git commit -m "[sync] update workflows and AGENTS.md"`
```
- Test commands in each platform:
  - Claude Code: `/create-plan`
  - Cursor: `/create-plan`
  - GitHub Copilot: Use prompt file
  - OpenCode: `/create-plan`
- Commit changes: `git add . && git commit -m "[sync] update Cursor, Copilot, and OpenCode workflows"`
```

---

## Notes

### General Guidelines

- Always fetch latest docs first (Step 1) - platform formats change frequently
- Preserve the intent and logic of commands during conversion
- When uncertain about conversion, add TODO comments for manual review
- Keep conversions conservative - better to be generic than broken

### Platform Comparison Summary

| Feature | Claude Code | Cursor | GitHub Copilot | OpenCode |
|---------|-------------|--------|----------------|----------|
| Commands | `.claude/commands/` | `.cursor/commands/` | `.github/prompts/` | `.opencode/command/` |
| Skills | `.claude/skills/*/SKILL.md` | `.cursor/rules/` | N/A | `.opencode/skill/*/SKILL.md` |
| Agents | N/A (built-in) | N/A | N/A | `.opencode/agent/*.md` |
| Base instructions | `CLAUDE.md` | `CLAUDE.md` | `copilot-instructions.md` | `AGENTS.md` |
| Config | N/A | N/A | N/A | `opencode.json` |
| Frontmatter | YAML | YAML | YAML | YAML |
| Arguments | N/A | N/A | N/A | `$ARGUMENTS`, `$1` |

### Tool Reference Conversion

| Claude Code | Cursor | GitHub Copilot | OpenCode |
|-------------|--------|----------------|----------|
| `AskUserQuestion(...)` | Ask user | Ask user | (handled by TUI) |
| `Task(subagent_type='Explore')` | Workspace search | Search codebase | `@explore` mention |
| `Task(subagent_type='General')` | General search | General search | `@general` mention |
| `Read(file_path=...)` | Read file | Read file | `@filename` reference |
| `Write(file_path=...)` | Write file | Write file | Write instruction |
| `Edit(file_path=...)` | Edit file | Edit file | Edit instruction |
| `Glob(pattern=...)` | Find files | Find files | Search instruction |
| `Grep(pattern=...)` | Search content | Search pattern | Search instruction |
| `Bash(command=...)` | Run command | Run command | `` !`command` `` syntax |
| `WebFetch(url=...)` | Fetch URL | Fetch URL | Fetch instruction |

### OpenCode-Specific Considerations

1. **Skills are native**: OpenCode reads `.claude/skills/*/SKILL.md` directly! But for clarity, also create `.opencode/skill/*/SKILL.md`

2. **AGENTS.md is native**: OpenCode reads `AGENTS.md` and `CLAUDE.md` from root - no conversion needed

3. **Built-in agents**: Use `build` (default), `plan`, `explore`, `general` - create custom only when needed

4. **Command syntax**:
   - Arguments: `$ARGUMENTS` for all, `$1`, `$2` for positional
   - Shell output: `` !`git status` `` injects command output
   - File references: `@src/file.ts` includes file content

5. **Skill requirements**:
   - Name: lowercase alphanumeric with hyphens, 1-64 chars
   - Description: 1-1024 chars (required)
   - Directory name must match `name` in frontmatter

6. **Agent modes**:
   - `primary`: Main agents (Tab to switch)
   - `subagent`: Invoked by `@mention` or by primary agents

### When to Run This Command

- After adding/modifying Claude commands or skills
- After major updates to Cursor, GitHub Copilot, or OpenCode documentation
- Before releasing new version of ai-workflow-init package
- When team reports sync issues between platforms
- When adding support for a new AI coding tool
