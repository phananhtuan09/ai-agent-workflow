#!/usr/bin/env node

const { AI_TOOLS, DEFAULT_KIT_ID, WORKFLOW_KITS } = require("./lib/config");
const { main } = require("./lib/main");
const { error } = require("./lib/logger");

function printHelp() {
  const toolList = AI_TOOLS.map((tool) => `  - ${tool.id}: ${tool.name}`).join("\n");
  const kitList = WORKFLOW_KITS.map((kit) => `  - ${kit.id}: ${kit.name}`).join("\n");

  console.log(`AI Workflow Installer

Usage:
  npx ai-workflow-init [--tool <id> | --all] [--kit <id>]
  npx ai-workflow-init --help
  npx ai-workflow-init --list-tools
  npx ai-workflow-init --list-kits

Options:
  --tool <id>    Install a specific tool target
  --all          Install all supported tool targets
  --kit <id>     Install a specific workflow kit (default: ${DEFAULT_KIT_ID})
  --list-tools   Show supported tool ids
  --list-kits    Show supported workflow kits
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
  npx ai-workflow-init --kit workflow-eval --tool codex
  npx ai-workflow-init --tool pi
  npx ai-workflow-init --tool codex
  npx ai-workflow-init --all

The workflow-eval kit installs:
  - docs/ai/project/AI_WORKFLOW_RULES.md
  - docs/ai/project/WORKFLOW_EVALUATION_STANDARD.md
  - docs/ai/project/templates/workflow-evaluation-report.html
  - docs/ai/agent-observations/
  - docs/ai/workflow-observations/ (legacy compatibility)
  - docs/ai/workflow-evals/
  - docs/ai/session-traces/
  - workflow-evaluation and record-workflow-friction skills for the selected runtime(s)
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

main().catch((installError) => {
  error(installError.message);
  process.exit(1);
});
