const fs = require("fs");
const path = require("path");

const { adaptSkillContent } = require("./skills");

const PROTOCOL_FILES = [
  "AGENTS.md",
  "docs/README.md",
  "docs/WORKFLOW.md",
  "docs/product/README.md",
  "docs/decisions/README.md",
  "docs/plans/active/README.md",
  "docs/plans/completed/README.md",
  "docs/patterns/README.md",
  "docs/runbooks/README.md",
];

const CLAUDE_PROJECT_FILE = ".claude/CLAUDE.md";
const GLOBAL_INSTRUCTIONS_FILE = ".claude/CLAUDE.global.md";

const EVALUATION_FILES = [
  "docs/evaluation/README.md",
  "docs/evaluation/STANDARD.md",
  "docs/evaluation/templates/report.html",
  "docs/evaluation/observations/README.md",
  "docs/evaluation/reports/README.md",
  "docs/evaluation/session-traces/README.md",
];

const LEARNING_PROTOCOL_FILES = [
  "docs/learning/README.md",
  "docs/learning/CONSTITUTION.md",
  "docs/learning/STANDARD.md",
];

const DESIGN_CAPABILITY_FILES = [
  "docs/PRODUCT.md",
  "docs/DESIGN.md",
];

const TESTING_FILES = [
  "docs/testing/README.md",
  "docs/testing/active/README.md",
  "docs/testing/completed/README.md",
];

const REPOSITORY_EXACT_PATHS = new Set([
  ...PROTOCOL_FILES,
  ...EVALUATION_FILES,
  ...LEARNING_PROTOCOL_FILES,
  ...TESTING_FILES,
  ...DESIGN_CAPABILITY_FILES,
  ".codex/config.toml",
  ".claude/statusline.sh",
  ".claude/settings.json",
  CLAUDE_PROJECT_FILE,
]);

const REPOSITORY_MANAGED_PREFIXES = [
  "docs/evaluation/",
  "docs/learning/",
  ".agents/skills/",
  ".agents/roles/",
  // Theme payloads were removed. These prefixes stay so an installed state that
  // still records them validates, and update retires the files instead of
  // failing on an unmanaged path.
  ".agents/themes/",
  ".codex/agents/",
  ".claude/agents/",
  ".claude/skills/",
  ".claude/themes/",
  ".claude/output-styles/",
  ".claude/scripts/",
  ".opencode/agents/",
];

// Kept only so updates from the pre-hard-cut release can validate state and
// preserve existing consumer files. New payloads never add these paths.
const LEGACY_MANAGED_PREFIXES = [
  "docs/ai/",
  ".claude/commands/",
  ".pi/extensions/",
  ".agents/roles/review-spec",
  ".codex/agents/review-spec",
  ".claude/agents/review-spec",
  ".opencode/agents/review-spec",
  ".agents/skills/review-pr/references/orchestrator-contract.md",
  ".claude/skills/review-pr/references/orchestrator-contract.md",
  ...[
    "orchestrator",
    "design-spec",
    "create-spec",
    "execute-spec",
    "execute-gnhf",
    "manual-checklist",
    "verify-feature",
    "verify-runtime",
    "verify-workflow",
    "sync-spec",
    "idea-review",
    "execute-task",
    "init",
  ].flatMap((skillId) => [
    `.agents/skills/${skillId}/`,
    `.claude/skills/${skillId}/`,
  ]),
];

function isAllowedManagedPath(scope, relativePath) {
  if (scope === "codex-global") return relativePath === "AGENTS.md";
  if (scope === "claude-global") return relativePath === "CLAUDE.md";
  if (scope !== "repository") return false;
  return REPOSITORY_EXACT_PATHS.has(relativePath) ||
    REPOSITORY_MANAGED_PREFIXES.some((prefix) => relativePath.startsWith(prefix)) ||
    LEGACY_MANAGED_PREFIXES.some((prefix) => relativePath.startsWith(prefix));
}

function isLegacyManagedPath(scope, relativePath) {
  return scope === "repository" && LEGACY_MANAGED_PREFIXES.some(
    (prefix) => relativePath.startsWith(prefix)
  );
}

function portablePath(value) {
  return value.split(path.sep).join("/");
}

