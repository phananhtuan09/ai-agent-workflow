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
    summary:
      "The first decision is the foundation. If the base tool already exposes workflow surfaces, you can design a system instead of hiding everything inside one giant prompt.",
    bullets: [
      "Choose the base tool before designing prompts or templates.",
      "Look for reusable workflow surfaces: commands, skills, output styles, and agents.",
      "A good foundation makes the workflow inspectable and portable later.",
    ],
    whyItMatters:
      "When the tool already gives you workflow primitives, you spend less time fighting the interface and more time shaping a repeatable system.",
    takeaway:
      "Start with workflow primitives, not prompt gymnastics.",
    inspectLabel:
      "Inspect one asset from each Claude Code surface so the workflow feels concrete instead of theoretical.",
    inspectBullets: [
      "Open a command to see the user-facing entry point.",
      "Open a skill to see reusable task logic.",
      "Open an output style or agent to see how behavior gets specialized.",
    ],
    graphTitle: "Claude Code primitives",
    graphDescription:
      "The workflow becomes easier to reason about when each responsibility lives in a visible surface.",
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
    graphFocusIndex: 0,
    comparison: [
      {
        title: "Generic Chat Tool",
        body: "Fast for ad-hoc help, but most workflow structure stays trapped inside prompts and chat memory.",
      },
      {
        title: "Claude Code",
        body: "Commands, skills, output styles, and agents are durable assets you can inspect, refine, and migrate.",
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
    summary:
      "Before the workflow starts, shape the environment. Permissions, live context, and default instructions decide whether the agent feels safe, predictable, and useful.",
    bullets: [
      "Permissions define what the agent may and may not do.",
      "A status line keeps the session readable while work is in progress.",
      "A shared instruction file prevents session-to-session drift.",
    ],
    whyItMatters:
      "Most workflow quality problems come from setup drift. If permissions are wrong or the operating contract is vague, every future step gets noisier.",
    takeaway:
      "Configure the room before asking the agent to work in it.",
    inspectLabel:
      "Each config file controls a different risk: unsafe actions, unreadable sessions, or inconsistent behavior.",
    inspectBullets: [
      "Check `settings.json` for guardrails and allowed operations.",
      "Check `statusline.sh` for the live context shown during work.",
      "Check `CLAUDE.md` for the durable session contract.",
    ],
    graphTitle: "Three config surfaces",
    graphDescription:
      "These three files create the operating environment before the first implementation task begins.",
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
    graphFocusIndex: 1,
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
    summary:
      "Commands and skills should reduce repetition, not create a second documentation system. Use commands for entry points and skills for reusable specialized behavior.",
    bullets: [
      "A command is a clear way to enter a workflow path.",
      "A skill is a reusable module for a recurring task pattern.",
      "Fewer assets with sharper purpose beat many overlapping assets.",
    ],
    whyItMatters:
      "Packaging repeated work turns good behavior into a system. Packaging vague ideas into too many files just creates friction.",
    takeaway: "Package repetition, not theory.",
    inspectLabel:
      "Compare the command entry point with the narrower skill it can trigger so the routing logic becomes obvious.",
    inspectBullets: [
      "Use the command file to understand how the workflow starts.",
      "Use the skill file to see where specialization actually lives.",
      "Notice that the assets are complementary, not duplicates.",
    ],
    graphTitle: "Command to skill flow",
    graphDescription:
      "The point is not to show more files. The point is to show how a request gets progressively narrowed.",
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
    graphFocusIndex: 2,
    comparison: [
      {
        title: "Command",
        body: "User-triggered entry point. Best when the developer already knows which workflow path to start.",
      },
      {
        title: "Skill",
        body: "Reusable instruction module. Best when the same specialized behavior appears across multiple tasks.",
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
    summary:
      "The workflow works because it copies real engineering structure. AI should move through requirement, plan, implementation, review, and testing instead of improvising inside one long prompt session.",
    bullets: [
      "Clarify the requirement before writing code.",
      "Create a plan for larger work so implementation has a stable target.",
      "Review and test before declaring the task done.",
    ],
    whyItMatters:
      "Clear phases reduce ambiguity, catch mistakes earlier, and let context move from one step to the next without relying on chat memory.",
    takeaway:
      "AI helps most when it follows the same discipline as a strong engineer.",
    inspectLabel:
      "Use the example files as phase markers. Each one should map to a concrete part of the engineering loop.",
    inspectBullets: [
      "Find the requirement-facing asset that sharpens the ask.",
      "Find the planning and implementation entry points.",
      "Find the review or testing artifact that closes the loop.",
    ],
    graphTitle: "Workflow phases",
    graphDescription:
      "The graph should read like a pipeline with checkpoints, not like a list of concepts.",
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
    graphFocusIndex: 3,
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
