const path = require("path");

const REPO = "phananhtuan09/ai-agent-workflow";
const DEFAULT_BRANCH = process.env.AI_WORKFLOW_BRANCH || "main";
const SOURCE_ROOT = process.env.AI_WORKFLOW_SOURCE_ROOT
  ? path.resolve(process.env.AI_WORKFLOW_SOURCE_ROOT)
  : path.resolve(__dirname, "..");

const AI_TOOLS = [
  {
    id: "cursor",
    name: "Cursor",
    description: "AI-powered code editor",
    folders: [".cursor/commands", ".cursor/prompts"],
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    description: "AI pair programmer",
    folders: [".github/prompts"],
  },
  {
    id: "codex",
    name: "Codex",
    description: "OpenAI coding agent",
    folders: [
      ".agents/skills",
      ".agents/roles",
      ".agents/themes",
      ".codex",
      "AGENTS.md",
    ],
  },
  {
    id: "claude",
    name: "Claude Code",
    description: "Anthropic's AI coding assistant",
    folders: [
      ".claude/CLAUDE.md",
      ".claude/commands",
      ".claude/skills",
      ".claude/themes",
      ".claude/output-styles",
      ".claude/agents",
      ".claude/scripts",
      ".claude/settings.json",
      ".claude/statusline.sh",
    ],
  },
  {
    id: "opencode",
    name: "OpenCode",
    description: "Terminal-based AI coding agent",
    folders: [".opencode/command", ".opencode/skill", ".opencode/agent"],
  },
  {
    id: "factory",
    name: "Factory Droid",
    description: "Factory AI coding assistant",
    folders: [".factory/commands", ".factory/skills", ".factory/droids"],
  },
];

module.exports = {
  AI_TOOLS,
  DEFAULT_BRANCH,
  REPO,
  SOURCE_ROOT,
};
