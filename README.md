# AI Agent Workflow

A repository-driven protocol for AI coding assistants, with optional testing, workflow-evaluation, and learning capabilities.

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
├── testing/             # optional durable runtime E2E plans and evidence
├── evaluation/          # optional workflow evaluation capability
└── learning/            # optional learning capability
```

`docs/testing/`, `docs/evaluation/`, and `docs/learning/` are independent optional namespaces.
They are not product authority and are not loaded by ordinary coding work.

## Install

Requires Node.js >= 14.
Run installation commands from the target application's root directory.
For the protocol described by this branch, use the GitHub installer and select the kit and runtime explicitly:

```bash
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --kit coding-standard --tool codex
```

Replace `codex` with `claude`, `antigravity`, `pi`, or `opencode` for another runtime.
If the installer displays optional bundle or skill menus, leave them empty for a core-only installation.
The bundle named `core` contains optional skills; it is not required by the `coding-standard` kit.

Alternatively, install the latest published npm release:

```bash
npx ai-workflow-init@latest --kit coding-standard --tool codex
```

The GitHub installer downloads `main`; npm installs the published package, which can differ from this branch.
Record which source or revision you used when comparing installations.
To install from an already checked-out revision, run `node /absolute/path/to/ai-agent-workflow/cli.js --kit coding-standard --tool codex` from the target project.

The default `coding-standard` kit installs the repository protocol and no skills.
Add only capabilities that materially help:

```bash
npx ai-workflow-init@latest --kit coding-standard --tool codex --skill refactor --skill quality-code-check
npx ai-workflow-init@latest --kit coding-standard --tool claude --bundle testing
```

Supported tools: Codex, Claude Code, Google Antigravity, Pi, and OpenCode.

- Codex and Antigravity use `.agents/skills/`.
- Claude Code uses `.claude/skills/`.
- Claude project installs generate `.claude/CLAUDE.md` from the current `AGENTS.md` protocol, while global instruction installs use the preserved legacy context in `.claude/CLAUDE.global.md`.
- OpenCode receives native agents only when a selected kit requires them.
- Pi uses the repository protocol directly and receives no workflow extension.
- Existing project and global instruction files are preserved.

### Existing instructions and legacy installations

Installation success does not mean existing instructions were migrated.
The installer preserves existing `AGENTS.md`, `docs/WORKFLOW.md`, runtime instruction files, and selected skill directories.
An old `AGENTS.md` can therefore remain alongside a newly installed `docs/WORKFLOW.md`.

When installing the current protocol into an existing project:

1. Inspect the target project's instructions and the installer's preserved/skipped-file messages.
2. Compare its `AGENTS.md` and `docs/WORKFLOW.md` with those from the same installer source revision.
3. Preserve project-specific rules and back up or commit the existing instructions before editing them.
4. When migration is authorized, replace the obsolete workflow routing with the current repository-driven protocol while retaining those project-specific rules.
5. Check applicable parent-directory and global instructions for conflicting routing, and report conflicts outside the authorized project scope.

The legacy `/create-spec → /create-plan → /enrich-plan → /execute-plan → /verify-feature` chain is not the current core workflow.
Do not install legacy skills merely to satisfy that obsolete routing.
Keep historical artifacts unless their removal is explicitly requested.

For Codex and Claude, the installer also attempts to create missing global instructions from the preserved legacy `.claude/CLAUDE.global.md` template.
Existing global instructions are preserved.
That template is not the source for the current project protocol; use the repository-root `AGENTS.md` and `docs/WORKFLOW.md` instead.

### Installation handoff for AI assistants

Before reporting that installation is complete, verify:

- The target project's `AGENTS.md` points to `docs/WORKFLOW.md`, and both describe direct repository-driven execution without a mandatory phase chain.
- Existing project-specific rules remain intact, and any unresolved instruction conflicts are identified.
- For Claude, `.claude/CLAUDE.md` also reflects the current project protocol while preserving project-specific rules.
- Only requested optional skills were added; no skill is necessary for core-only use.
- No product specification, implementation plan, or design exercise was started merely to install the workflow.
- The handoff lists the source/revision, selected kit/runtime, added skills, and preserved files that still need migration.

For an A/B benchmark, also inspect globally available skills and instructions in both sessions.
A folder without local workflow files may still use global skills such as Impeccable.
Keep runtime versions, available verification tools, and starting application files equivalent across both sides.

## Optional Capabilities

### Durable knowledge management

```bash
npx ai-workflow-init@latest --kit coding-standard --tool codex --skill manage-project-knowledge
```

The `manage-project-knowledge` skill finds and explains durable repository knowledge without requiring the human to know its file location, and creates or updates artifacts only when explicitly requested.
It discovers eligible artifact namespaces through `docs/README.md` and follows each namespace's local `README.md` contract instead of carrying fixed artifact templates.
The current protocol defines contracts for `docs/product/`, `docs/decisions/`, `docs/patterns/`, and `docs/runbooks/`; a future namespace becomes usable after the workflow classifies it as durable repository knowledge, indexes it, and gives it a local contract.
Humans can ask direct questions such as what behavior is accepted, why a decision was made, which pattern applies, or how to run and recover an operation.
Explanation requests are read-only and return direct answers with artifact paths and section citations, including conflicts, status, exceptions, and safety conditions when relevant.
Ordinary implementation tasks do not invoke artifact mutation automatically.

### Runtime E2E test plans

```bash
npx ai-workflow-init@latest --kit coding-standard --tool codex --bundle testing
```

The testing bundle installs `runtime-e2e-test-plan` and `property-based-testing`. The runtime E2E capability adds `docs/testing/` for one-file plans that combine executable cases, an evidence ledger, cleanup state, summary counts, and human sign-off. Its validator rejects a `PASS` without a matching declared runtime path and concrete observed evidence; unit, widget, mocked, build, and source checks remain supporting proof.

After installation, complete
`<runtime-skill-root>/runtime-e2e-test-plan/references/project-runtime.md` for the
target project. It records project-specific service commands, readiness checks,
environment variable names, authentication, fixtures, evidence paths, cleanup,
and safety limits without storing secret values.

### Workflow evaluation

```bash
npx ai-workflow-init@latest --kit workflow-eval --tool codex
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
npx ai-workflow-init@latest --kit learning-workflow --tool codex
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
npx ai-workflow-init@latest --help
npx ai-workflow-init@latest --list-tools
npx ai-workflow-init@latest --list-kits
npx ai-workflow-init@latest --list-bundles
```

Skills are maintained only under `skills/`. Runtime-specific skill directories are
created in the target repository during installation; this kit checkout does not
generate `.agents/skills/` or `.claude/skills/` mirrors.

```bash
npm run check-skills
```

## Updating an installation

Updates are dry-run by default:

```bash
npx ai-workflow-init@latest update
npx ai-workflow-init@latest update --apply
```

Use the same source channel as your installation.
For current GitHub `main`, run the GitHub installer command above with `bash -s -- update` for a dry run, then `bash -s -- update --apply` to apply safe updates.
For a published npm release, use `npx ai-workflow-init@latest update` and then `npx ai-workflow-init@latest update --apply`.

The updater records explicit ownership in `.ai-workflow/installed.json`.
The state tracks the core repository protocol separately from installed addons such as evaluation and learning.
Updates apply to all tracked core and addon surfaces, update only unchanged managed files, preserve local and unknown collisions, and keep pre-hard-cut legacy files in place rather than deleting consumer history automatically.
Pre-existing files are not adopted merely because their bytes match the installer source.
Reinstalling or running `update --apply` is not a replacement for the legacy-instruction migration described above.

## Development checks

```bash
npm test
npm run check-skills
```

## License

MIT
