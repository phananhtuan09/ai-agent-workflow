# AI Agent Workflow

A repository-driven protocol for AI coding assistants, installed by the `ai-workflow-init` CLI, with optional skills for review, testing, design, workflow evaluation, and learning.

## How it works

The default path is direct execution:

1. Read the requested outcome and the smallest relevant repository authority.
2. Make the smallest coherent change.
3. Prove the changed behavior with the cheapest reliable check.
4. Report observed evidence and remaining risk.

There is no required design/specification/execution/verification chain and no coordinator state.
The full rules live in [`AGENTS.md`](AGENTS.md) and [`docs/WORKFLOW.md`](docs/WORKFLOW.md).

## Quick start

Requires Node.js >= 14.
Run from the target application's root directory:

```bash
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --kit coding-standard --tool claude
```

Replace `claude` with `codex`, `antigravity`, `pi`, or `opencode` for another runtime.
The `coding-standard` kit installs the protocol and no skills; add capabilities only when they materially help.

## Install sources

| Source | Command | Installs |
| --- | --- | --- |
| GitHub `main` | `curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh \| bash -s -- <flags>` | The current `main` branch, which this README describes. |
| npm release | `npx ai-workflow-init@latest <flags>` | The latest published package, which can lag behind `main` and lack newer capabilities. |
| Local checkout | `node /absolute/path/to/ai-agent-workflow/cli.js <flags>` | The checked-out revision. |

All three accept the same flags; the examples below show only the flags.
Record which source or revision you used when comparing installations.

## Capabilities

| Capability | Install flag | What it adds | Status |
| --- | --- | --- | --- |
| Core protocol | `--kit coding-standard` | `AGENTS.md`, `docs/WORKFLOW.md`, and the `docs/` namespaces | Stable |
| Planner mode | `--bundle planner-mode` | Manually invoked `/planner` mode that picks the next workflow step and suggests numbered next prompts | Experimental |
| Runtime E2E tests | `--bundle testing` | Playwright-based plan and run workflow with evidence bundles | Stable |
| Design | `--kit design` | `docs/PRODUCT.md` and `docs/DESIGN.md` for the external Impeccable engine | Stable |
| Workflow evaluation | `--kit workflow-eval` | Trace-first evaluation standard, templates, and skills under `docs/evaluation/` | Stable |
| Learning | `--kit learning-workflow` | Mini-project learning coordinator and helpers under `docs/learning/` | Stable |

### Skills and bundles

Skills are maintained in [`skills/`](skills) and declared in [`skills/manifest.json`](skills/manifest.json).
Add one with `--skill <name>` or a group with `--bundle <name>`.

| Skill | Purpose |
| --- | --- |
| `brainstorm-partner` | Read-only thinking partner for vague ideas, hard bugs, and technical decisions. |
| `review-pr` | Reviews a PR, branch, commit range, or diff for evidence-backed blocking defects. |
| `quality-code-check` | Lint, type check, build, and failing-validation debugging with project-native commands. |
| `smart-commits` | Groups the working tree into intent-based commits and pushes on request. |
| `manage-project-knowledge` | Finds and explains durable knowledge under `docs/`, keeps it current on its own after each task, and maintains all project docs when invoked without a topic. |
| `proposal-designer` | Turns a vague idea into a reviewable proposal under `docs/proposals/`. |
| `runtime-e2e-test` | Plans and runs real web and HTTP API E2E tests with Playwright. |
| `triage` | Labels GitHub issues as needs-info, ready-for-agent, or ready-for-human and comments with questions, an agent brief, or the decision needed. |
| `planner` | Manually invoked planner mode that resolves ambiguity, runs the fitting step, and suggests next steps. |
| `workflow-evaluation`, `record-workflow-friction` | Evaluate AI workflows and record execution friction. |
| `learning-workflow`, `learning-case`, `learning-evidence`, `learning-review` | Run two-to-three-day learning mini-projects. |

| Bundle | Skills |
| --- | --- |
| `core` | `brainstorm-partner`, `review-pr`, `smart-commits`, `manage-project-knowledge` |
| `common-review` | `quality-code-check`, `review-pr` |
| `proposal` | `proposal-designer` |
| `testing` | `runtime-e2e-test` |
| `issue-triage` | `triage` |
| `evaluation` | `workflow-evaluation`, `record-workflow-friction` |
| `learning` | `learning-workflow`, `learning-case`, `learning-evidence`, `learning-review` |
| `planner-mode` | `planner`, `quality-code-check`, `smart-commits`, `manage-project-knowledge` |

The bundle named `core` is optional; the `coding-standard` kit does not require it.

### Planner mode

The `planner-mode` bundle installs the `planner` skill with `quality-code-check`, `smart-commits`, and `manage-project-knowledge`; Codex and Antigravity receive the same skill.
Type `/planner` to turn it on for the rest of the conversation.
For each prompt the agent picks the fitting workflow step or skill, does it, and ends with two or three numbered next steps; reply `1`, `2`, or `3` to continue.
It asks first before git actions, outward actions such as PR comments, and unresolved product decisions, and choosing an option that names one of those actions approves it.
It is plain instructions with no hooks, so nothing changes until a session invokes it.
Claude Code keeps it manual with `disable-model-invocation`; Codex and Antigravity rely on the skill description, so a session may occasionally start it on its own.
No hook re-injects it after compaction in a very long session; invoke `/planner` again if the choices stop appearing.
See the [decision record](docs/decisions/2026-10-16-planner-capability.md) for scope.

### Runtime E2E tests

