const { AI_TOOLS } = require("./config");
const {
  checkAndSyncMissingFactory,
  checkAndSyncMissingOpenCode,
  ensureDocsDevFolder,
  installersByToolId,
  syncAgentsMd,
  syncDocsAI,
} = require("./install");
const {
  error,
  printBanner,
  printSelectedTools,
  printSummary,
  step,
} = require("./logger");
const {
  getCliSelectedTools,
  multiSelect,
  simpleSelect,
} = require("./selection");

async function resolveSelectedTools() {
  const cliSelectedTools = getCliSelectedTools();

  if (cliSelectedTools) {
    return cliSelectedTools;
  }

  if (process.stdin.isTTY) {
    const selectedTools = await multiSelect(
      AI_TOOLS,
      "🤖 Select AI Tools to Install"
    );

    if (selectedTools.length === 0) {
      error("No tools selected. Exiting.");
      process.exit(1);
    }

    return selectedTools;
  }

  return simpleSelect();
}

async function main() {
  printBanner();

  const selectedTools = await resolveSelectedTools();

  if (process.stdin.isTTY) {
    process.stdout.write("\x1b[2J\x1b[H");
  }

  printSelectedTools(selectedTools);

  step("🔄 Syncing workflow template (docs/ai)...");
  syncDocsAI();

  ensureDocsDevFolder();

  const toolIds = selectedTools.map((tool) => tool.id);
  toolIds.forEach((toolId) => {
    installersByToolId[toolId]();
  });

  if (!toolIds.includes("factory")) {
    checkAndSyncMissingFactory();
  }

  if (!toolIds.includes("opencode")) {
    checkAndSyncMissingOpenCode();
  }

  syncAgentsMd();
  printSummary(selectedTools);
}

module.exports = {
  main,
};
