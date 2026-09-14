# AI Agent Workflow

A repository-driven protocol for AI coding assistants, with optional capability skills and two additive capabilities: workflow evaluation and learning.

## Design

The default path is direct execution:

1. Read the requested outcome and the smallest relevant repository authority.
2. Make the smallest coherent change.
3. Prove the changed behavior with the cheapest reliable check.
4. Report observed evidence and remaining risk.

There is no required design/specification/execution/verification chain and no coordinator state.

## Canonical repository structure

```text
AGENTS.md

docs/
├── WORKFLOW.md          # authority, work shapes, durable memory, proof
├── product/             # accepted product and domain behavior
├── decisions/           # architecture, security, compatibility, operations
├── plans/               # active and completed durable working memory
├── patterns/            # accepted recurring technical patterns
├── runbooks/            # verified operating procedures
├── evaluation/          # optional workflow evaluation capability
└── learning/            # optional learning capability
```

`docs/evaluation/` and `docs/learning/` are independent optional namespaces.
They are not product authority and are not loaded by ordinary coding work.

## Install

Requires Node.js >= 14.

```bash
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash
```

Or install a selected target:

```bash
npx ai-workflow-init --kit coding-standard --tool codex
npx ai-workflow-init --kit coding-standard --tool claude
npx ai-workflow-init --kit coding-standard --tool antigravity
npx ai-workflow-init --kit coding-standard --tool pi
npx ai-workflow-init --kit coding-standard --tool opencode
```

The default `coding-standard` kit installs the repository protocol and no skills. Add only capabilities that materially help:

```bash
npx ai-workflow-init --tool codex --skill refactor --skill quality-code-check
npx ai-workflow-init --tool codex --bundle frontend
npx ai-workflow-init --tool claude --bundle backend
```

Supported tools: Codex, Claude Code, Google Antigravity, Pi, and OpenCode.

- Codex and Antigravity use `.agents/skills/`.
- Claude Code uses `.claude/skills/`.
- Claude project installs generate `.claude/CLAUDE.md` from the current `AGENTS.md` protocol, while global instruction installs use the preserved legacy context in `.claude/CLAUDE.global.md`.
- OpenCode receives native agents only when a selected kit requires them.
- Pi uses the repository protocol directly and receives no workflow extension.
- Existing project and global instruction files are preserved.

## Optional Capabilities

### Workflow evaluation

```bash
npx ai-workflow-init --kit workflow-eval --tool codex
```

Installs the core repository protocol when it is not already tracked, then adds `workflow-evaluation` and `record-workflow-friction`, plus:

- `docs/evaluation/STANDARD.md`
- `docs/evaluation/templates/report.html`
- `docs/evaluation/observations/`
- `docs/evaluation/reports/`
- `docs/evaluation/session-traces/`

Evaluation is trace-first when runtime history exists and artifact-first only when that scope is explicit.

### Learning workflow

```bash
npx ai-workflow-init --kit learning-workflow --tool codex
```

Installs the core repository protocol when it is not already tracked, then adds the learning coordinator and focused helpers, plus:

- `docs/learning/CONSTITUTION.md`
- `docs/learning/STANDARD.md`
- `docs/learning/project.json`
- `docs/learning/schedule.json`
- `docs/learning/cases/`
- `docs/learning/sessions/`

The learning capability is separate from ordinary coding execution and supports Codex, Claude Code, and Google Antigravity.

## CLI

```bash
npx ai-workflow-init --help
npx ai-workflow-init --list-tools
npx ai-workflow-init --list-kits
npx ai-workflow-init --list-bundles
```

Skills are maintained canonically under `skills/`. Runtime copies for Codex and Claude Code are generated adapters:

```bash
npm run sync-skills
npm run check-skills
```

## Updating an installation

Updates are dry-run by default:

```bash
npx ai-workflow-init update
npx ai-workflow-init update --apply
```

The updater records explicit ownership in `.ai-workflow/installed.json`.
The state tracks the core repository protocol separately from installed addons such as evaluation and learning.
Updates apply to all tracked core and addon surfaces, update only unchanged managed files, preserve local and unknown collisions, and keep pre-hard-cut legacy files in place rather than deleting consumer history automatically.
Pre-existing files are not adopted merely because their bytes match the installer source.

## Development checks

```bash
npm test
npm run check-skills
```

## License

MIT