`plan` mode writes a Markdown plan plus mapped Playwright tests for human approval; `run` mode executes approved scripts against real web or HTTP API boundaries.
Versioned evidence bundles keep inputs, results, observations, traces, retries, and cleanup for independent audit.
After installation, complete `<runtime-skill-root>/runtime-e2e-test/references/project-runtime.md` with the project's service commands, readiness checks, fixtures, and safety limits, without secret values.

### Design

The design kit installs only the project context; the [Impeccable](https://github.com/pbakaus/impeccable) engine is installed once per machine.
See [`docs/other/DESIGN_CAPABILITY.md`](docs/other/DESIGN_CAPABILITY.md) for setup and use.

### Workflow evaluation and learning

Both kits install the core protocol when it is not already tracked.
Evaluation is trace-first when runtime history exists; see [`docs/evaluation/`](docs/evaluation).
Learning is separate from ordinary coding work and supports Codex, Claude Code, and Google Antigravity; see [`docs/learning/`](docs/learning).

## Supported runtimes

| Runtime | `--tool` | Skill directory | Other installed files |
| --- | --- | --- | --- |
| Claude Code | `claude` | `.claude/skills/` | `.claude/CLAUDE.md` generated from `AGENTS.md`, plus agents, output styles, scripts, settings, and status line |
| Codex | `codex` | `.agents/skills/` | `.agents/roles/` and `.codex/` |
| Google Antigravity | `antigravity` | `.agents/skills/` | — |
| OpenCode | `opencode` | — | Native agents in `.opencode/agents/` only when a selected kit requires them |
| Pi | `pi` | — | None; Pi reads the repository protocol directly |

Existing project and global instruction files are always preserved.

## Repository docs layout

```text
AGENTS.md
docs/
├── WORKFLOW.md          # authority, work shapes, durable memory, proof
├── product/             # accepted product and domain behavior
├── decisions/           # architecture, security, compatibility, operations
├── plans/               # active and completed durable working memory
├── patterns/            # accepted recurring technical patterns
├── runbooks/            # verified operating procedures
├── observed/            # agent-maintained current-state facts, not authority
├── proposals/           # optional proposal drafts and human decisions
├── testing/             # optional runtime E2E plans and evidence
├── evaluation/          # optional workflow evaluation capability
├── learning/            # optional learning capability
├── PRODUCT.md           # optional design capability product brief
└── DESIGN.md            # optional design capability visual system
```

Optional namespaces are not product authority and are not loaded by ordinary coding work.
The agent maintains durable knowledge itself: it records what you accept in conversation, keeps facts it infers from code in `docs/observed/`, and asks only when intent sources conflict.
See [`docs/README.md`](docs/README.md) for each location's contract.

## Updating an installation

Updates are dry-run by default; use the same source as the installation:

```bash
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- update
curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- update --apply
```

For an npm installation, run `npx ai-workflow-init@latest update` and then `update --apply`.

Ownership is recorded in `.ai-workflow/installed.json`, with the core protocol tracked separately from addons.
Updates change only unchanged managed files, preserve local edits and unknown collisions, and never delete pre-existing legacy files.
Pre-existing files are not adopted merely because their bytes match the installer source.

## Migrating an existing project

Installation does not migrate existing instructions.
An old `AGENTS.md` can remain alongside a newly installed `docs/WORKFLOW.md`, and neither reinstalling nor `update --apply` replaces that migration.

1. Inspect the project's instructions and the installer's preserved and skipped-file messages.
2. Compare `AGENTS.md` and `docs/WORKFLOW.md` with those from the same installer source revision.
3. Back up or commit the existing instructions and keep project-specific rules.
4. When migration is authorized, replace obsolete workflow routing with the current protocol.
5. Check parent-directory and global instructions for conflicting routing and report conflicts outside the authorized scope.

The legacy `/create-spec → /create-plan → /enrich-plan → /execute-plan → /verify-feature` chain is not the current workflow; do not install legacy skills to satisfy it, and keep historical artifacts unless their removal is requested.

For Codex and Claude, the installer also creates missing global instructions from the legacy `.claude/CLAUDE.global.md` template.
That template is not the source of the current project protocol.

### Handoff checklist for AI assistants

Before reporting an installation as complete, verify that:

- `AGENTS.md` points to `docs/WORKFLOW.md`, and both describe direct execution without a mandatory phase chain.
- Project-specific rules remain intact and unresolved instruction conflicts are identified.
- For Claude, `.claude/CLAUDE.md` reflects the current protocol and keeps project-specific rules.
- Only requested skills were added.
- No specification, plan, or design exercise was started merely to install the workflow.
- The handoff lists the source and revision, kit and runtime, added skills, and preserved files that still need migration.

For an A/B benchmark, also compare globally available skills and instructions, runtime versions, verification tools, and starting files across both sessions.

## Also in this repository

| Path | Contents | Installed by the CLI |
| --- | --- | --- |
| [`global-skills/`](global-skills) | Machine-wide skills (`herdr-guide`, `idea-scout`, `prompt-leverage`) | No; follow its README |
| [`paseo-plugins/`](paseo-plugins) | [Paseo](https://paseo.sh) plugins (`attention`, `usage-pill`) | No; follow its README |
| `cli.js`, `lib/` | The `ai-workflow-init` installer and updater | — |
| `docs/braintorm/` | Exploratory design notes, not product authority | No |

## CLI

```bash
node cli.js --help
node cli.js --list-tools
node cli.js --list-kits
node cli.js --list-bundles
```

The same options are available through the GitHub installer and `npx ai-workflow-init@latest`.

## Development

Runtime skill directories are created only in target repositories; this checkout does not keep `.agents/skills/` or `.claude/skills/` mirrors.

```bash
npm test
npm run check-skills
```

## License

MIT
