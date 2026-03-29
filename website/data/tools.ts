export const tools = [
  {
    id: "claude" as const,
    label: "Claude Code",
    shortLabel: "CC",
    command:
      "curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool claude",
    installTargets: [
      ".claude/CLAUDE.md",
      ".claude/commands",
      ".claude/skills",
      ".claude/themes",
      ".claude/output-styles",
      ".claude/agents",
      ".claude/scripts",
      ".claude/settings.json",
      ".claude/statusline.sh"
    ]
  },
  {
    id: "codex" as const,
    label: "Codex",
    shortLabel: "CX",
    command:
      "curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool codex",
    installTargets: [
      ".agents/skills",
      ".agents/roles",
      ".agents/knowledge",
      ".agents/themes",
      ".codex",
      "AGENTS.md"
    ]
  },
  {
    id: "antigravity" as const,
    label: "Google Antigravity",
    shortLabel: "AG",
    command:
      "curl -fsSL https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/install.sh | bash -s -- --tool antigravity",
    installTargets: [".agents/skills", "AGENTS.md"]
  }
] as const;

export type ToolId = (typeof tools)[number]["id"];

export function getToolById(toolId: ToolId) {
  return tools.find((tool) => tool.id === toolId) ?? tools[0];
}
