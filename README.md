# AI Agent Workflow

A standardized AI workflow system for modern AI coding assistants. Initialize structured spec, execution, sync, and verification workflows into any repository with one command.

## Features

- **Multi-Platform Support**: Works with Codex, Claude Code, Google Antigravity, and Pi
- **Structured Workflows**: Shape → Recon → Decide → Spec → Execute → Sync → Verify
- **Pre-built Commands**: Spec creation, execution, sync, verification, testing, reviews, and more
- **Reusable Skills**: Verification, quality checks, design fundamentals, theme generation, and more
- **Project Wiki Bootstrap**: Seed a shared `project-wiki/` knowledge base alongside workflow docs
- **Universal Standards**: `AGENTS.md` works across all AI tools
- **Bootstrap Installer**: One command from GitHub, no npm registry required
- **Smart Installation**: Protected files, selective updates, no data loss

## Quick Start

> Requires: [Node.js](https://nodejs.org/) (>= 14)

```bash
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash
```

```powershell
irm https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.ps1 | iex
```

Select your AI tool(s) from the interactive menu using **↑↓** to navigate, **Space** to select, **Enter** to confirm.

---

## Installation Options

### Interactive Installation (Recommended, no npm registry)

```bash
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash
```

```powershell
irm https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.ps1 | iex
```

Choose from:
- **Codex** → `.agents/skills/`, `.agents/roles/`, `.agents/knowledge/`, `.agents/themes/`, and `.codex/`
- **Google Antigravity** → `.agents/skills/`
- **Pi** → `.pi/extensions/`
- **Claude Code** → `.claude/commands/`, `.claude/skills/`, `.claude/themes/`, and supporting Claude config files

Every install also syncs shared workflow assets: `docs/ai/`.

### Pi Review Workflow

Installing for Pi adds the project-local extension at `.pi/extensions/subagent/`.

Available Pi commands:
- `/review-spec @docs/ai/specs/<file>.md` — isolated spec review with concise verdict output
- `/review-plan @docs/ai/plans/<file>.md` — isolated pre-enrichment plan review
- `/enrich-plan-pi @docs/ai/plans/<file>.md [--review-plan]` — enriches plan phases and can opt-in to automatic plan review before enrichment
- `/review-readiness @spec.md @plan.md @detail-1.md [@detail-2.md ...] [--brief]` — isolated readiness review and optional automatic readiness brief
- `/readiness-brief @spec.md @plan.md @detail-1.md [@detail-2.md ...]` — short execution-focus summary for a reviewed artifact packet

Behavior notes for Pi users:
- All review commands require explicit artifact paths.
- Delegated review runs execute in isolated child Pi subprocesses.
- Review output is ephemeral and returned in-session only.
- No review artifact files are written under `docs/ai/` by default or via the opt-in automation flags.

### Install Specific Tool

By default, the installer uses the `coding-standard` kit, which matches the current spec-driven workflow bundle.

Available kits now include:
- `coding-standard` — the current full install flow
- `workflow-eval` — trace-first evaluation standard, session-trace docs, report template, and mirrored evaluation/friction skills

```bash
# Install only Codex
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool codex

# Install only Claude Code
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool claude

# Install only Google Antigravity
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool antigravity

# Install only Pi
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool pi
```

### CLI Help

```bash
# Show supported options and install targets
npx ai-workflow-init --help

# List supported tool ids
npx ai-workflow-init --list-tools

# List supported workflow kits
npx ai-workflow-init --list-kits
```

The CLI help explicitly includes the Pi install target:

```bash
npx ai-workflow-init --tool pi
```

You can also select a workflow kit explicitly:

```bash
npx ai-workflow-init --kit coding-standard --tool codex
npx ai-workflow-init --kit workflow-eval --tool codex
```

```powershell
# Install only Codex
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.ps1))) --tool codex
```

### Install All Tools

```bash
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --all
```

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.ps1))) --all
```

### npm Fallback

#### Install Specific Tool

```bash
# Install only Codex
npx ai-workflow-init --tool codex

# Install only Claude Code
npx ai-workflow-init --tool claude

# Install only Google Antigravity
npx ai-workflow-init --tool antigravity

# Install only Pi
npx ai-workflow-init --tool pi
```

#### Install All Tools

```bash
npx ai-workflow-init --all
```

---

## Core Workflow: Spec → Execute → Sync → Verify

This workflow system follows a verification-first development cycle:

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────────┐
│    SPEC     │ → │   EXECUTE   │ → │  SYNC SPEC   │ → │ VERIFY FEAT. │ → │ VERIFY RUNTIME │
│             │    │             │    │              │    │              │    │                │
│/create-spec │    │/execute-spec│    │ /sync-spec   │    │/verify-feature│   │ /verify-runtime│
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └────────────────┘
```

Legacy planning and test-generation commands are still available, but the default feature workflow is spec-driven and ends with implementation plus runtime verification.

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

#### `/requirements-orchestrator` - Gather Requirements
Structured Q&A to document complex requirements.

**Use Case:** Complex features needing stakeholder input or business logic clarification.

