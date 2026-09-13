#!/usr/bin/env node

const { AI_TOOLS, DEFAULT_KIT_ID, WORKFLOW_KITS } = require("./lib/config");
const { main } = require("./lib/main");
const { error } = require("./lib/logger");
const { readSkillManifest } = require("./lib/skills");
const { runUpdate } = require("./lib/update");

function printHelp() {
  const toolList = AI_TOOLS.map((tool) => `  - ${tool.id}: ${tool.name}`).join("\n");
  const kitList = WORKFLOW_KITS.map((kit) => `  - ${kit.id}: ${kit.name}`).join("\n");

  console.log(`Repository-Driven AI Installer

Usage:
  npx ai-workflow-init [--tool <id> | --all] [--kit <id>]
  npx ai-workflow-init --kit <id> --tool <id> [--skill <id> ...]
  npx ai-workflow-init --kit <id> --tool <id> [--bundle <id> ...]
  npx ai-workflow-init update [--apply]
  npx ai-workflow-init --help
  npx ai-workflow-init --list-tools
  npx ai-workflow-init --list-kits
  npx ai-workflow-init --list-bundles

Options:
  --tool <id>    Install a specific tool target
  --all          Install all supported tool targets
  --kit <id>     Install a specific kit (default: ${DEFAULT_KIT_ID})
  --skill <id>   Add an optional skill to the selected kit (repeatable)
  --bundle <id>  Add an optional skill bundle to the selected kit (repeatable)
  --apply        Apply a planned update (update is dry-run by default)
  --list-tools   Show supported tool ids
  --list-kits    Show supported kit ids
  --list-bundles Show supported skill bundles
  -h, --help     Show this help message

Supported tools:
${toolList}

Supported kits:
${kitList}

The installer always installs the repository-driven protocol under docs/.
The coding-standard kit has no skills selected by default.
Pi uses that protocol directly and receives no legacy extension or workflow tracker.
Only selected Codex or Claude Code installs create a missing global instruction file.
Existing global instruction files are preserved.

The workflow-eval kit installs:
  - docs/evaluation/STANDARD.md and docs/evaluation/templates/report.html
  - docs/evaluation/observations/, reports/, and session-traces/
  - workflow-evaluation and record-workflow-friction skills

The learning-workflow kit installs:
  - docs/learning/CONSTITUTION.md and docs/learning/STANDARD.md
  - docs/learning/ project and durable case state
  - learning-workflow with learning-case, learning-evidence, and learning-review helpers
  - deterministic state validators

Examples:
  npx ai-workflow-init --kit coding-standard --tool codex
  npx ai-workflow-init --kit learning-workflow --tool codex
  npx ai-workflow-init --kit workflow-eval --tool codex
  npx ai-workflow-init --tool pi
  npx ai-workflow-init --tool opencode
  npx ai-workflow-init --tool codex --bundle frontend
  npx ai-workflow-init update
  npx ai-workflow-init update --apply
`);
}

function printToolList() {
  AI_TOOLS.forEach((tool) => {
    console.log(`${tool.id}\t${tool.name}\t${tool.description}`);
  });
}

function printKitList() {
  WORKFLOW_KITS.forEach((kit) => {
    console.log(`${kit.id}\t${kit.name}\t${kit.description}`);
  });
}

function printBundleList() {
  const { SOURCE_ROOT } = require("./lib/config");
  const manifest = readSkillManifest(SOURCE_ROOT);
  Object.entries(manifest.bundles).forEach(([id, skills]) => {
    console.log(`${id}\t${skills.length} skill entries`);
  });
}

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

if (args.includes("--list-tools")) {
  printToolList();
  process.exit(0);
}

if (args.includes("--list-kits")) {
  printKitList();
  process.exit(0);
}

if (args.includes("--list-bundles")) {
  printBundleList();
  process.exit(0);
}

if (args[0] === "update") {
  try {
    runUpdate(args.slice(1));
    process.exit(0);
  } catch (updateError) {
    error(updateError.message);
    process.exit(1);
  }
}

main().catch((installError) => {
  error(installError.message);
  process.exit(1);
});
