#!/usr/bin/env node

const { AI_TOOLS } = require("./lib/config");
const { main } = require("./lib/main");
const { error } = require("./lib/logger");

function printHelp() {
  const toolList = AI_TOOLS.map((tool) => `  - ${tool.id}: ${tool.name}`).join("\n");

  console.log(`AI Workflow Installer

Usage:
  npx ai-workflow-init [--tool <id> | --all]
  npx ai-workflow-init --help
  npx ai-workflow-init --list-tools

Options:
  --tool <id>    Install a specific tool target
  --all          Install all supported tool targets
  --list-tools   Show supported tool ids
  -h, --help     Show this help message

Supported tools:
${toolList}

Pi install target:
  --tool pi

When installing for Pi, the CLI syncs:
  - docs/ai/
  - ~/.codex/AGENTS.md
  - .pi/extensions/
  - .pi/workflows/

Examples:
  npx ai-workflow-init --tool pi
  npx ai-workflow-init --tool codex
  npx ai-workflow-init --all
`);
}

function printToolList() {
  AI_TOOLS.forEach((tool) => {
    console.log(`${tool.id}\t${tool.name}\t${tool.description}`);
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

main().catch((installError) => {
  error(installError.message);
  process.exit(1);
});