```
User: /requirements-orchestrator
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

#### `/test-web-orchestrator` - Orchestrate Web UI Tests
Run a multi-agent web testing workflow from flexible spec, plan, Figma, and runtime inputs.

**Use Case:** Spec-driven browser testing with UI validation, runtime probing, and verification.

```
User: /test-web-orchestrator
AI: Attach your spec, planning doc, Figma, or runtime notes
User: [attaches feature-login.md + figma-login.md]

→ Creates docs/ai/testing/web-login.md
→ Creates tests/web/login.spec.ts
→ Uses analyst/ui-mapper/runtime-probe/verifier roles
→ Verifies button, input, validation, navigation, and UI state behavior
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

→ Reads `~/.codex/AGENTS.md` and project standards
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

## Workflow Examples

### Standard Workflow (Single-session)

Best for: Small features, quick fixes, solo work.

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────────┐
│    SPEC     │ → │   EXECUTE   │ → │  SYNC SPEC   │ → │ VERIFY FEAT. │ → │ VERIFY RUNTIME │
│             │    │             │    │              │    │              │    │                │
│/create-spec │    │/execute-spec│    │ /sync-spec   │    │/verify-feature│   │ /verify-runtime│
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └────────────────┘
```

```bash
# 1. Create the feature spec
/create-spec "user profile"

# 2. Implement from the spec
/execute-spec @docs/ai/specs/user-profile.md

# 3. Sync durable spec details to implementation
/sync-spec @docs/ai/specs/user-profile.md

# 4. Verify implementation coverage
/verify-feature @docs/ai/specs/user-profile.md

# 5. Verify observable runtime behavior
/verify-runtime @docs/ai/specs/user-profile.md --url http://localhost:3000
```

### Example: Complex Requirements

```bash
# 1. Clarify requirements first
/requirements-orchestrator

# 2. Create plan from requirements
/create-plan docs/ai/requirements/req-checkout-flow.md

# 3. Implement
/execute-plan checkout-flow

# 4. Validate implementation
/check-implementation checkout-flow
```

### Example: Bug Fix with Tests

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

AGENTS.md               # Universal AI instructions (synced to ~/.codex/AGENTS.md)
```

### Tool-Specific Files

| Tool | Commands | Skills | Other |
|------|----------|--------|-------|
| **Codex** | - | `.agents/skills/*/SKILL.md` | `.agents/roles/*.md`, `.agents/knowledge/**`, `.agents/themes/*.theme.json`, `.codex/` |
| **Google Antigravity** | - | `.agents/skills/*/SKILL.md` | - |
| **Claude Code** | `.claude/commands/*.md` | `.claude/skills/*/SKILL.md` | `.claude/themes/`, `.claude/output-styles/`, `.claude/agents/`, `.claude/scripts/`, `.claude/settings.json`, `.claude/statusline.sh` |

---

## Available Skills

Skills provide specialized knowledge that AI agents can load on-demand:

| Skill | Description |
|-------|-------------|
| `brainstorm-partner` | Read-only brainstorming, bug breakdown, feature logic discovery, and option analysis before implementation |
| `quality-code-check` | Linting, type checking, build verification |
| `design-fundamentals` | Typography, colors, spacing, visual hierarchy |
| `design-responsive` | Mobile-first responsive design, breakpoints |
| `theme-factory` | Interactive theme generation based on brand |
| `ux-feedback-patterns` | Loading states, error messages, validation |
| `figma-design-extraction` | Extract design specs from Figma |

---

## Platform Compatibility

| Feature | Codex | Claude | Antigravity |
|---------|-------|--------|-------------|
| Commands | ❌ | ✅ | ❌ |
| Skills | ✅ | ✅ | ✅ |
| Custom Agents | ❌ | ❌ | ❌ |
| AGENTS.md | ✅ | ✅ | ✅ |
| Path-specific rules | ✅ | ❌ | ❌ |

---

## Smart Installation Features

- **Protected Files**: `CODE_CONVENTIONS.md`, `PROJECT_STRUCTURE.md` never overwritten
- **Selective Updates**: Only templates and README updated
- **Temp Bootstrap**: Downloads and extracts in temp directories before syncing
- **Multi-Select**: Choose exactly which tools you need
- **Cross-Platform**: Windows, macOS, Linux

---

## After Installation

1. **Review generated files** in your editor
2. **Customize** `~/.codex/AGENTS.md` for your project's specific rules
3. **Run** `/init-chat` to load project context
4. **Start** with `/create-plan` for your first feature
5. **Commit** the new files so your team can use them

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `node` not found | Install Node.js >= 14 |
| `tar` not found | Install tar or use the PowerShell installer on Windows |
| Permission denied | Run in a directory you own |
| Interactive menu broken | Installer falls back to numbered menu |
| Network error | Check internet, try VPN if blocked |

---

## Contributing

This project maintains workflows for 3 AI coding tools. When adding commands:

1. Add to `.claude/commands/` (source of truth)
2. Keep the supported tool assets in sync when adding or changing workflows
3. Update this README with use cases

---

## License

MIT
