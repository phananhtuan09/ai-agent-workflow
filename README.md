# AI Agent Workflow

A standardized AI workflow system for modern AI coding assistants. Initialize structured spec, execution, sync, and verification workflows into any repository with one command.

## Features

- **Multi-Platform Support**: Works with Codex, Claude Code, Google Antigravity, Pi, and OpenCode
- **Structured Workflows**: Human Design Review → Detailed Spec → AI Review → Execute → Checklist → Verify
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
- **Codex** → `.agents/skills/`, `.agents/roles/`, `.agents/themes/`, and `.codex/`
- **Google Antigravity** → `.agents/skills/`
- **Pi** → `.pi/extensions/`
- **OpenCode** → `.opencode/agents/`
- **Claude Code** → `.claude/commands/`, `.claude/skills/`, `.claude/themes/`, and supporting Claude config files

Every install also syncs shared workflow assets: `docs/ai/`.

### Pi Review Workflow

Installing for Pi adds the project-local extension at `.pi/extensions/subagent/`.

Available Pi commands:
- `/review-spec @docs/ai/features/specs/<file>.md` — isolated spec review with concise verdict output
- `/review-plan @docs/ai/research/plans/<file>.md` — isolated pre-enrichment plan review
- `/enrich-plan-pi @docs/ai/research/plans/<file>.md [--review-plan]` — enriches plan phases and can opt-in to automatic plan review before enrichment
- `/review-readiness @spec.md @plan.md @detail-1.md [@detail-2.md ...] [--brief]` — isolated readiness review and optional automatic readiness brief
- `/readiness-brief @spec.md @plan.md @detail-1.md [@detail-2.md ...]` — short execution-focus summary for a reviewed artifact packet

Behavior notes for Pi users:
- All review commands require explicit artifact paths.
- Delegated review runs execute in isolated child Pi subprocesses.
- Review output is ephemeral and returned in-session only.
- No review artifact files are written under `docs/ai/` by default or via the opt-in automation flags.

### Install Specific Tool

By default, the installer uses the `coding-standard` kit.
It installs the core spec-driven skill bundle and the selected runtime's applicable project assets.

Available kits now include:
- `coding-standard` — core workflow docs and skills
- `workflow-eval` — trace-first evaluation standard, session-trace docs, report template, and mirrored evaluation/friction skills
- `learning-workflow` — case-based learning workflow with durable session state and learning-review helpers

`coding-standard` supports Codex, Claude Code, Google Antigravity, Pi, and OpenCode.
OpenCode currently receives its native agents only; skills are not translated to an OpenCode-specific format.
`workflow-eval` installs its skills for Codex, Claude Code, and Google Antigravity; Pi receives evaluation docs, while OpenCode receives evaluation docs and native agents.
`learning-workflow` supports Codex, Claude Code, and Google Antigravity, but not Pi or OpenCode.

### Installation Matrix

This matrix is the expected project-local output for each supported kit and tool combination.
`coding-standard` additionally synchronizes `~/.codex/AGENTS.md`; its Claude installation also synchronizes the global Claude context and status line.

| Kit | Codex | Claude Code | OpenCode | Google Antigravity | Pi |
| --- | --- | --- | --- | --- | --- |
| `coding-standard` | Full `docs/ai/`, selected `.agents/skills/`, roles, themes, `.codex/config.toml`, and all `.codex/agents/` | Full `docs/ai/`, selected `.claude/skills/`, commands, themes, output styles, scripts, settings, and all `.claude/agents/` | Full `docs/ai/` and all `.opencode/agents/` | Full `docs/ai/` and selected `.agents/skills/` | Full `docs/ai/`, `.pi/extensions/`, and `.pi/workflows/` |
| `workflow-eval` | Evaluation docs, evaluation skills, and all `.codex/agents/` | Evaluation docs, evaluation skills, and all `.claude/agents/` | Evaluation docs and all `.opencode/agents/` | Evaluation docs and evaluation skills | Evaluation docs only |
| `learning-workflow` | Learning docs, learning skills, and all `.codex/agents/` | Learning docs, learning skills, and all `.claude/agents/` | Unsupported | Learning docs and learning skills | Unsupported |

OpenCode does not receive skill bundles because the repository has no OpenCode-specific skill adapter.
Any supported kit for Codex, Claude Code, or OpenCode copies the complete corresponding subagent folder.

```bash
# Install only Codex
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool codex

# Install only Claude Code
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool claude

# Install only Google Antigravity
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool antigravity

# Install only Pi
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool pi

# Install only OpenCode agents
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool opencode
```

### CLI Help

```bash
# Show supported options and install targets
npx ai-workflow-init --help

# List supported tool ids
npx ai-workflow-init --list-tools

# List supported workflow kits
npx ai-workflow-init --list-kits

# List available skill bundles
npx ai-workflow-init --list-bundles
```

The CLI help explicitly includes the Pi install target:

```bash
npx ai-workflow-init --tool pi
```

