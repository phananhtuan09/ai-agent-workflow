import { promises as fs } from "fs";
import path from "path";
import {
  LandingPageGuide,
  type LandingGuideStep,
} from "@/components/client/landing-page-guide";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const GITHUB_REPO_URL =
  "https://github.com/phananhtuan09/ai-agent-workflow/blob/main";

const stepBlueprints: Array<
  Omit<LandingGuideStep, "examples"> & {
    examples: Array<
      Omit<LandingGuideStep["examples"][number], "content" | "githubHref">
    >;
  }
> = [
  {
    id: "foundation",
    stepLabel: "Step 1 of 4",
    title: "Start with a tool that already has workflow building blocks",
    body: "If you want to build your own AI workflow, the first decision is not the prompt. It is the base tool. Claude Code is a strong starting point because it already exposes concepts like commands, skills, hooks, output styles, and sub agents. Those concepts make workflow design much more concrete.",
    whyItMatters:
      "When the tool already has clear workflow primitives, you spend less time fighting the interface and more time designing the system.",
    takeaway:
      "Claude Code is a strong place to design the workflow first, then migrate the same ideas elsewhere later.",
    graphTitle: "Claude Code primitives",
    graphDescription:
      "These surfaces become the building blocks of the workflow instead of hiding everything inside one giant prompt.",
    graphNodes: [
      {
        label: "Commands",
        caption: "Explicit entry points the user can trigger directly.",
      },
      {
        label: "Skills",
        caption: "Reusable instruction modules for repeated task patterns.",
      },
      {
        label: "Output Styles",
        caption: "Named working modes that shape how the agent behaves.",
      },
      {
        label: "Sub Agents",
        caption: "Specialized roles that keep complex work decomposed.",
      },
    ],
    comparison: [
      {
        title: "Generic Chat Tool",
        body: "Useful for quick help, but weak as a workflow foundation because most structure stays trapped inside prompts and memory.",
      },
      {
        title: "Claude Code",
        body: "Commands, skills, output styles, and agents are file-based assets you can inspect, refine, and migrate.",
      },
    ],
    examples: [
      {
        path: ".claude/commands/create-plan.md",
        label: "Command",
        language: "markdown",
      },
      {
        path: ".claude/skills/frontend-design-fundamentals/SKILL.md",
        label: "Skill",
        language: "markdown",
      },
      {
        path: ".claude/output-styles/brainstorm-partner.md",
        label: "Output Style",
        language: "markdown",
      },
      {
        path: ".claude/agents/task-investigator.md",
        label: "Agent",
        language: "markdown",
      },
    ],
  },
  {
    id: "setup",
    stepLabel: "Step 2 of 4",
    title: "Configure Claude Code before you build the workflow",
    body: "In this workflow, Claude Code is not used as a raw chat tool. It is configured first. Permissions define what the agent can do safely. The status line keeps the session readable while you work. CLAUDE.md ensures every new session starts with the same rules, coding philosophy, and response behavior.",
    whyItMatters:
      "A good workflow starts with the environment the agent runs inside. If permissions are too loose, the tool becomes risky. If they are too strict, every useful action creates friction. If session rules are unclear, behavior drifts from one chat to the next.",
    takeaway:
      "These files are separate, but together they make Claude Code predictable.",
    graphTitle: "Three config surfaces",
    graphDescription:
      "Permissions, live context, and durable instructions shape one controlled working environment.",
    graphNodes: [
      {
        label: "settings.json",
        caption:
          "Allow normal engineering work, but explicitly block destructive shell and risky git commands.",
      },
      {
        label: "statusline.sh",
        caption:
          "Keep model, folder, branch, and context usage visible while you work.",
      },
      {
        label: "CLAUDE.md",
        caption: "Load the same operating contract into every new session.",
      },
    ],
    examples: [
      {
        path: ".claude/settings.json",
        label: "settings.json",
        language: "json",
      },
      {
        path: ".claude/statusline.sh",
        label: "statusline.sh",
        language: "bash",
      },
      { path: ".claude/CLAUDE.md", label: "CLAUDE.md", language: "markdown" },
    ],
  },
  {
    id: "packaging",
    stepLabel: "Step 3 of 4",
    title: "Use commands and skills to package repeated workflow patterns",
    body: "In Claude Code, commands and skills do different jobs. A command is how you enter the workflow. A skill is reusable logic that helps Claude handle a specific kind of task well. The goal is not to create many of them. The goal is to create the ones you actually use repeatedly.",
    whyItMatters:
      "When these assets match your real workflow, Claude becomes more consistent. When they are generic, overlapping, or copied blindly, they create confusion instead of leverage.",
    takeaway: "Create fewer workflow assets, but make each one clearly useful.",
    graphTitle: "Command to skill flow",
    graphDescription:
      "A user-triggered entry point can route into a narrower skill when the prompt matches a known need.",
    graphNodes: [
      {
        label: "User Prompt",
        caption:
          "The developer asks for a plan and includes a frontend theme problem.",
      },
      {
        label: "/create-plan",
        caption: "Claude Code loads the explicit entry point the user invoked.",
      },
      {
        label: "Theme Skill Match",
        caption:
          "The request matches a reusable frontend theme-selection pattern.",
      },
      {
        label: "Structured Output",
        caption: "The skill sharpens the plan with concrete visual direction.",
      },
    ],
    comparison: [
      {
        title: "Command",
        body: "User-triggered entry point. Good when the developer already knows which workflow path they want to start.",
      },
      {
        title: "Skill",
        body: "Reusable instruction module. Good when the same specialized behavior appears across different tasks.",
      },
    ],
    examples: [
      {
        path: ".claude/commands/create-plan.md",
        label: "/create-plan",
        language: "markdown",
      },
      {
        path: ".claude/skills/frontend-design-theme-factory/SKILL.md",
        label: "theme skill",
        language: "markdown",
      },
    ],
  },
  {
    id: "phases",
    stepLabel: "Step 4 of 4",
    title: "Keep the same five phases a strong developer would already use",
    body: "This workflow uses five phases because a good developer already works this way without AI: clarify the requirement, create a plan if the task is large, implement, review, and test. AI should follow that structure instead of replacing it with one long prompt session.",
    whyItMatters:
      "The clearer each phase is, the easier it becomes to check output quality, detect mistakes early, and hand context from one step to the next.",
    takeaway:
      "The workflow works because the phases match real engineering work.",
    graphTitle: "Workflow phases",
    graphDescription:
      "Each phase exists to reduce ambiguity before the next phase begins, which keeps both the human and the agent aligned.",
    graphNodes: [
      {
        label: "Requirement",
        caption: "Clarify the feature before you ask the agent to build it.",
      },
      {
        label: "Plan",
        caption: "Turn large work into a durable, executable plan file.",
      },
      {
        label: "Implement",
        caption:
          "Write code against the plan instead of improvising from memory.",
      },
      {
        label: "Review",
        caption:
          "Check logic, conventions, performance, and security before merge.",
      },
      {
        label: "Testing",
        caption: "Confirm the implementation matches the intended behavior.",
      },
    ],
    examples: [
      {
        path: ".claude/output-styles/brainstorm-partner.md",
        label: "Requirement",
        language: "markdown",
      },
      {
        path: ".claude/commands/requirements-orchestrator.md",
        label: "Plan Input",
        language: "markdown",
      },
      {
        path: ".claude/commands/development-orchestrator.md",
        label: "Implement",
        language: "markdown",
      },
      {
        path: ".claude/commands/code-review.md",
        label: "Review",
        language: "markdown",
      },
      {
        path: "docs/ai/planning/feature-template.md",
        label: "Testing",
        language: "markdown",
      },
    ],
  },
];

export default async function Page() {
  const steps = await Promise.all(
    stepBlueprints.map(async (step) => ({
      ...step,
      examples: await Promise.all(
        step.examples.map(async (example) => {
          const fullPath = path.join(REPO_ROOT, example.path);
          const content = await fs.readFile(fullPath, "utf8");

          return {
            ...example,
            content,
            githubHref: `${GITHUB_REPO_URL}/${example.path}`,
          };
        }),
      ),
    })),
  );

  return <LandingPageGuide steps={steps} />;
}
