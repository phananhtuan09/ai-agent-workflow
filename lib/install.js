const { existsSync, readFileSync, readdirSync, writeFileSync } = require("fs");
const os = require("os");
const path = require("path");

const { SOURCE_ROOT } = require("./config");
const {
  error,
  skip,
  step,
  success,
  warn,
} = require("./logger");
const {
  copyDirectoryContents,
  copyFileForce,
  ensureDir,
} = require("./fs-utils");
const { adaptSkillContent } = require("./skills");
const {
  CLAUDE_PROJECT_FILE,
  DESIGN_CAPABILITY_FILES,
  GLOBAL_INSTRUCTIONS_FILE,
  PROTOCOL_FILES,
  TESTING_FILES,
} = require("./managed-files");

function resolveSourcePath(relativePath) {
  return path.join(SOURCE_ROOT, relativePath);
}

function resolveWorkspacePath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}

function installProtocolFiles() {
  step("🔄 Installing repository-driven protocol...");

  PROTOCOL_FILES.forEach((relativePath) => {
    const sourceFile = resolveSourcePath(relativePath);
    const destinationFile = resolveWorkspacePath(relativePath);

    if (!existsSync(sourceFile)) {
      throw new Error(`Missing protocol source file: ${relativePath}`);
    }

    if (existsSync(destinationFile)) {
      skip(`Preserving existing project file: ${relativePath}`);
      return;
    }

    copyFileForce(sourceFile, destinationFile);
    success(`Installed: ${relativePath}`);
  });
}

function syncFolder(relativePath, destRelativePath = relativePath) {
  const sourceDir = resolveSourcePath(relativePath);
  if (!existsSync(sourceDir)) {
    throw new Error(`Source folder not found: ${relativePath}`);
  }

  copyDirectoryContents(sourceDir, resolveWorkspacePath(destRelativePath));
}

function syncSelectedSkills(runtime, skillIds) {
  const sourceRoot = resolveSourcePath("skills");
  const destinationRoot = resolveWorkspacePath(
    runtime === "claude" ? ".claude/skills" : ".agents/skills"
  );

  skillIds.forEach((skillId) => {
    const sourceDir = path.join(sourceRoot, skillId);
    if (!existsSync(path.join(sourceDir, "SKILL.md"))) {
      throw new Error(`Canonical skill not found: ${skillId}`);
    }
    const destinationDir = path.join(destinationRoot, skillId);
    if (existsSync(destinationDir)) {
      skip(`Preserving existing skill directory: ${destinationDir}`);
      return;
    }
    copyDirectoryContents(sourceDir, destinationDir);
    adaptSkillDirectory(destinationDir, runtime, skillId);
  });
}

function adaptSkillDirectory(directory, runtime, skillId) {
  readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      adaptSkillDirectory(entryPath, runtime, skillId);
      return;
    }
    if (!entry.name.endsWith(".md") && !entry.name.endsWith(".py")) return;

    const content = readFileSync(entryPath, "utf8");
    writeFileSync(entryPath, adaptSkillContent(content, runtime, skillId));
  });
}

function syncFile(relativePath, destRelativePath = relativePath) {
  const sourceFile = resolveSourcePath(relativePath);
  if (!existsSync(sourceFile)) {
    throw new Error(`Source file not found: ${relativePath}`);
  }

  copyFileForce(sourceFile, resolveWorkspacePath(destRelativePath));
}


function ensureDocsDevFolder() {
  step("📁 Creating docs/dev folder...");

  const docsDevPath = resolveWorkspacePath("docs/dev");
  if (existsSync(docsDevPath)) {
    skip("Skipping (already exists): docs/dev");
    return;
  }

  ensureDir(docsDevPath);
  success("Created: docs/dev");
}

