#!/usr/bin/env node

const { AI_TOOLS, DEFAULT_KIT_ID, WORKFLOW_KITS } = require("./lib/config");
const { main } = require("./lib/main");
const { error } = require("./lib/logger");
const { readSkillManifest } = require("./lib/skills");

function printHelp() {
  const toolList = AI_TOOLS.map((tool) => `  - ${tool.id}: ${tool.name}`).join("\n");
  const kitList = WORKFLOW_KITS.map((kit) => `  - ${kit.id}: ${kit.name}`).join("\n");

  console.log(`AI Workflow Installer

Usage:
  npx ai-workflow-init [--tool <id> | --all] [--kit <id>]
  npx ai-workflow-init --kit <id> --tool <id> [--skill <id> ...]
  npx ai-workflow-init --kit <id> --tool <id> [--bundle <id> ...]
  npx ai-workflow-init --help
  npx ai-workflow-init --list-tools
  npx ai-workflow-init --list-kits
  npx ai-workflow-init --list-bundles

Options:
  --tool <id>    Install a specific tool target
  --all          Install all supported tool targets
  --kit <id>     Install a specific workflow kit (default: ${DEFAULT_KIT_ID})
  --skill <id>   Add a skill to the selected kit (repeatable)
  --bundle <id>  Add a skill bundle to the selected kit (repeatable)
  --list-tools   Show supported tool ids
  --list-kits    Show supported workflow kits
  --list-bundles Show supported skill bundles
  -h, --help     Show this help message

Supported tools:
${toolList}

Supported kits:
${kitList}

Pi install target:
  --tool pi

When installing for Pi, the CLI syncs:
  - docs/ai/
  - ~/.codex/AGENTS.md
  - .pi/extensions/
  - .pi/workflows/

Examples:
  npx ai-workflow-init --kit coding-standard --tool codex
  npx ai-workflow-init --kit lerning-workflow --tool codex
  npx ai-workflow-init --kit workflow-eval --tool codex
  npx ai-workflow-init --tool pi
  npx ai-workflow-init --tool codex
  npx ai-workflow-init --all

The workflow-eval kit installs:
  - docs/ai/project/WORKFLOW_CODING_CONSTITUTION.md
  - docs/ai/project/WORKFLOW_LEARNING_CONSTITUTION.md
  - docs/ai/project/WORKFLOW_EVALUATION_STANDARD.md
  - docs/ai/project/templates/workflow-evaluation-report.html
  - docs/ai/evaluation/observations/
  - docs/ai/evaluation/reports/
  - docs/ai/evaluation/session-traces/
  - workflow-evaluation and record-workflow-friction skills for the selected runtime(s)

The lerning-workflow kit installs:
  - docs/ai/project/WORKFLOW_LEARNING_CONSTITUTION.md
  - docs/ai/learning/ session state folders
  - learning-workflow coordinator with learning-case, learning-evidence, and learning-review helpers
  - a bundled case and deterministic state validators

Coding-standard installs the core workflow skills only.
Use --skill <id> one or more times to add optional skills, for example:
  npx ai-workflow-init --tool codex --skill frontend-design-fundamentals --skill react-best-practices
Use --bundle <id> to add a bundle, for example:
  npx ai-workflow-init --tool codex --bundle frontend
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

main().catch((installError) => {
  error(installError.message);
  process.exit(1);
});
