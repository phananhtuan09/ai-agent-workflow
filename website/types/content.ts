export type Locale = "en" | "vi";

export type ToolId = "claude" | "codex" | "antigravity";

export type LocalizedCopy = {
  en: string;
  vi: string;
};

export type SkillCategoryId =
  | "planning"
  | "orchestration"
  | "requirements"
  | "frontend"
  | "quality";

export type SkillSummary = {
  id: string;
  name: string;
  description: LocalizedCopy;
  category: SkillCategoryId;
  tools: ToolId[];
  tags: string[];
  triggerKeywords: string[];
  useCases: LocalizedCopy[];
};

export type WorkflowNode = {
  id: string;
  label: LocalizedCopy;
  x: number;
  y: number;
  emphasis?: "primary" | "secondary";
};

export type WorkflowEdge = {
  from: string;
  to: string;
  style?: "solid" | "dashed";
};

export type WorkflowSourceKind = "command" | "skill" | "agent" | "rule";

export type WorkflowTierId = "basic" | "advanced" | "power";

export type WorkflowMacroPhaseId =
  | "requirement"
  | "planning"
  | "implement"
  | "review-testing";

export type WorkflowAccent = "cyan" | "blue" | "amber";

export type WorkflowSourceRef = {
  id: string;
  label: LocalizedCopy;
  kind: WorkflowSourceKind;
  path: string;
  tools: ToolId[];
  note: LocalizedCopy;
};

export type WorkflowMiniGraph = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type WorkflowFlowStep = {
  id: string;
  title: LocalizedCopy;
  detail: LocalizedCopy;
};

export type WorkflowTierCardData = {
  id: WorkflowTierId;
  title: LocalizedCopy;
  summary: LocalizedCopy;
  useCase: LocalizedCopy;
  benefit: LocalizedCopy;
  realExample?: LocalizedCopy;
  result?: LocalizedCopy;
  accent: WorkflowAccent;
  tools: ToolId[];
  graph: WorkflowMiniGraph;
  flowSteps?: WorkflowFlowStep[];
  sources: WorkflowSourceRef[];
};

export type WorkflowMacroPhase = {
  id: WorkflowMacroPhaseId;
  title: LocalizedCopy;
  shortLabel: LocalizedCopy;
  summary: LocalizedCopy;
  caption: LocalizedCopy;
  whyThisPhase?: LocalizedCopy;
  phaseOutcome?: LocalizedCopy;
  cards: WorkflowTierCardData[];
};
