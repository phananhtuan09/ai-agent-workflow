---
name: build-workflow-guide
description: Interactively guide the user to build a Claude Code AI agent workflow from scratch — detects project type, creates .claude/ files, and explains each decision.
---

# Build AI Agent Workflow

You are guiding the user to build a production-ready Claude Code workflow from scratch.

**Reference implementation**: https://github.com/phananhtuan09/ai-agent-workflow
Clone it to get everything pre-built, or follow this guide to build step by step.

---

## Step 1: Detect Project Context

Run these in parallel:
- Check if `.claude/` folder exists
- Check if `CLAUDE.md` exists
- Read `package.json`, `composer.json`, `pyproject.toml`, `go.mod`, `Cargo.toml` (whichever exists) to detect project type
- List root-level files/folders to understand project structure

Then tell the user:
- What you found (project type, framework, existing workflow files)
- What will be created

Ask the user ONE question: **"Do you want me to build the full workflow now, or do you want to review each step first?"**

Wait for their answer before proceeding.

---

## Step 2: Create `.claude/CLAUDE.md`

Create `.claude/CLAUDE.md` (NOT root `CLAUDE.md`) with this structure, adapted to the detected project:

```markdown
# [Project Name] Workflow Standards

## Core Coding Philosophy

### 1. Simplicity First
- Choose simplest solution that meets requirements
- Think ahead ONLY for: Security, Performance
- No abstractions for one-time operations

### 2. Deep Understanding
- Ask first when requirements are unclear
- Batch related questions into one block

### 3. Multiple Options When Appropriate
- Offer options only when genuine trade-offs exist
- If one option is clearly better, recommend it directly

---

## Workflow Guidelines

**Tooling:**
- Prefer semantic search; grep for exact matches only
- Run independent operations in parallel

**Communication:**
- Backticks for `files/functions/classes`
- Code and comments in English

**[Project-specific section — add based on detected stack]:**
- How to run tests: [detected test command]
- How to run dev server: [detected dev command]
- Build command: [detected build command]
- Files NOT to modify: [vendor/, node_modules/, generated files]

**TODO Management:**
- Create todos for medium/large tasks (≤14 words, verb-led)
- Keep ONE `in_progress` item only
```

After creating, tell the user what you added and why.

---

## Step 3: Create `.claude/settings.json`

Create `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Write",
      "Glob",
      "Grep",
      "WebFetch",
      "WebSearch",
      "Bash(*)"
    ],
    "deny": [
      "Bash(rm -rf*)",
      "Bash(sudo*)",
      "Bash(git commit*)",
      "Bash(git push*)",
      "Bash(git reset --hard*)",
      "Bash(git checkout -- *)"
    ]
  }
}
```

Explain to the user:
- `deny` blocks destructive operations — Claude will ask before doing them
- They can always approve individual actions when prompted
- Git commit/push requires explicit user confirmation (not auto-executed)

---

## Step 4: Create Core Commands

Create these files in `.claude/commands/`. For each one, tell the user what it does before creating it.

### `.claude/commands/fix-bug.md`

```markdown
---
name: fix-bug
description: Fix a bug using reproduce → isolate → minimal fix → regression prevention.
---

Fix the reported bug following this discipline:

1. **Reproduce**: Understand the bug from the report. Find the exact file and line causing it.
2. **Isolate**: Read the surrounding code. Identify root cause, not just symptoms.
3. **Minimal fix**: Make the smallest change that fixes the root cause. No refactoring during bug fix.
4. **Prevent regression**: Add a test or note what to watch for.

After fixing, summarize:
- Root cause found
- What was changed and why
- How to verify the fix
```

### `.claude/commands/code-review.md`

```markdown
---
name: code-review
description: Review changed files for correctness, security, and project standards conformance.
---

Review the current changes (run `git diff` to see them).

Check in this order:
1. **Correctness**: Does the logic match the intended behavior?
2. **Security**: Any SQL injection, XSS, unvalidated input, exposed secrets?
3. **Standards**: Follows project conventions in CLAUDE.md?
4. **Tests**: Are there tests for new behavior?

Output format:
- 🔴 Critical (must fix before merge)
- 🟡 Suggestion (worth fixing)
- 🟢 Good (patterns worth noting)

Be specific: include file path and line number for each finding.
```

### `.claude/commands/create-plan.md`

```markdown
---
name: create-plan
description: Generate a feature planning doc with phased implementation tasks before writing any code.
---

Before writing any code, create a plan for: $ARGUMENTS

## Process

1. **Investigate**: Read relevant existing code to understand current structure
2. **Plan**: Break the feature into phases with specific tasks
3. **Save**: Write the plan to `docs/ai/planning/[date]-feature-[name].md`

## Plan format:

```markdown
# Feature: [Name]
Date: [today]

## Goal
[One sentence]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Implementation Plan

### Phase 1: [Name]
- [ ] Task 1 — [file to change, what to change]
- [ ] Task 2

### Phase 2: [Name]
- [ ] Task 3

## Follow-ups
[Things to address after this feature]
```

After creating the plan, show it to the user and ask: "Should I proceed with implementation, or do you want to adjust the plan first?"
```

### `.claude/commands/audit-workflow.md`

```markdown
---
name: audit-workflow
description: Audit the Claude Code workflow configuration and provide improvement recommendations.
---

Analyze the workflow configuration in this project.

## What to check

Read and analyze in parallel:
- `.claude/CLAUDE.md`
- `.claude/settings.json`
- All files in `.claude/commands/*.md`
- All files in `.claude/agents/*.md` (if folder exists)
- All `SKILL.md` files in `.claude/skills/*/` (if folder exists)

## Evaluation criteria

**CLAUDE.md**: Under 200 lines? No redundant info? Actionable instructions only?

**Commands**: Clear purpose? No duplication between commands? Each command has a specific trigger?

**Agents**: Single responsibility? Clear input/output? Appropriate tool restrictions?

**Settings**: Permissions appropriate? No overly broad allows? Destructive ops denied?

## Output format

```markdown
## Workflow Audit Report

### Summary
| Component | Count | Issues |
|-----------|-------|--------|
| Commands  | X     | Y      |
| Agents    | X     | Y      |

### 🔴 Critical Issues
[Must fix]

### 🟡 Improvements
[Should fix]

### 🟢 Good Patterns
[Keep doing this]

### Recommendations
1. [Specific action] — Impact: [what improves] — Effort: Low/Medium/High
```
```

---

## Step 5: Explain What's Next

After creating all files, tell the user:

```
Workflow is set up. Here's what you have:

Commands you can use now:
- /fix-bug [describe the bug]
- /code-review
- /create-plan [feature name]
- /audit-workflow

To expand further, consider adding:
- Agents for specialized tasks (requirement gathering, code review, testing)
- Skills for reusable capabilities (frontend patterns, code quality checks)

Full reference with 14 agents + 20 commands:
https://github.com/phananhtuan09/ai-agent-workflow
```

Then ask: **"Want me to add agents for a specific workflow (requirement gathering, testing, etc.)?"**

---

## Execution Rules

- Create each file and immediately explain what it does and why
- If a file already exists, read it first and ask before overwriting
- Never create files outside `.claude/` without asking
- Always show the user what was created at the end with a summary list
