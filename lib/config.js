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
    description: "Core spec-driven workflow with optional skill bundles",
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
    description: "Workflow-evaluation docs and skills",
    installedPaths: [
      ".agents/skills/workflow-evaluation/",
      ".agents/skills/record-workflow-friction/",
      ".claude/skills/workflow-evaluation/",
      ".claude/skills/record-workflow-friction/",
      "docs/ai/project/WORKFLOW_CODING_CONSTITUTION.md",
      "docs/ai/project/WORKFLOW_LEARNING_CONSTITUTION.md",
      "docs/ai/project/WORKFLOW_EVALUATION_STANDARD.md",
      "docs/ai/project/templates/workflow-evaluation-report.html",
      "docs/ai/evaluation/observations/",
      "docs/ai/evaluation/reports/",
      "docs/ai/evaluation/session-traces/",
    ],
    nextSteps: [
      "Read the constitution for the workflow type being evaluated",
      "Read docs/ai/project/WORKFLOW_EVALUATION_STANDARD.md before running the workflow",
      "Use the workflow-evaluation skill to evaluate workflows instead of treating the doc as prose only",
      "Use the extractor inside the workflow-evaluation skill to normalize local Claude Code or Codex session transcripts before audit",
      "Use record-workflow-friction when you explicitly want to capture any agent execution issue for later trace-first evaluation",
      "Create evaluation artifacts under docs/ai/evaluation/reports/",
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
