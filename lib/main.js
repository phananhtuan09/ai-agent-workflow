const { AI_TOOLS, SOURCE_ROOT, WORKFLOW_KITS } = require("./config");
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
  getCliSelectedSkills,
  getCliSelectedBundles,
} = require("./selection");
const { resolveSkills } = require("./skills");

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
  let extraSkills = getCliSelectedSkills();
  let extraBundles = getCliSelectedBundles();
  const baseResolution = resolveSkills({
    sourceRoot: SOURCE_ROOT,
    kitId: selectedKit.id,
  });

  if (process.stdin.isTTY && extraSkills.length === 0 && extraBundles.length === 0) {
    const manifest = baseResolution.manifest;
    const kitBundles = new Set(manifest.kits[selectedKit.id]);
    const bundleOptions = Object.keys(manifest.bundles)
      .filter((id) => !kitBundles.has(id))
      .map((id) => ({
        id,
        name: id,
        description: `${manifest.bundles[id].length} skill entries`,
      }));
    const selectedBundles = await multiSelect(
      bundleOptions,
      "➕ Select Optional Skill Bundles"
    );
    extraBundles = selectedBundles.map((bundle) => bundle.id);

    const afterBundles = resolveSkills({
      sourceRoot: SOURCE_ROOT,
      kitId: selectedKit.id,
      extraBundles,
    });
    const selectedIds = new Set(afterBundles.skillIds);
    const allSkillIds = [...new Set(
      Object.values(manifest.bundles).flatMap((items) => items)
    )].filter((id) => !manifest.bundles[id]);
    const skillOptions = allSkillIds
      .filter((id) => !selectedIds.has(id))
      .map((id) => ({ id, name: id, description: "Optional skill" }));
    const selectedSkills = await multiSelect(
      skillOptions,
      "➕ Select Optional Skills"
    );
    extraSkills = selectedSkills.map((skill) => skill.id);
  }

  const { skillIds } = resolveSkills({
    sourceRoot: SOURCE_ROOT,
    kitId: selectedKit.id,
    extraSkills,
    extraBundles,
  });

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

  const installedPaths = installKit(selectedTools, skillIds) || [];
  printSummary(selectedKit, selectedTools, installedPaths);
}

module.exports = {
  main,
};
