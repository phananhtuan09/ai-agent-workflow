const path = require("path");

const REPO = "phananhtuan09/ai-agent-workflow";
const DEFAULT_BRANCH = process.env.AI_WORKFLOW_BRANCH || "main";
const SOURCE_ROOT = process.env.AI_WORKFLOW_SOURCE_ROOT
  ? path.resolve(process.env.AI_WORKFLOW_SOURCE_ROOT)
  : path.resolve(__dirname, "..");

const AI_TOOLS = [
  {
    id: "codex",
    name: "Codex",
    description: "OpenAI coding agent",
    folders: [
      ".agents/skills",
      ".agents/roles",
      ".agents/knowledge",
      ".agents/themes",
      ".codex",
      "AGENTS.md",
    ],
  },
  {
    id: "antigravity",
    name: "Google Antigravity",
    description: "Google's agentic development platform",
    folders: [".agents/skills", "AGENTS.md"],
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
];

module.exports = {
  AI_TOOLS,
  DEFAULT_BRANCH,
  REPO,
  SOURCE_ROOT,
};