function installGlobalInstruction(sourceRelativePath, destinationPath, displayPath) {
  const sourcePath = resolveSourcePath(sourceRelativePath);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing source file: ${sourceRelativePath}`);
  }

  if (existsSync(destinationPath)) {
    if (readFileSync(sourcePath).equals(readFileSync(destinationPath))) {
      skip(`Already current: ${displayPath}`);
    } else {
      warn(`Preserving existing global instructions: ${displayPath}`);
    }
    return;
  }

  const homeRoot = os.homedir();
  ensureDir(path.dirname(destinationPath), homeRoot);
  copyFileForce(sourcePath, destinationPath, homeRoot);
  success(`Installed: ${displayPath}`);
}

function syncAgentsMd() {
  step("🔄 Installing Codex global instructions (~/.codex/AGENTS.md)...");

  try {
    installGlobalInstruction(
      GLOBAL_INSTRUCTIONS_FILE,
      path.join(os.homedir(), ".codex", "AGENTS.md"),
      "~/.codex/AGENTS.md"
    );
  } catch (installError) {
    error(`Failed to install ~/.codex/AGENTS.md: ${installError.message}`);
  }
}

function syncClaudeMd() {
  step("🔄 Installing Claude global instructions (~/.claude/CLAUDE.md)...");

  try {
    installGlobalInstruction(
      GLOBAL_INSTRUCTIONS_FILE,
      path.join(os.homedir(), ".claude", "CLAUDE.md"),
      "~/.claude/CLAUDE.md"
    );
  } catch (installError) {
    error(`Failed to install ~/.claude/CLAUDE.md: ${installError.message}`);
  }
}

function installCodex(skillIds) {
  step(`🔄 Syncing Codex skills (${skillIds.length} selected)...`);
  syncSelectedSkills("codex", skillIds);

  const roleIds = [];
  if (skillIds.includes("review-pr")) roleIds.push("review-pr");
  if (roleIds.length > 0) {
    step(`🔄 Syncing Codex roles (${roleIds.length} selected)...`);
    roleIds.forEach((roleId) => syncFile(`.agents/roles/${roleId}.md`));
  }


  step("🔄 Syncing Codex config (.codex)...");
  const configTomlPath = resolveWorkspacePath(".codex/config.toml");
  if (existsSync(configTomlPath)) {
    skip("Preserving existing: .codex/config.toml");
  } else {
    syncFile(".codex/config.toml");
    success("Installed: .codex/config.toml");
  }
}

function installAntigravity(skillIds) {
  step(`🔄 Syncing Antigravity skills (${skillIds.length} selected)...`);
  syncSelectedSkills("antigravity", skillIds);
}


function installClaudeCode(skillIds) {
  step("🔄 Installing Claude project instructions (.claude/CLAUDE.md)...");
  const projectClaudePath = resolveWorkspacePath(CLAUDE_PROJECT_FILE);
  if (existsSync(projectClaudePath)) {
    skip(`Preserving existing: ${CLAUDE_PROJECT_FILE}`);
  } else {
    syncFile("AGENTS.md", CLAUDE_PROJECT_FILE);
    success(`Installed: ${CLAUDE_PROJECT_FILE}`);
  }

  step("🔄 Syncing Claude Code statusline source (.claude/statusline.sh)...");
  const statuslinePath = resolveWorkspacePath(".claude/statusline.sh");
  if (existsSync(statuslinePath)) {
    skip("Preserving existing: .claude/statusline.sh");
  } else {
    syncFile(".claude/statusline.sh");
  }

  step(`🔄 Syncing Claude Code skills (${skillIds.length} selected)...`);
  syncSelectedSkills("claude", skillIds);


  step("🔄 Syncing Claude Code output-styles (.claude/output-styles)...");
  syncFolder(".claude/output-styles");

  step("🔄 Syncing Claude Code scripts (.claude/scripts)...");
  syncFolder(".claude/scripts");

  step("🔄 Setting up Claude Code settings (.claude/settings.json)...");
  const settingsPath = resolveWorkspacePath(".claude/settings.json");
  if (existsSync(settingsPath)) {
    skip("Preserving existing: .claude/settings.json");
  } else {
    syncFile(".claude/settings.json");
    success("Installed: .claude/settings.json");
  }

  // Global Claude settings and statusline are never mutated automatically.
}


function syncSelectedSubagents(selectedTools, selectedIds = null) {
  const subagentRoots = {
    claude: ".claude/agents",
    codex: ".codex/agents",
    opencode: ".opencode/agents",
  };
  const extensions = { claude: "md", codex: "toml", opencode: "md" };

  return selectedTools
    .map((tool) => tool.id)
    .filter((toolId) => subagentRoots[toolId])
    .flatMap((toolId) => {
      const subagentRoot = subagentRoots[toolId];
      if (selectedIds === null) {
        step(`🔄 Syncing ${toolId} subagents (${subagentRoot})...`);
        syncFolder(subagentRoot);
        return [subagentRoot];
      }

      const selectedPaths = selectedIds
        .map((id) => `${subagentRoot}/${id}.${extensions[toolId]}`)
        .filter((relativePath) => existsSync(resolveSourcePath(relativePath)));
      if (selectedPaths.length === 0) return [];

      step(`🔄 Syncing ${toolId} subagents (${selectedPaths.length} selected)...`);
      selectedPaths.forEach((relativePath) => syncFile(relativePath));
      return selectedPaths;
    });
}

function installCodingStandardKit(selectedTools, skillIds) {
  installProtocolFiles();
  if (skillIds.includes("runtime-e2e-test-plan")) {
    step("🔄 Installing runtime E2E test-plan namespace...");
    TESTING_FILES.forEach((relativePath) => {
      if (existsSync(resolveWorkspacePath(relativePath))) {
        skip(`Preserving existing project file: ${relativePath}`);
      } else {
        syncFile(relativePath);
        success(`Installed: ${relativePath}`);
      }
    });
  }

  ensureDocsDevFolder();

  const toolIds = selectedTools.map((tool) => tool.id);
  toolIds.filter((toolId) => installersByToolId[toolId]).forEach((toolId) => {
    installersByToolId[toolId](skillIds);
  });
  const codingSubagentIds = [];
  if (skillIds.includes("review-pr")) codingSubagentIds.push("review-pr");
  syncSelectedSubagents(selectedTools, codingSubagentIds);

  if (toolIds.includes("codex")) {
    syncAgentsMd();
  }
  if (toolIds.includes("claude")) {
    syncClaudeMd();
  }

  const runtimeSkillPaths = selectedTools
    .filter((tool) => tool.id === "codex" || tool.id === "antigravity" || tool.id === "claude")
    .flatMap((tool) => {
      const runtimeRoot = tool.id === "claude" ? ".claude/skills" : ".agents/skills";
      return skillIds.map((skillId) => `${runtimeRoot}/${skillId}/`);
    });

  return [
    ...PROTOCOL_FILES,
    ...(skillIds.includes("runtime-e2e-test-plan") ? TESTING_FILES : []),
    ...runtimeSkillPaths,
    ...selectedTools.flatMap((tool) => tool.folders),
  ].filter((relativePath) => existsSync(resolveWorkspacePath(relativePath)));
}

function installWorkflowEvaluationKit(selectedTools, skillIds) {
  const installedPaths = [
    ...installCodingStandardKit(selectedTools, []),
    "docs/evaluation/README.md",
    "docs/evaluation/STANDARD.md",
    "docs/evaluation/templates/report.html",
    "docs/evaluation/observations/README.md",
    "docs/evaluation/reports/README.md",
    "docs/evaluation/session-traces/README.md",
  ];

  step("🔄 Syncing evaluation standard...");
  syncFile("docs/evaluation/STANDARD.md");
  step("🔄 Syncing evaluation report template...");
  syncFile("docs/evaluation/templates/report.html");

  ensureDir(resolveWorkspacePath("docs/evaluation/observations"));
  ensureDir(resolveWorkspacePath("docs/evaluation/reports"));
  ensureDir(resolveWorkspacePath("docs/evaluation/session-traces"));

  step("🔄 Syncing evaluation artifact docs...");
  syncFile("docs/evaluation/README.md");
  syncFile("docs/evaluation/observations/README.md");
  syncFile("docs/evaluation/reports/README.md");
  syncFile("docs/evaluation/session-traces/README.md");

  const toolIds = new Set(selectedTools.map((tool) => tool.id));
  const needsAgentsSkill = toolIds.has("codex") || toolIds.has("antigravity");
  const needsClaudeSkill = toolIds.has("claude");

  if (needsAgentsSkill) {
    step("🔄 Syncing shared workflow evaluation skills (.agents)...");
    syncSelectedSkills("codex", skillIds);
    installedPaths.push(".agents/skills/workflow-evaluation/");
    installedPaths.push(".agents/skills/record-workflow-friction/");
  }

  if (needsClaudeSkill) {
    step("🔄 Syncing Claude workflow evaluation skills...");
    syncSelectedSkills("claude", skillIds);
    installedPaths.push(".claude/skills/workflow-evaluation/");
    installedPaths.push(".claude/skills/record-workflow-friction/");
  }

  installedPaths.push(...syncSelectedSubagents(selectedTools));
  return installedPaths;
}

function installLearningWorkflowKit(selectedTools, skillIds) {
  const supportedToolIds = new Set(["antigravity", "claude", "codex"]);
  const unsupportedToolIds = selectedTools
    .map((tool) => tool.id)
    .filter((toolId) => !supportedToolIds.has(toolId));
  if (unsupportedToolIds.length > 0) {
    throw new Error(
      `Learning workflow does not support: ${unsupportedToolIds.join(", ")}. ` +
      "Use codex, antigravity, or claude."
    );
  }

  const installedPaths = [
    ...installCodingStandardKit(selectedTools, []),
    "docs/learning/CONSTITUTION.md",
    "docs/learning/STANDARD.md",
    "docs/learning/",
    "docs/learning/cases/",
    "docs/learning/sessions/",
    "docs/learning/project.json",
    "docs/learning/schedule.json",
    "docs/learning/cases/inventory-reservation.json",
  ];

  step("🔄 Syncing learning constitution...");
  syncFile("docs/learning/CONSTITUTION.md");
  syncFile("docs/learning/STANDARD.md");
  ensureDir(resolveWorkspacePath("docs/learning"));
  ensureDir(resolveWorkspacePath("docs/learning/cases"));
  ensureDir(resolveWorkspacePath("docs/learning/sessions"));
  [
    "docs/learning/project.json",
    "docs/learning/schedule.json",
    "docs/learning/cases/inventory-reservation.json",
  ].forEach((relativePath) => {
    const durablePath = resolveWorkspacePath(relativePath);
    if (existsSync(durablePath)) {
      skip(`Skipping active-safe durable artifact: ${relativePath}`);
    } else {
      syncFile(relativePath);
    }
  });

  const toolIds = new Set(selectedTools.map((tool) => tool.id));
  const needsAgentsSkill = toolIds.has("codex") || toolIds.has("antigravity");
  const needsClaudeSkill = toolIds.has("claude");

  if (needsAgentsSkill) {
    step("🔄 Syncing shared learning workflow skill (.agents)...");
    syncSelectedSkills("codex", skillIds);
    installedPaths.push(...skillIds.map((skillId) => `.agents/skills/${skillId}/`));
  }

  if (needsClaudeSkill) {
    step("🔄 Syncing Claude learning workflow skill...");
    syncSelectedSkills("claude", skillIds);
    installedPaths.push(...skillIds.map((skillId) => `.claude/skills/${skillId}/`));
  }

  installedPaths.push(...syncSelectedSubagents(selectedTools));
  return installedPaths;
}


function designEngineInstalled() {
  const home = os.homedir();
  return [
    path.join(home, ".claude", "skills", "impeccable"),
    path.join(home, ".agents", "skills", "impeccable"),
  ].some((candidate) => existsSync(candidate));
}

function installDesignCapabilityKit(selectedTools, skillIds) {
  const installedPaths = [
    ...installCodingStandardKit(selectedTools, []),
    ...DESIGN_CAPABILITY_FILES,
  ];

  step("🔄 Syncing design capability context...");
  DESIGN_CAPABILITY_FILES.forEach((relativePath) => {
    const durablePath = resolveWorkspacePath(relativePath);
    if (existsSync(durablePath)) {
      skip(`Skipping active-safe durable artifact: ${relativePath}`);
    } else {
      syncFile(relativePath);
    }
  });

  if (!designEngineInstalled()) {
    warn(
      "No design engine found for this machine. Install it once with: " +
      "npx impeccable install --scope=global --no-hooks"
    );
  }

  const toolIds = new Set(selectedTools.map((tool) => tool.id));
  const needsAgentsSkill = toolIds.has("codex") || toolIds.has("antigravity");
  const needsClaudeSkill = toolIds.has("claude");

  if (skillIds.length > 0 && needsAgentsSkill) {
    step("🔄 Syncing shared design skills (.agents)...");
    syncSelectedSkills("codex", skillIds);
    installedPaths.push(...skillIds.map((skillId) => `.agents/skills/${skillId}/`));
  }

  if (skillIds.length > 0 && needsClaudeSkill) {
    step("🔄 Syncing Claude design skills...");
    syncSelectedSkills("claude", skillIds);
    installedPaths.push(...skillIds.map((skillId) => `.claude/skills/${skillId}/`));
  }

  installedPaths.push(...syncSelectedSubagents(selectedTools));
  return installedPaths;
}

const installersByToolId = {
  antigravity: installAntigravity,
  claude: installClaudeCode,
  codex: installCodex,
};

const kitInstallersById = {
  "coding-standard": installCodingStandardKit,
  design: installDesignCapabilityKit,
  "learning-workflow": installLearningWorkflowKit,
  "workflow-eval": installWorkflowEvaluationKit,
};

module.exports = {
  ensureDocsDevFolder,
  installersByToolId,
  kitInstallersById,
  syncAgentsMd,
  syncClaudeMd,
};
