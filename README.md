# AI Agent Workflow

A standardized AI workflow system for modern AI coding assistants. Initialize structured planning, implementation, testing, and review workflows into ANY repository with ONE command.

## Features

- **Multi-Platform Support**: Works with Cursor, GitHub Copilot, Claude Code, OpenCode, and Factory Droid
- **Structured Workflows**: Plan → Implement → Test → Review methodology
- **14 Pre-built Commands**: Create plans, execute tasks, run tests, code reviews, and more
- **7 Reusable Skills**: Design fundamentals, accessibility, theme generation, quality checks
- **Universal Standards**: `AGENTS.md` works across all AI tools
- **Smart Installation**: Protected files, selective updates, no data loss

## Quick Start

> Requires: [Node.js](https://nodejs.org/) (>= 14)

```bash
npx ai-workflow-init
```

Select your AI tool(s) from the interactive menu using **↑↓** to navigate, **Space** to select, **Enter** to confirm.

---

## Installation Options

### Interactive Installation (Recommended)

```bash
npx ai-workflow-init
```

Choose from:
- **Cursor** → `.cursor/commands/` and `.cursor/rules/`
- **GitHub Copilot** → `.github/prompts/` and `.github/copilot-instructions.md`
- **Claude Code** → `.claude/commands/`, `.claude/skills/`, `.claude/themes/`
- **OpenCode** → `.opencode/command/`, `.opencode/skill/`, `.opencode/agent/`
- **Factory Droid** → `.factory/commands/`, `.factory/skills/`, `.factory/droids/`

### Install Specific Tool

```bash
# Install only Claude Code
npx ai-workflow-init --tool claude

# Install only Cursor
npx ai-workflow-init --tool cursor

# Install only OpenCode
npx ai-workflow-init --tool opencode

# Install only Factory Droid
npx ai-workflow-init --tool factory

# Install only GitHub Copilot
npx ai-workflow-init --tool copilot
```

### Install All Tools

```bash
npx ai-workflow-init --all
```

---

## Core Workflow: Plan → Implement → Test → Review

This workflow system follows a 4-phase development cycle:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    PLAN     │ → │  IMPLEMENT  │ → │    TEST     │ → │   REVIEW    │
│             │    │             │    │             │    │             │
│ /create-plan│    │/execute-plan│    │/writing-test│    │/code-review │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Use Cases & Commands

### 📋 Planning Phase

#### `/create-plan` - Generate Feature Plan
Create a structured implementation plan before coding.

**Use Case:** Starting a new feature, refactoring, or complex bug fix.

```
User: /create-plan
AI: What feature are you building?
User: User authentication with JWT tokens

→ Creates: docs/ai/planning/feature-user-authentication.md
  - Goal & acceptance criteria
  - Implementation phases with pseudo-code
  - Risks & assumptions
  - Definition of done
```

#### `/clarify-requirements` - Gather Requirements
Structured Q&A to document complex requirements.

**Use Case:** Complex features needing stakeholder input or business logic clarification.

```
User: /clarify-requirements
AI: What feature needs clarification?
User: E-commerce checkout flow

→ Creates: docs/ai/requirements/req-checkout-flow.md
  - Problem statement
  - User stories
  - Business rules
  - Edge cases
  - Acceptance criteria
```

---

### 🔨 Implementation Phase

#### `/execute-plan` - Implement Tasks
Execute the planning doc, updating checkboxes as work progresses.

**Use Case:** Implementing features from an existing plan.

```
User: /execute-plan user-authentication

→ AI reads docs/ai/planning/feature-user-authentication.md
→ Implements Phase 1: Database Schema
→ Updates [ ] → [x] in planning doc
→ Continues to Phase 2...
```

#### `/modify-plan` - Change Approach
Modify plan after partial implementation.

**Use Case:** Requirements changed mid-development, or need to revert approach.

```
User: /modify-plan user-authentication
AI: What needs to change?
User: Switch from JWT to session-based auth

→ Updates planning doc
→ Resets affected phases to [ ]
→ Adds modification history
```

---

### 🧪 Testing Phase

#### `/writing-test` - Generate Unit Tests
Create comprehensive unit tests with edge cases.

**Use Case:** After implementing logic, need test coverage.

```
User: /writing-test user-authentication

→ Reads planning doc for acceptance criteria
→ Creates tests/unit/user-authentication.spec.ts
→ Covers: happy path, edge cases, error handling
→ Runs tests and shows coverage report
```

#### `/writing-integration-test` - Generate E2E Tests
Create Playwright integration tests for UI flows.

**Use Case:** Testing user journeys and UI interactions.

```
User: /writing-integration-test login-page

→ Creates tests/integration/login-page.e2e.spec.ts
→ Tests: form submission, validation, navigation
→ Uses stable selectors (getByRole, getByLabel)
```

#### `/run-test` - Execute Tests
Run tests from test documentation files.

**Use Case:** Running specific feature tests, not entire suite.

```
User: /run-test
AI: Which test doc?
User: unit-user-authentication

→ Runs only tests listed in docs/ai/testing/unit-user-authentication.md
→ Shows pass/fail summary
→ Updates test doc with results
```

---

### 🔍 Review Phase

#### `/code-review` - Standards Conformance
Local code review before pushing.

**Use Case:** Pre-commit/pre-PR validation.

```
User: /code-review
AI: Review scope?
User: PR Style against main

→ Part 1: Standards Conformance (strict)
  - Naming conventions
  - Import order
  - File structure

→ Part 2: Quality Review (reasoning)
  - Logic bugs
  - Security vulnerabilities
  - Performance issues
```

#### `/senior-review` - Quality Review
Senior developer perspective on code quality.

**Use Case:** Deep review focusing on clean code, maintainability, design.

```
User: /senior-review
AI: Which files?
User: PR against develop

→ Reviews: Clean Code, Readability, Maintainability
→ Checks: Design patterns, Security, Performance
→ Provides: Star ratings per category, actionable feedback
```

#### `/check-implementation` - Validate Against Plan
Ensure implementation matches planning doc.

**Use Case:** Before marking feature complete.

```
User: /check-implementation user-authentication

→ Compares code against planning doc
→ Checks: completed tasks have code, acceptance criteria met
→ Reports: mismatches, missing implementations
```

---

### 🛠 Utility Commands

#### `/init-chat` - Load Project Rules
Initialize chat with project conventions.

```
User: /init-chat

→ Reads AGENTS.md and project standards
→ Confirms: workflow, tooling, communication rules
```

#### `/generate-standards` - Create Conventions
Auto-generate code conventions from codebase.

```
User: /generate-standards

→ Analyzes: package.json, folder structure, code patterns
→ Creates: CODE_CONVENTIONS.md, PROJECT_STRUCTURE.md
```

#### `/write-dev-docs` - Technical Documentation
Document programming techniques.

```
User: /write-dev-docs memoization

→ Creates: docs/dev/memoization.md
→ Includes: concepts, examples, best practices, trade-offs
```

#### `/sync-workflow` - Sync Across Tools
Sync Claude workflows to other platforms.

```
User: /sync-workflow

→ Fetches latest platform docs
→ Converts commands/skills to Cursor, Copilot, OpenCode
→ Updates AGENTS.md
```

---

## Beads Integration (Optional)

[Beads](https://github.com/steveyegge/beads) is a lightweight issue tracker with first-class dependency support. This workflow integrates seamlessly with Beads for multi-session task management.

### Setup Beads

1. **Install Beads**: Follow the official docs at https://github.com/steveyegge/beads

2. **Setup for Claude Code**:
   ```bash
   bd setup claude
   ```

3. **Verify installation**:
   ```bash
   bd doctor
   ```

### Beads Commands

| Command | Description |
|---------|-------------|
| `/beads-breakdown` | Analyze feature → create epic with tasks and dependencies |
| `/beads-create-epic-plan` | Create high-level epic plan document |
| `/beads-next` | Show ready tasks, claim a task, set context |
| `/beads-done` | Close task, sync to git, show next ready tasks |
| `/beads-status` | Show epic progress, metrics, dependency graph |

---

## Workflow Examples

### Workflow A: With Beads (Multi-session, Dependencies)

Best for: Large features, team collaboration, work that spans multiple sessions.

```
┌──────────────┐    ┌───────────────────┐    ┌─────────────┐
│ /beads-      │ → │ /beads-create-    │ → │ /beads-next │
│ breakdown    │    │ epic-plan         │    │             │
└──────────────┘    └───────────────────┘    └──────┬──────┘
                                                    │
┌──────────────┐    ┌───────────────────┐    ┌──────▼──────┐
│ /beads-done  │ ← │ /execute-plan     │ ← │ /create-plan│
│              │    │                   │    │             │
└──────────────┘    └───────────────────┘    └─────────────┘
       │
       └──────→ Loop back to /beads-next for next task
```

```bash
# 1. Break down feature into epic with tasks
/beads-breakdown "User authentication with JWT"

# 2. Create high-level epic plan (architecture, data flow)
/beads-create-epic-plan

# 3. Claim a ready task
/beads-next

# 4. Create detailed plan for claimed task
/create-plan

# 5. Implement the task
/execute-plan jwt-infrastructure

# 6. Complete task, sync, see next ready tasks
/beads-done

# 7. Repeat from step 3 for remaining tasks
/beads-next
```

### Workflow B: Without Beads (Single-session)

Best for: Small features, quick fixes, solo work.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    PLAN     │ → │  IMPLEMENT  │ → │    TEST     │ → │   REVIEW    │
│             │    │             │    │             │    │             │
│ /create-plan│    │/execute-plan│    │/writing-test│    │/code-review │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

```bash
# 1. Plan the feature
/create-plan

# 2. Implement phase by phase
/execute-plan user-profile

# 3. Write tests
/writing-test user-profile

# 4. Review before PR
/code-review
```

### When to Use Which Workflow?

| Scenario | Recommended Workflow |
|----------|---------------------|
| Feature takes < 1 session | **Without Beads** |
| Feature spans multiple sessions | **With Beads** |
| Multiple developers on same feature | **With Beads** |
| Tasks have dependencies | **With Beads** |
| Quick bug fix | **Without Beads** |
| Complex epic with 5+ tasks | **With Beads** |

---

### Example: Complex Requirements (Without Beads)

```bash
# 1. Clarify requirements first
/clarify-requirements

# 2. Create plan from requirements
/create-plan docs/ai/requirements/req-checkout-flow.md

# 3. Implement
/execute-plan checkout-flow

# 4. Validate implementation
/check-implementation checkout-flow
```

### Example: Bug Fix with Tests (Without Beads)

```bash
# 1. Quick plan for the fix
/create-plan

# 2. Implement fix
/execute-plan payment-validation-fix

# 3. Add regression tests
/writing-test payment-validation

# 4. Senior review for quality
/senior-review
```

---

## What Gets Installed

### Always Installed
```
docs/ai/
├── planning/           # Feature planning docs
│   └── feature-template.md
├── requirements/       # Requirement docs
│   └── req-template.md
├── testing/            # Test documentation
│   ├── unit-template.md
│   └── integration-template.md
└── project/            # Project standards
    ├── CODE_CONVENTIONS.md
    └── PROJECT_STRUCTURE.md

AGENTS.md               # Universal AI instructions
```

### Tool-Specific Files

| Tool | Commands | Skills | Other |
|------|----------|--------|-------|
| **Cursor** | `.cursor/commands/*.md` | `.cursor/rules/` | `.cursor/CLAUDE.md` |
| **GitHub Copilot** | `.github/prompts/*.prompt.md` | - | `.github/copilot-instructions.md` |
| **Claude Code** | `.claude/commands/*.md` | `.claude/skills/*/SKILL.md` | `.claude/CLAUDE.md`, `.claude/themes/` |
| **OpenCode** | `.opencode/command/*.md` | `.opencode/skill/*/SKILL.md` | `.opencode/agent/`, `opencode.json` |
| **Factory Droid** | `.factory/commands/*.md` | `.factory/skills/*/SKILL.md` | `.factory/droids/*.md` |

---

## Available Skills

Skills provide specialized knowledge that AI agents can load on-demand:

| Skill | Description |
|-------|-------------|
| `quality-code-check` | Linting, type checking, build verification |
| `design-fundamentals` | Typography, colors, spacing, visual hierarchy |
| `design-responsive` | Mobile-first responsive design, breakpoints |
| `theme-factory` | Interactive theme generation based on brand |
| `ux-accessibility` | WCAG compliance, keyboard navigation, ARIA |
| `ux-feedback-patterns` | Loading states, error messages, validation |
| `figma-design-extraction` | Extract design specs from Figma |

---

## Platform Compatibility

| Feature | Cursor | Copilot | Claude | OpenCode | Factory Droid |
|---------|--------|---------|--------|----------|---------------|
| Commands | ✅ | ✅ | ✅ | ✅ | ✅ |
| Skills | ✅ | ❌ | ✅ | ✅ | ✅ |
| Custom Agents | ❌ | ❌ | ❌ | ✅ | ✅ (Droids) |
| AGENTS.md | ✅ | ✅ | ✅ | ✅ | ✅ |
| Path-specific rules | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Smart Installation Features

- **Protected Files**: `CODE_CONVENTIONS.md`, `PROJECT_STRUCTURE.md` never overwritten
- **Selective Updates**: Only templates and README updated
- **Safe Cloning**: Uses temp directories, no data loss
- **Multi-Select**: Choose exactly which tools you need
- **Cross-Platform**: Windows, macOS, Linux

---

## After Installation

1. **Review generated files** in your editor
2. **Customize** `AGENTS.md` for your project's specific rules
3. **Run** `/init-chat` to load project context
4. **Start** with `/create-plan` for your first feature
5. **Commit** the new files so your team can use them

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `npx` not found | Install Node.js >= 14 |
| Permission denied | Run in a directory you own |
| Interactive menu broken | Installer falls back to numbered menu |
| Network error | Check internet, try VPN if blocked |

---

## Contributing

This project maintains workflows for 5 AI coding tools. When adding commands:

1. Add to `.claude/commands/` (source of truth)
2. Run `/sync-workflow` to propagate to other tools
3. Update this README with use cases

---

## License

MIT
