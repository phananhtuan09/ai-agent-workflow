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
    ],
  },
  {
    id: "antigravity",
    name: "Google Antigravity",
    description: "Google's agentic development platform",
    folders: [".agents/skills"],
  },
  {
    id: "pi",
    name: "Pi",
    description: "Minimal terminal coding harness with extensions",
    folders: [".pi/extensions", ".pi/workflows"],
  },
  {
    id: "claude",
    name: "Claude Code",
    description: "Anthropic's AI coding assistant",
    folders: [
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

const WORKFLOW_KITS = [
  {
    id: "coding-standard",
    name: "Coding Standard",
    description: "Current spec-driven install flow with shared docs, tools, and runtime assets",
    nextSteps: [
      "Review and customize ~/.codex/AGENTS.md for your project",
      "For Codex and Antigravity, keep shared skills in .agents/skills",
      "Check docs/ai/project/ for coding conventions",
      "Review any existing docs/ folder and confirm which docs should stay canonical",
    ],
  },
  {
    id: "workflow-eval",
    name: "Workflow Evaluation",
    description: "Minimal workflow-evaluation bundle with the standard doc and mirrored skills",
    installedPaths: [
      ".agents/skills/workflow-evaluation/SKILL.md",
      ".claude/skills/workflow-evaluation/SKILL.md",
      "docs/ai/project/WORKFLOW_EVALUATION_STANDARD.md",
    ],
    nextSteps: [
      "Read docs/ai/project/WORKFLOW_EVALUATION_STANDARD.md before running the workflow",
      "Use the workflow-evaluation skill to evaluate workflows instead of treating the doc as prose only",
      "Create evaluation artifacts under docs/ai/workflow-evals/",
      "Re-run the installer with another tool if you want the mirrored skill in more runtimes",
    ],
  },
];

const DEFAULT_KIT_ID = "coding-standard";

module.exports = {
  AI_TOOLS,
  DEFAULT_KIT_ID,
  DEFAULT_BRANCH,
  REPO,
  SOURCE_ROOT,
  WORKFLOW_KITS,
};