function sourcePathInsideRoot(sourceRoot, relativePath) {
  const root = path.resolve(sourceRoot);
  const candidate = path.resolve(root, relativePath);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Managed source path escapes package root: ${relativePath}`);
  }
  return candidate;
}

function addSourceFile(files, sourceRoot, sourceRelativePath, options = {}) {
  const sourcePath = sourcePathInsideRoot(sourceRoot, sourceRelativePath);
  if (!fs.existsSync(sourcePath)) return;

  const sourceStat = fs.lstatSync(sourcePath);
  if (sourceStat.isSymbolicLink()) {
    throw new Error(`Managed source path must not be a symlink: ${sourceRelativePath}`);
  }
  if (!sourceStat.isFile()) return;

  let bytes = fs.readFileSync(sourcePath);
  if (options.runtime && (sourceRelativePath.endsWith(".md") || sourceRelativePath.endsWith(".py"))) {
    bytes = Buffer.from(
      adaptSkillContent(bytes.toString("utf8"), options.runtime, options.skillId),
      "utf8"
    );
  }

  const scope = options.scope || "repository";
  const targetPath = portablePath(options.targetPath || sourceRelativePath);
  files.set(`${scope}:${targetPath}`, {
    scope,
    path: targetPath,
    bytes,
    mode: sourceStat.mode & 0o777,
  });
}

function addSourceTree(files, sourceRoot, sourceRelativeRoot, options = {}) {
  const sourceRootPath = sourcePathInsideRoot(sourceRoot, sourceRelativeRoot);
  if (!fs.existsSync(sourceRootPath)) return;

  const sourceStat = fs.lstatSync(sourceRootPath);
  if (sourceStat.isSymbolicLink()) {
    throw new Error(`Managed source path must not be a symlink: ${sourceRelativeRoot}`);
  }
  if (!sourceStat.isDirectory()) {
    addSourceFile(files, sourceRoot, sourceRelativeRoot, options);
    return;
  }

  fs.readdirSync(sourceRootPath, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .forEach((entry) => {
      const childSource = portablePath(path.join(sourceRelativeRoot, entry.name));
      if (entry.isSymbolicLink()) {
        throw new Error(`Managed source path must not be a symlink: ${childSource}`);
      }
      const childTarget = options.targetRoot
        ? portablePath(path.join(options.targetRoot, path.relative(sourceRelativeRoot, childSource)))
        : childSource;
      if (entry.isDirectory()) {
        addSourceTree(files, sourceRoot, childSource, {
          ...options,
          targetRoot: childTarget,
        });
      } else if (entry.isFile()) {
        addSourceFile(files, sourceRoot, childSource, {
          ...options,
          targetPath: childTarget,
        });
      }
    });
}

function addSkill(files, sourceRoot, runtime, skillId) {
  const targetRoot = runtime === "claude"
    ? `.claude/skills/${skillId}`
    : `.agents/skills/${skillId}`;
  addSourceTree(files, sourceRoot, `skills/${skillId}`, {
    runtime,
    skillId,
    targetRoot,
  });
}

function codingSubagentIds(skillIds) {
  return skillIds.includes("review-pr") ? ["review-pr"] : [];
}

function addSelectedSubagents(files, sourceRoot, runtimeIds, selectedIds = null) {
  const roots = {
    claude: ".claude/agents",
    codex: ".codex/agents",
    opencode: ".opencode/agents",
  };
  const extensions = { claude: "md", codex: "toml", opencode: "md" };

  runtimeIds.forEach((runtime) => {
    const root = roots[runtime];
    if (!root) return;
    if (selectedIds === null) {
      addSourceTree(files, sourceRoot, root);
      return;
    }
    selectedIds.forEach((id) => {
      addSourceFile(files, sourceRoot, `${root}/${id}.${extensions[runtime]}`);
    });
  });
}

function addCodingStandardFiles(files, sourceRoot, runtimeIds, skillIds) {
  PROTOCOL_FILES.forEach((relativePath) => addSourceFile(files, sourceRoot, relativePath));
  if (skillIds.includes("runtime-e2e-test-plan")) {
    TESTING_FILES.forEach((relativePath) => addSourceFile(files, sourceRoot, relativePath));
  }

  runtimeIds.forEach((runtime) => {
    if (runtime === "codex") {
      skillIds.forEach((skillId) => addSkill(files, sourceRoot, runtime, skillId));
      codingSubagentIds(skillIds).forEach((roleId) => {
        addSourceFile(files, sourceRoot, `.agents/roles/${roleId}.md`);
      });
      addSourceFile(files, sourceRoot, ".codex/config.toml");
    } else if (runtime === "antigravity") {
      skillIds.forEach((skillId) => addSkill(files, sourceRoot, runtime, skillId));
    } else if (runtime === "claude") {
      skillIds.forEach((skillId) => addSkill(files, sourceRoot, runtime, skillId));
      addSourceFile(files, sourceRoot, "AGENTS.md", {
        targetPath: CLAUDE_PROJECT_FILE,
      });
      addSourceTree(files, sourceRoot, ".claude/output-styles");
      addSourceTree(files, sourceRoot, ".claude/scripts");
      addSourceFile(files, sourceRoot, ".claude/statusline.sh");
      addSourceFile(files, sourceRoot, ".claude/settings.json");
    }
  });

  addSelectedSubagents(files, sourceRoot, runtimeIds, codingSubagentIds(skillIds));

  if (runtimeIds.includes("codex")) {
    addSourceFile(files, sourceRoot, GLOBAL_INSTRUCTIONS_FILE, {
      scope: "codex-global",
      targetPath: "AGENTS.md",
    });
  }
  if (runtimeIds.includes("claude")) {
    addSourceFile(files, sourceRoot, GLOBAL_INSTRUCTIONS_FILE, {
      scope: "claude-global",
      targetPath: "CLAUDE.md",
    });
  }
}

function addWorkflowEvaluationFiles(files, sourceRoot, runtimeIds, skillIds) {
  EVALUATION_FILES.forEach((relativePath) => addSourceFile(files, sourceRoot, relativePath));
  const needsSharedSkills = runtimeIds.some(
    (runtime) => runtime === "codex" || runtime === "antigravity"
  );
  if (needsSharedSkills) {
    skillIds.forEach((skillId) => addSkill(files, sourceRoot, "codex", skillId));
  }
  if (runtimeIds.includes("claude")) {
    skillIds.forEach((skillId) => addSkill(files, sourceRoot, "claude", skillId));
  }
  addSelectedSubagents(files, sourceRoot, runtimeIds);
}

function addLearningWorkflowFiles(files, sourceRoot, runtimeIds, skillIds) {
  LEARNING_PROTOCOL_FILES.forEach((relativePath) => addSourceFile(files, sourceRoot, relativePath));
  const needsSharedSkills = runtimeIds.some(
    (runtime) => runtime === "codex" || runtime === "antigravity"
  );
  if (needsSharedSkills) {
    skillIds.forEach((skillId) => addSkill(files, sourceRoot, "codex", skillId));
  }
  if (runtimeIds.includes("claude")) {
    skillIds.forEach((skillId) => addSkill(files, sourceRoot, "claude", skillId));
  }
  addSelectedSubagents(files, sourceRoot, runtimeIds);
}

function addDesignCapabilityFiles(files, sourceRoot, runtimeIds, skillIds) {
  DESIGN_CAPABILITY_FILES.forEach((relativePath) => addSourceFile(files, sourceRoot, relativePath));
  const needsSharedSkills = runtimeIds.some(
    (runtime) => runtime === "codex" || runtime === "antigravity"
  );
  if (needsSharedSkills) {
    skillIds.forEach((skillId) => addSkill(files, sourceRoot, "codex", skillId));
  }
  if (runtimeIds.includes("claude")) {
    skillIds.forEach((skillId) => addSkill(files, sourceRoot, "claude", skillId));
  }
  addSelectedSubagents(files, sourceRoot, runtimeIds);
}

function buildManagedFiles({ sourceRoot, kitId, runtimeIds, skillIds }) {
  const files = new Map();
  if (kitId === "coding-standard") {
    addCodingStandardFiles(files, sourceRoot, runtimeIds, skillIds);
  } else if (kitId === "workflow-eval") {
    addWorkflowEvaluationFiles(files, sourceRoot, runtimeIds, skillIds);
  } else if (kitId === "learning-workflow") {
    addLearningWorkflowFiles(files, sourceRoot, runtimeIds, skillIds);
  } else if (kitId === "design") {
    addDesignCapabilityFiles(files, sourceRoot, runtimeIds, skillIds);
  } else {
    throw new Error(`No managed payload registered for kit: ${kitId}`);
  }
  files.forEach((file) => {
    if (!isAllowedManagedPath(file.scope, file.path)) {
      throw new Error(`Managed payload path is outside the harness allowlist: ${file.scope}:${file.path}`);
    }
  });
  return files;
}

function buildManagedFilesFromSelection({ sourceRoot, selection }) {
  const files = new Map();
  addCodingStandardFiles(
    files,
    sourceRoot,
    selection.core?.runtimes || [],
    selection.core?.skills || []
  );
  (selection.addons || []).forEach((addon) => {
    if (addon.id === "evaluation") {
      addWorkflowEvaluationFiles(files, sourceRoot, addon.runtimes || [], addon.skills || []);
    } else if (addon.id === "learning") {
      addLearningWorkflowFiles(files, sourceRoot, addon.runtimes || [], addon.skills || []);
    } else if (addon.id === "design") {
      addDesignCapabilityFiles(files, sourceRoot, addon.runtimes || [], addon.skills || []);
    } else {
      throw new Error(`No managed payload registered for addon: ${addon.id}`);
    }
  });
  files.forEach((file) => {
    if (!isAllowedManagedPath(file.scope, file.path)) {
      throw new Error(`Managed payload path is outside the harness allowlist: ${file.scope}:${file.path}`);
    }
  });
  return files;
}

module.exports = {
  DESIGN_CAPABILITY_FILES,
  EVALUATION_FILES,
  CLAUDE_PROJECT_FILE,
  GLOBAL_INSTRUCTIONS_FILE,
  LEARNING_PROTOCOL_FILES,
  TESTING_FILES,
  isAllowedManagedPath,
  isLegacyManagedPath,
  PROTOCOL_FILES,
  buildManagedFiles,
  buildManagedFilesFromSelection,
};
