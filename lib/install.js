const { chmodSync, existsSync, readFileSync, readdirSync, writeFileSync } = require("fs");
const os = require("os");
const path = require("path");

const { DEFAULT_BRANCH, REPO, SOURCE_ROOT } = require("./config");
const {
  colors,
  error,
  skip,
  step,
  success,
} = require("./logger");
const {
  copyDirectoryContents,
  copyFileForce,
  ensureDir,
  readJsonFile,
  replaceDirectory,
  writeJsonFile,
  backupFileIfExists,
} = require("./fs-utils");
const { adaptSkillContent } = require("./skills");

function resolveSourcePath(relativePath) {
  return path.join(SOURCE_ROOT, relativePath);
}

function resolveWorkspacePath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
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
    replaceDirectory(sourceDir, destinationDir);
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

function syncDocsAI() {
  const sourceRoot = resolveSourcePath("docs/ai");
  const destRoot = resolveWorkspacePath("docs/ai");

  ensureDir(destRoot);

  const sourceReadme = path.join(sourceRoot, "README.md");
  if (existsSync(sourceReadme)) {
    copyFileForce(sourceReadme, path.join(destRoot, "README.md"));
  }

  [
    "workflows",
    "project",
    "project/template-convention",
    "features",
    "features/design-decisions",
    "features/design-feedback",
    "features/designs",
    "features/specs",
    "features/summaries",
    "features/checklists",
    "features/verifications",
    "research",
    "research/brainstorms",
    "research/plans",
    "evaluation",
    "evaluation/observations",
    "evaluation/reports",
    "evaluation/session-traces",
    "learning",
    "learning/cases",
    "learning/sessions",
    "knowledge",
    "knowledge/architecture",
    "knowledge/domain",
  ].forEach((relativeDir) => {
    ensureDir(path.join(destRoot, relativeDir));
  });

  const sourceProject = path.join(sourceRoot, "project");
  const destProject = path.join(destRoot, "project");

  if (!existsSync(sourceProject)) {
    return;
  }

  ensureDir(destProject);

  [
    "CODE_CONVENTIONS.md",
    "PROJECT_STRUCTURE.md",
    "README.md",
    "HARNESS_ARCHITECTURE.md",
    "WORKFLOW_CODING_CONSTITUTION.md",
    "WORKFLOW_LEARNING_CONSTITUTION.md",
    "WORKFLOW_CODING_STANDARD.md",
    "SKILL_MAINTENANCE.md",
  ].forEach(
    (fileName) => {
      const sourceFile = path.join(sourceProject, fileName);
      const destFile = path.join(destProject, fileName);

      if (!existsSync(sourceFile)) {
        return;
      }

      const isProtectedFile =
        fileName === "CODE_CONVENTIONS.md" || fileName === "PROJECT_STRUCTURE.md";

      if (isProtectedFile && existsSync(destFile)) {
        skip(`Skipping (already exists): docs/ai/project/${fileName}`);
        return;
      }

      copyFileForce(sourceFile, destFile);
    }
  );

  replaceDirectory(
    path.join(sourceProject, "template-convention"),
    path.join(destProject, "template-convention")
  );

  const sourceWorkflows = path.join(sourceRoot, "workflows");
  const destWorkflows = path.join(destRoot, "workflows");

  if (existsSync(sourceWorkflows)) {
    replaceDirectory(sourceWorkflows, destWorkflows);
    success("Updated: docs/ai/workflows");
  }

  const sourceTooling = path.join(sourceRoot, "tooling");
  const destTooling = path.join(destRoot, "tooling");

  if (existsSync(sourceTooling)) {
    replaceDirectory(sourceTooling, destTooling);
    success("Updated: docs/ai/tooling");
  }
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

function syncAgentsMd(stepMessage = "🔄 Syncing AGENTS.md to global scope (~/.codex/AGENTS.md)...") {
  step(stepMessage);

  try {
    const globalCodexDir = path.join(os.homedir(), ".codex");
    const globalAgentsMdPath = path.join(globalCodexDir, "AGENTS.md");
    const sourceAgentsMd = resolveSourcePath(".claude/CLAUDE.md");

    if (!existsSync(sourceAgentsMd)) {
      throw new Error("Missing source file: .claude/CLAUDE.md");
    }

    ensureDir(globalCodexDir);
    copyFileForce(sourceAgentsMd, globalAgentsMdPath);
    success("Updated: ~/.codex/AGENTS.md");
  } catch (installError) {
    error(`Failed to update ~/.codex/AGENTS.md: ${installError.message}`);
  }
}

function installCodex(skillIds) {
  step(`🔄 Syncing Codex skills (${skillIds.length} selected)...`);
  syncSelectedSkills("codex", skillIds);

  step("🔄 Syncing Codex roles (.agents/roles)...");
  syncFolder(".agents/roles");

  step("🔄 Syncing Codex themes (.agents/themes)...");
  syncFolder(".agents/themes");

  step("🔄 Syncing Codex config (.codex)...");
  const configTomlPath = resolveWorkspacePath(".codex/config.toml");
  const configTomlBackup = backupFileIfExists(configTomlPath);
  if (configTomlBackup) {
    success(`Backed up: .codex/config.toml → ${configTomlBackup}`);
  }
  syncFolder(".codex");
  success("Updated: .codex/config.toml");
}

function installAntigravity(skillIds) {
  step(`🔄 Syncing Antigravity skills (${skillIds.length} selected)...`);
  syncSelectedSkills("antigravity", skillIds);
}

function installStatusLine() {
  const sourceScript = resolveSourcePath(".claude/statusline.sh");
  const claudeDir = path.join(os.homedir(), ".claude");
  const statuslinePath = path.join(claudeDir, "statusline.sh");
  const settingsPath = path.join(claudeDir, "settings.json");
  const scriptGithubUrl = `https://github.com/${REPO}/blob/${DEFAULT_BRANCH}/.claude/statusline.sh`;
  const manualInstructions = `
${colors.yellow}⚠️  Manual statusline setup required:${colors.reset}

  1. Copy the script content from:
     ${colors.cyan}${scriptGithubUrl}${colors.reset}
     Save it to: ~/.claude/statusline.sh

  2. Make it executable:
     ${colors.cyan}chmod +x ~/.claude/statusline.sh${colors.reset}

  3. Add this to ~/.claude/settings.json (inside the root object):
     ${colors.cyan}"statusLine": { "type": "command", "command": "bash ~/.claude/statusline.sh" }${colors.reset}
`;

  step("🔄 Syncing statusline (~/.claude/statusline.sh)...");
  try {
    if (!existsSync(sourceScript)) {
      throw new Error("Missing source file: .claude/statusline.sh");
    }

    ensureDir(claudeDir);
    copyFileForce(sourceScript, statuslinePath);
    chmodSync(statuslinePath, 0o755);
    success("Updated: ~/.claude/statusline.sh");
  } catch (installError) {
    error(`Failed to setup ~/.claude/statusline.sh: ${installError.message}`);
    console.log(manualInstructions);
    return;
  }

  step("🔧 Updating statusLine in ~/.claude/settings.json...");
  try {
    const settings = readJsonFile(settingsPath, {});
    settings.statusLine = {
      type: "command",
      command: "bash ~/.claude/statusline.sh",
    };

    writeJsonFile(settingsPath, settings);
    success("Updated statusLine in: ~/.claude/settings.json");
  } catch (installError) {
    error(`Failed to update ~/.claude/settings.json: ${installError.message}`);
    console.log(manualInstructions);
  }
}

function installClaudeCode(skillIds) {
  step("🔄 Syncing Claude Code commands (.claude/commands)...");
  syncFolder(".claude/commands");

  step("🔄 Syncing Claude Code context memory to global scope (~/.claude/CLAUDE.md)...");
  try {
    const globalClaudeDir = path.join(os.homedir(), ".claude");
    const globalClaudeMdPath = path.join(globalClaudeDir, "CLAUDE.md");
    const sourceClaudeMd = resolveSourcePath(".claude/CLAUDE.md");

    if (!existsSync(sourceClaudeMd)) {
      throw new Error("Missing source file: .claude/CLAUDE.md");
    }

    ensureDir(globalClaudeDir);
    copyFileForce(sourceClaudeMd, globalClaudeMdPath);
    success("Updated: ~/.claude/CLAUDE.md");
  } catch (installError) {
    error(`Failed to update ~/.claude/CLAUDE.md: ${installError.message}`);
  }

  step("🔄 Syncing Claude Code statusline source (.claude/statusline.sh)...");
  syncFile(".claude/statusline.sh");

  step(`🔄 Syncing Claude Code skills (${skillIds.length} selected)...`);
  syncSelectedSkills("claude", skillIds);

  step("🔄 Syncing Claude Code themes (.claude/themes)...");
  syncFolder(".claude/themes");

  step("🔄 Syncing Claude Code output-styles (.claude/output-styles)...");
  syncFolder(".claude/output-styles");

  step("🔄 Syncing Claude Code agents (.claude/agents)...");
  syncFolder(".claude/agents");

  step("🔄 Syncing Claude Code scripts (.claude/scripts)...");
  syncFolder(".claude/scripts");

  step("🔄 Setting up Claude Code settings (.claude/settings.json)...");
  const settingsPath = resolveWorkspacePath(".claude/settings.json");
  const settingsBackup = backupFileIfExists(settingsPath);
  if (settingsBackup) {
    success(`Backed up: .claude/settings.json → ${settingsBackup}`);
  }
  syncFile(".claude/settings.json");
  success("Updated: .claude/settings.json");

  installStatusLine();
}

function installPi() {
  step("🔄 Syncing Pi extensions (.pi/extensions)...");
  syncFolder(".pi/extensions");

  step("🔄 Syncing Pi workflows (.pi/workflows)...");
  syncFolder(".pi/workflows");
}

function installCodingStandardKit(selectedTools, skillIds) {
  step("🔄 Syncing workflow template (docs/ai)...");
  syncDocsAI();

  ensureDocsDevFolder();

  const toolIds = selectedTools.map((tool) => tool.id);
  toolIds.forEach((toolId) => {
    installersByToolId[toolId](skillIds);
  });

  syncAgentsMd();

  const runtimeSkillPaths = selectedTools
    .filter((tool) => tool.id === "codex" || tool.id === "antigravity" || tool.id === "claude")
    .flatMap((tool) => {
      const runtimeRoot = tool.id === "claude" ? ".claude/skills" : ".agents/skills";
      return skillIds.map((skillId) => `${runtimeRoot}/${skillId}/`);
    });

  return ["docs/ai", ...runtimeSkillPaths, ...selectedTools.flatMap((tool) => tool.folders)];
}

function installWorkflowEvaluationKit(selectedTools, skillIds) {
  const installedPaths = [
    "docs/ai/project/WORKFLOW_CODING_CONSTITUTION.md",
    "docs/ai/project/WORKFLOW_LEARNING_CONSTITUTION.md",
    "docs/ai/project/WORKFLOW_EVALUATION_STANDARD.md",
    "docs/ai/project/templates/workflow-evaluation-report.html",
    "docs/ai/evaluation/observations/README.md",
    "docs/ai/evaluation/reports/README.md",
    "docs/ai/evaluation/session-traces/README.md",
  ];

  step("🔄 Syncing coding workflow constitution...");
  syncFile("docs/ai/project/WORKFLOW_CODING_CONSTITUTION.md");

  step("🔄 Syncing learning workflow constitution...");
  syncFile("docs/ai/project/WORKFLOW_LEARNING_CONSTITUTION.md");

  step("🔄 Syncing workflow evaluation standard...");
  syncFile("docs/ai/project/WORKFLOW_EVALUATION_STANDARD.md");
  syncFile("docs/ai/project/templates/workflow-evaluation-report.html");

  ensureDir(resolveWorkspacePath("docs/ai/evaluation/observations"));
  ensureDir(resolveWorkspacePath("docs/ai/evaluation/reports"));
  ensureDir(resolveWorkspacePath("docs/ai/evaluation/session-traces"));

  step("🔄 Syncing workflow evaluation artifacts docs...");
  syncFile("docs/ai/evaluation/observations/README.md");
  syncFile("docs/ai/evaluation/reports/README.md");
  syncFile("docs/ai/evaluation/session-traces/README.md");

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

  return installedPaths;
}

function installLearningWorkflowKit(selectedTools, skillIds) {
  const installedPaths = [
    "docs/ai/project/WORKFLOW_LEARNING_CONSTITUTION.md",
    "docs/ai/learning/",
    "docs/ai/learning/cases/",
    "docs/ai/learning/sessions/",
  ];

  step("🔄 Syncing learning workflow constitution...");
  syncFile("docs/ai/project/WORKFLOW_LEARNING_CONSTITUTION.md");
  ensureDir(resolveWorkspacePath("docs/ai/learning"));
  ensureDir(resolveWorkspacePath("docs/ai/learning/cases"));
  ensureDir(resolveWorkspacePath("docs/ai/learning/sessions"));

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

  return installedPaths;
}

const installersByToolId = {
  antigravity: installAntigravity,
  claude: installClaudeCode,
  codex: installCodex,
  pi: installPi,
};

const kitInstallersById = {
  "coding-standard": installCodingStandardKit,
  "lerning-workflow": installLearningWorkflowKit,
  "workflow-eval": installWorkflowEvaluationKit,
};

module.exports = {
  ensureDocsDevFolder,
  installersByToolId,
  kitInstallersById,
  syncAgentsMd,
  syncDocsAI,
};
