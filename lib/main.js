const { AI_TOOLS, WORKFLOW_KITS } = require("./config");
const {
  kitInstallersById,
} = require("./install");
const {
  error,
  printBanner,
  printSelectedKit,
  printSelectedTools,
  printSummary,
} = require("./logger");
const {
  getCliSelectedKit,
  getCliSelectedTools,
  multiSelect,
  simpleSingleSelect,
  simpleSelect,
  singleSelect,
} = require("./selection");

async function resolveSelectedKit() {
  const cliSelectedKit = getCliSelectedKit();

  if (cliSelectedKit) {
    return cliSelectedKit;
  }

  if (process.stdin.isTTY) {
    const selectedKit = await singleSelect(
      WORKFLOW_KITS,
      "🧩 Select Workflow Kit"
    );

    if (!selectedKit) {
      error("No kit selected. Exiting.");
      process.exit(1);
    }

    return selectedKit;
  }

  return simpleSingleSelect(
    WORKFLOW_KITS,
    "🧩 Which workflow kit do you want to setup?"
  );
}

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

  const selectedKit = await resolveSelectedKit();
  const selectedTools = await resolveSelectedTools();

  if (process.stdin.isTTY) {
    process.stdout.write("\x1b[2J\x1b[H");
  }

  printSelectedKit(selectedKit);
  printSelectedTools(selectedTools);

  const installKit = kitInstallersById[selectedKit.id];
  if (!installKit) {
    error(`No installer registered for kit: ${selectedKit.id}`);
    process.exit(1);
  }

  const installedPaths = installKit(selectedTools) || [];
  printSummary(selectedKit, selectedTools, installedPaths);
}

module.exports = {
  main,
};
