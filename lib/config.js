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
    description: "Minimal terminal coding harness using repository protocol",
    folders: [],
  },
  {
    id: "opencode",
    name: "OpenCode",
    description: "OpenCode coding agent",
    folders: [".opencode/agents"],
  },
  {
    id: "claude",
    name: "Claude Code",
    description: "Anthropic's AI coding assistant",
    folders: [
      ".claude/skills",
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
    description: "Repository-driven direct execution with optional skills",
    nextSteps: [
      "Work directly from repository authority for bounded changes",
      "Create a durable plan only when work must survive sessions or needs shared recovery context",
      "Add specialized skills only when they materially help",
      "Keep product, decisions, plans, patterns, and runbooks under docs/",
      "Review skipped protocol files and keep existing project-owned content authoritative",
    ],
  },
  {
    id: "workflow-eval",
    name: "Workflow Evaluation",
    description: "Evaluation docs and skills under docs/evaluation",
    installedPaths: [
      ".agents/skills/workflow-evaluation/",
      ".agents/skills/record-workflow-friction/",
      ".claude/skills/workflow-evaluation/",
      ".claude/skills/record-workflow-friction/",
      "docs/evaluation/STANDARD.md",
      "docs/evaluation/templates/report.html",
      "docs/evaluation/observations/",
      "docs/evaluation/reports/",
      "docs/evaluation/session-traces/",
    ],
    nextSteps: [
      "Read docs/evaluation/STANDARD.md before evaluating a workflow",
      "Use workflow-evaluation to evaluate workflows instead of treating the standard as prose only",
      "Use the extractor inside workflow-evaluation to normalize local session transcripts before audit",
      "Use record-workflow-friction when you explicitly want to capture an execution issue for later trace-first evaluation",
      "Create evaluation artifacts under docs/evaluation/",
      "Re-run the installer with another tool if you want the mirrored skill in more runtimes",
    ],
  },
  {
    id: "learning-workflow",
    name: "Learning Workflow",
    description: "Mini-project learning coordinated across focused internal skills",
    installedPaths: [
      ".agents/skills/learning-workflow/",
      ".claude/skills/learning-workflow/",
      "docs/learning/README.md",
      "docs/learning/CONSTITUTION.md",
      "docs/learning/STANDARD.md",
      "docs/learning/",
      "docs/learning/project.json",
      "docs/learning/schedule.json",
    ],
    nextSteps: [
      "Set one human-approved long-term capability goal",
      "Review and approve docs/learning/project.json and docs/learning/schedule.json",
      "Invoke learning-workflow to start or resume the current mini-project",
      "Let learning-workflow coordinate case, evidence, and review helpers internally",
      "Keep one active learning session at a time",
      "Review docs/learning/profile.json for progression and the recommended next action",
    ],
  },
  {
    id: "design",
    name: "Design Capability",
    description: "Frontend design context under docs/ for an external design engine",
    installedPaths: [
      "docs/PRODUCT.md",
      "docs/DESIGN.md",
    ],
    nextSteps: [
      "Install the design engine once per machine: npx impeccable install --scope=global --no-hooks",
      "Run /impeccable init to fill docs/PRODUCT.md in place before designing a new surface",
      "Run /impeccable document to fill docs/DESIGN.md once there is shipped UI to read",
      "Keep docs/product/ and docs/decisions/ authoritative when they disagree with these files",
      "Never create PRODUCT.md or DESIGN.md at the repository root or under .agents/context/",
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
