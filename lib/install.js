const { chmodSync, existsSync } = require("fs");
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
} = require("./fs-utils");

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

  const subfolders = ["planning", "testing", "requirements"];
  const filesToCopy = [
    "README.md",
    "unit-template.md",
    "req-template.md",
    "figma-template.md",
    "integration-template.md",
    "web-template.md",
    "feature-template.md",
    "epic-template.md",
  ];

  subfolders.forEach((subfolder) => {
    const sourceSubfolder = path.join(sourceRoot, subfolder);
    const destSubfolder = path.join(destRoot, subfolder);

    if (!existsSync(sourceSubfolder)) {
      return;
    }

    ensureDir(destSubfolder);

    filesToCopy.forEach((fileName) => {
      const sourceFile = path.join(sourceSubfolder, fileName);
      if (existsSync(sourceFile)) {
        copyFileForce(sourceFile, path.join(destSubfolder, fileName));
      }
    });

    if (subfolder === "requirements" || subfolder === "planning") {
      const archiveDir = path.join(destSubfolder, "archive");
      if (!existsSync(archiveDir)) {
        ensureDir(archiveDir);
        success(`Created: docs/ai/${subfolder}/archive`);
      }
    }

    if (subfolder === "requirements") {
      const sourceTemplates = path.join(sourceSubfolder, "templates");
      const destTemplates = path.join(destSubfolder, "templates");

      if (existsSync(sourceTemplates)) {
        replaceDirectory(sourceTemplates, destTemplates);
        success("Updated: docs/ai/requirements/templates");
      }
    }
  });

  const sourceProject = path.join(sourceRoot, "project");
  const destProject = path.join(destRoot, "project");

  if (!existsSync(sourceProject)) {
    return;
  }

  ensureDir(destProject);

  ["CODE_CONVENTIONS.md", "PROJECT_STRUCTURE.md", "README.md"].forEach(
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

function syncAgentsMd(stepMessage = "🔄 Syncing AGENTS.md...") {
  step(stepMessage);
  syncFile("AGENTS.md", "AGENTS.md");
}

function installCodex() {
  step("🔄 Syncing Codex skills (.agents/skills)...");
  syncFolder(".agents/skills");

  step("🔄 Syncing Codex roles (.agents/roles)...");
  syncFolder(".agents/roles");

  step("🔄 Syncing Codex knowledge (.agents/knowledge)...");
  syncFolder(".agents/knowledge");

  step("🔄 Syncing Codex themes (.agents/themes)...");
  syncFolder(".agents/themes");

  step("🔄 Syncing Codex config (.codex)...");
  syncFolder(".codex");
}

function installAntigravity() {
  step("🔄 Syncing Antigravity skills (.agents/skills)...");
  syncFolder(".agents/skills");
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

function installClaudeCode() {
  step("🔄 Syncing Claude Code commands (.claude/commands)...");
  syncFolder(".claude/commands");

  step("🔄 Syncing Claude Code context memory (.claude/CLAUDE.md)...");
  syncFile(".claude/CLAUDE.md");

  step("🔄 Syncing Claude Code statusline source (.claude/statusline.sh)...");
  syncFile(".claude/statusline.sh");

  step("🔄 Syncing Claude Code skills (.claude/skills)...");
  syncFolder(".claude/skills");

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

  if (existsSync(settingsPath)) {
    skip("Skipping (already exists): .claude/settings.json");
  } else {
    syncFile(".claude/settings.json");
    success("Created: .claude/settings.json");
  }

  installStatusLine();
}

const installersByToolId = {
  antigravity: installAntigravity,
  claude: installClaudeCode,
  codex: installCodex,
};

module.exports = {
  ensureDocsDevFolder,
  installersByToolId,
  syncAgentsMd,
  syncDocsAI,
};