You can also select a workflow kit explicitly:

```bash
npx ai-workflow-init --kit coding-standard --tool codex
npx ai-workflow-init --kit workflow-eval --tool codex
npx ai-workflow-init --kit learning-workflow --tool codex
npx ai-workflow-init --kit coding-standard --tool codex --skill refactor --skill quality-code-check
npx ai-workflow-init --kit coding-standard --tool codex --bundle frontend
```

Skills are maintained canonically under `skills/` and adapted to `.agents/skills/` or `.claude/skills/` for each runtime.
Use `npm run sync-skills` after changing a canonical skill.

Each kit installs its default skill bundle.
Use repeatable `--skill <id>` or `--bundle <id>` flags to add skills to that kit.
Duplicate skills are installed once.
Do not use `--all` with `learning-workflow`, because that target includes unsupported Pi and OpenCode runtimes.

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

# Install only OpenCode agents
npx ai-workflow-init --tool opencode
```

#### Install All Tools

```bash
npx ai-workflow-init --all
```

---

## Core Workflow: Design Review → Detailed Spec → AI Review → Execute → Checklist → Verify

This workflow system separates high-level human decisions from the detailed AI execution contract:

```
/design-spec → human HTML approval → /create-spec → review-spec → /execute-spec → /manual-checklist → /verify-feature → /verify-runtime
```

`/design-spec` opens a local HTML review through the bundled runner and persists approved high-level decisions.
`/create-spec` converts those decisions and codebase evidence into a detailed implementation specification.
`review-spec` is an automatic AI quality gate; the human does not need to review the full detailed spec unless they choose to.
`/manual-checklist` creates spec-derived testcases after execution, and both verification steps update its evidence icons.
The completed workflow returns the checklist as the primary human validation artifact.
`/sync-spec` and `/review-pr` remain human-triggered tools outside the automated feature workflow.

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

→ Creates: docs/ai/research/plans/feature-user-authentication.md
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

→ Creates: docs/ai/research/ideas/req-checkout-flow.md
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

→ AI reads docs/ai/research/plans/feature-user-authentication.md
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

→ Creates docs/ai/features/verifications/web-login.md
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

→ Runs only tests listed in docs/ai/features/checklists/unit-user-authentication.md
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

Best for: Features and user-visible changes that need durable product decisions and detailed implementation guidance.
Use `/execute-task` for small bounded updates that do not need a design artifact.

```
/design-spec → human HTML approval → /create-spec → review-spec → /execute-spec → /manual-checklist → /verify-feature → /verify-runtime
```

```bash
# 1. Review and approve the high-level design in the local HTML runner
/design-spec "user profile"

# 2. Create the detailed implementation spec from approved decisions
/create-spec @docs/ai/features/design-decisions/user-profile.json

# 3. Run the AI spec quality gate
/review-spec @docs/ai/features/specs/user-profile.md

# 4. Implement from the reviewed spec
/execute-spec @docs/ai/features/specs/user-profile.md

# 5. Generate testcases from the approved spec
/manual-checklist @docs/ai/features/specs/user-profile.md

# 6. Verify implementation coverage and update checklist evidence
/verify-feature @docs/ai/features/specs/user-profile.md

# 7. Verify runtime behavior and finalize checklist evidence
/verify-runtime @docs/ai/features/specs/user-profile.md --url http://localhost:3000
```

Run `/sync-spec` or `/review-pr` separately when human review calls for those steps.

### Example: Complex Requirements

```bash
# 1. Clarify requirements first
/requirements-orchestrator

# 2. Create plan from requirements
/create-plan docs/ai/research/ideas/req-checkout-flow.md

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

## Coding-Standard Assets

The installation matrix above is authoritative for every kit.
The following detail describes the full `coding-standard` installation only.

### Documentation
```
docs/ai/
├── project/            # Workflow rules and project standards
├── workflows/          # Workflow definitions and run state
├── features/           # Grouped feature artifacts
├── research/           # Ideas, plans, and brainstorms
├── evaluation/         # Observations, traces, and reports
└── knowledge/          # Architecture and domain records

AGENTS.md               # Universal AI instructions (synced to ~/.codex/AGENTS.md)
```

### Tool-Specific Files

| Tool | Commands | Skills | Other |
|------|----------|--------|-------|
| **Codex** | - | Selected `.agents/skills/*/SKILL.md` | `.agents/roles/*.md`, `.agents/themes/*.theme.json`, `.codex/` |
| **Google Antigravity** | - | Selected `.agents/skills/*/SKILL.md` | - |
| **OpenCode** | - | - | `.opencode/agents/*.md` |
| **Pi** | - | - | `.pi/extensions/`, `.pi/workflows/` |
| **Claude Code** | `.claude/commands/*.md` | Selected `.claude/skills/*/SKILL.md` | `.claude/themes/`, `.claude/output-styles/`, `.claude/agents/`, `.claude/scripts/`, `.claude/settings.json`, `.claude/statusline.sh` |

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
