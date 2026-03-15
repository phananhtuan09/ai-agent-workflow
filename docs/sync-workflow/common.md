# Common Analysis for Workflow Sync

This file contains shared logic for analyzing source files and detecting existing targets.

---

## Source Policy

- Treat `.claude/` as the migration source of truth for workflow sync.
- Read `docs/ai/tooling/capability-map.md` before converting any Claude-specific concept.
- Preserve `.claude` content by default and adapt only the parts required by the target platform.

---

## Step 1: Fetch Latest Documentation (Optional)

**CRITICAL: Fetch latest docs before syncing to ensure format compliance.**

Only fetch documentation for the selected platforms. Use WebSearch or WebFetch.

**Error handling:**
- Web search fails: Use cached knowledge + warn user docs may be outdated
- URL fetch fails: Try alternative URLs or search queries
- Format changed significantly: Alert user, show differences

---

## Step 2: Analyze Source (Claude Code)

Analyze only the asset groups and names selected by the user.

If the user selected:
- `Missing or outdated` -> focus on change detection and skip CURRENT items later
- `Everything selected` -> inventory every selected source item
- `Specific items` -> read only the named `.claude` files

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

### 2c: Analyze Agents

**Tools:**
- Glob(pattern=".claude/agents/*.md")
- Read(file_path=...) for each selected agent

**For each Claude agent, extract:**
- Frontmatter: name, description, tools, model
- Worker role definition
- Expected inputs and outputs
- Tool-specific instructions that may need capability mapping

### 2d: Analyze Output Styles

**Tools:**
- Glob(pattern=".claude/output-styles/*.md")
- Read(file_path=...) for each selected output style

**For each Claude output style, extract:**
- Frontmatter: name, description, keep-coding-instructions
- Mode behavior and hard boundaries
- Any style-specific tool assumptions

### 2e: Analyze Themes and Scripts

**Tools:**
- Glob(pattern=".claude/themes/*")
- Glob(pattern=".claude/scripts/*")
- Read(file_path=...) for each selected file when text inspection is needed

**For selected theme or script assets, extract:**
- File name and type
- Purpose
- Whether direct copy is safe or target-specific wrapping is needed

### 2f: Analyze Base Instructions

**Tools:**
- Read(file_path=".claude/CLAUDE.md")
- Read(file_path="docs/ai/tooling/capability-map.md")

**Build inventory:**
```
| Type    | Name              | Description                          | Location              |
|---------|-------------------|--------------------------------------|-----------------------|
| Command | create-plan       | Generates feature planning doc       | .claude/commands/     |
| Command | execute-plan      | Implements tasks from planning doc   | .claude/commands/     |
| Skill   | figma-extraction  | Extract design from Figma            | .claude/skills/design/|
| Skill   | quality-code-check| Linting and type checking            | .claude/skills/arch/  |
| Agent   | requirement-ba    | Requirement worker role              | .claude/agents/       |
| Style   | brainstorm-partner| Read-only discovery mode             | .claude/output-styles/|
| Asset   | bold-gradient     | Theme preset                         | .claude/themes/       |
| Asset   | preview-component | Workflow helper script               | .claude/scripts/      |
| Rules   | CLAUDE.md         | Base instructions                    | .claude/              |
| Rules   | capability-map    | Cross-tool concept mapping           | docs/ai/tooling/      |
```

---

## Step 3: Detect Existing Target Files

**Tools (run for selected platforms and selected asset groups only):**

### Cursor:
- Glob(pattern=".cursor/commands/*.md")
- Glob(pattern=".cursor/rules/*.md")

### GitHub Copilot:
- Glob(pattern=".github/prompts/*.prompt.md")
- Read(file_path=".github/copilot-instructions.md")

### OpenCode:
- Glob(pattern=".opencode/command/*.md")
- Glob(pattern=".opencode/skill/*/SKILL.md")
- Glob(pattern=".opencode/agent/*.md")

### Factory Droid:
- Glob(pattern=".factory/commands/*.md")
- Glob(pattern=".factory/skills/*/SKILL.md")
- Glob(pattern=".factory/droids/*.md")

### Asset types without native directories:
- If the target platform has no dedicated folder for output styles, themes, or scripts, keep the content in the closest supported location and document the gap in the sync summary.

---

## Step 4: Classify Files

**Compare and classify:**
- **MISSING**: Source exists but not in target
- **OUTDATED**: Target exists but content differs significantly
- **CURRENT**: Target matches source (skip)

Classification rules:
- When scope is `Missing or outdated`, skip CURRENT items from later conversion steps
- When scope is `Specific items`, ignore unselected assets even if they are outdated
- Prefer smaller batches over full-folder sync to reduce failures and long-running conversions

**Output classification example:**
```
[Platform Name]:
  - create-plan: OUTDATED (source modified)
  - execute-plan: CURRENT (skip)
  - sync-workflow: MISSING (new)
```

---

## Tool Reference Conversion (Universal)

Use `docs/ai/tooling/capability-map.md` as the primary mapping reference.

Default rule:
- If the target tool supports the same concept, keep the Claude wording and syntax as close as possible
- If the target tool does not support the same concept, convert the behavior and add a `Tool Mapping` section

Minimal fallback examples:

| Claude Code | Generic Instruction |
|-------------|---------------------|
| `AskUserQuestion(...)` | Ask user for input |
| `Task(subagent_type='Explore')` | Search codebase |
| `Task(subagent_type='General')` | General analysis |
| `Read(file_path=...)` | Read file |
| `Write(file_path=...)` | Write file |
| `Edit(file_path=...)` | Edit file |
| `Glob(pattern=...)` | Find files matching pattern |
| `Grep(pattern=...)` | Search content for pattern |
| `Bash(command=...)` | Run terminal command |
| `WebFetch(url=...)` | Fetch URL content |

---

## Error Handling

- Directory doesn't exist: Create it first with `mkdir -p`
- File write fails: Retry once, then notify user
- Conversion uncertain: Add TODO comment in output file
- Skill name validation fails: Adjust name to meet requirements
