# Common Analysis for Workflow Sync

This file contains shared logic for analyzing source files and detecting existing targets.

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

**Tools (run for selected platforms only):**

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

---

## Step 4: Classify Files

**Compare and classify:**
- **MISSING**: Source exists but not in target
- **OUTDATED**: Target exists but content differs significantly
- **CURRENT**: Target matches source (skip)

**Output classification example:**
```
[Platform Name]:
  - create-plan: OUTDATED (source modified)
  - execute-plan: CURRENT (skip)
  - sync-workflow: MISSING (new)
```

---

## Tool Reference Conversion (Universal)

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
