"use client";

import { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {
  Locale,
  WorkflowMacroPhase,
  WorkflowNode,
  WorkflowTierCardData,
  WorkflowTierId,
} from "@/types/content";

// ── Accent styles ────────────────────────────────────────────────────────────

const GRAPH_ACCENT = {
  cyan: {
    node: "border-cyan-200/30 bg-cyan-300/15 text-cyan-100",
    lineStart: "#67e8f9",
    lineEnd: "#2563eb",
    pill: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  },
  blue: {
    node: "border-blue-200/30 bg-blue-300/15 text-blue-100",
    lineStart: "#60a5fa",
    lineEnd: "#7c3aed",
    pill: "border-blue-300/20 bg-blue-300/10 text-blue-100",
  },
  amber: {
    node: "border-amber-200/30 bg-amber-300/15 text-amber-50",
    lineStart: "#fbbf24",
    lineEnd: "#f59e0b",
    pill: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  },
} as const;

const TIER_BADGE: Record<string, string> = {
  basic: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
  advanced: "border-blue-300/25 bg-blue-300/10 text-blue-200",
  power: "border-amber-300/25 bg-amber-300/10 text-amber-200",
};

// ── Derive step description from card data (mirrors buildFallbackFlow) ────────

function deriveStepDetail(
  card: WorkflowTierCardData,
  nodeIndex: number,
  totalNodes: number,
  locale: Locale,
): string {
  if (nodeIndex === 0) {
    return `Start here — ${card.useCase[locale]}`;
  }
  if (nodeIndex === totalNodes - 1) {
    const outcome = (card.result ?? card.benefit)[locale];
    return `You finish this step with: ${outcome}`;
  }
  const source = card.sources[0];
  return source
    ? `The workflow leans on ${source.label[locale]} to decide what happens next.`
    : "The workflow decides what to do next at this step.";
}

// ── Workflow graph (larger, centrepiece variant) ──────────────────────────────

function WorkflowGraph({
  nodes,
  edges,
  accent,
  locale,
  animationSeed,
  activeNodeId,
  onSelectNode,
}: {
  nodes: WorkflowNode[];
  edges: WorkflowTierCardData["graph"]["edges"];
  accent: WorkflowTierCardData["accent"];
  locale: Locale;
  animationSeed: number;
  activeNodeId: string;
  onSelectNode: (id: string) => void;
}) {
  const rm = useReducedMotion();
  const gradId = useId().replace(/:/g, "");
  const s = GRAPH_ACCENT[accent];

  return (
    <div className="relative min-h-[14rem] overflow-hidden rounded-[22px] border border-white/10 bg-black/25 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_30%)]" />
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" x2="100%">
            <stop offset="0%" stopColor={s.lineStart} />
            <stop offset="100%" stopColor={s.lineEnd} />
          </linearGradient>
        </defs>
        {edges.map((edge, i) => {
          const from = nodes.find((n) => n.id === edge.from);
          const to = nodes.find((n) => n.id === edge.to);
          if (!from || !to) return null;
          return (
            <motion.line
              key={`${edge.from}-${edge.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={`url(#${gradId})`}
              strokeWidth="0.8"
              strokeDasharray={edge.style === "dashed" ? "2.4 1.8" : undefined}
              strokeLinecap="round"
              initial={rm ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 0.45,
                delay: rm ? 0 : i * 0.08 + animationSeed * 0.03,
              }}
            />
          );
        })}
      </svg>
      {nodes.map((node, i) => {
        const isActive = node.id === activeNodeId;
        return (
          <motion.div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            initial={rm ? false : { opacity: 0, scale: 0.86, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.28,
              delay: rm ? 0 : i * 0.07 + animationSeed * 0.03,
            }}
          >
            <button
              type="button"
              onClick={() => onSelectNode(node.id)}
              className={cn(
                "focus-ring min-w-[4rem] rounded-2xl border px-3 py-2 text-center shadow-[0_14px_40px_rgba(2,8,23,0.35)] backdrop-blur-xl transition",
                s.node,
                isActive &&
                  "scale-110 shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_16px_48px_rgba(2,8,23,0.5)]",
              )}
            >
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-current/60">
                {i + 1}
              </p>
              <p className="mt-1 text-[0.7rem] font-semibold leading-5">{node.label[locale]}</p>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Workflow recommendation card ──────────────────────────────────────────────

function WorkflowRecommendCard({
  card,
  isActive,
  locale,
  onClick,
  recommendLabel,
}: {
  card: WorkflowTierCardData;
  isActive: boolean;
  locale: Locale;
  onClick: () => void;
  recommendLabel: string;
}) {
  const badgeClass = TIER_BADGE[card.id] ?? TIER_BADGE.basic!;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring w-full rounded-[20px] border p-4 text-left transition-all duration-200",
        isActive
          ? "border-white/20 bg-white/[0.07] shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
          : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <span
            className={cn(
              "inline-block rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-[0.18em]",
              badgeClass,
            )}
          >
            {recommendLabel}
          </span>
          <p
            className={cn(
              "font-heading text-sm font-semibold transition-colors",
              isActive ? "text-white" : "text-slate-300",
            )}
          >
            {card.title[locale]}
          </p>
        </div>
        {isActive && (
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
        )}
      </div>
      <p className="mt-2 text-[0.7rem] leading-5 text-slate-500">
        {card.useCase[locale]}
      </p>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Labels = {
  phaseIntroLabel: string;
  selectWorkflow: string;
  workflowGraphLabel: string;
  whatHappens: string;
  stepClickHint: string;
  outcomeLabel: string;
  tierRecommendBasic: string;
  tierRecommendAdvanced: string;
  tierRecommendPower: string;
};

type Props = {
  activePhase: WorkflowMacroPhase;
  primerWhy: string;
  primerOutcome: string;
  locale: Locale;
  animationSeed: number;
  labels: Labels;
};

const RECOMMEND_BY_TIER: Record<keyof Labels & string, keyof Labels> = {
  basic: "tierRecommendBasic",
  advanced: "tierRecommendAdvanced",
  power: "tierRecommendPower",
} as unknown as Record<keyof Labels & string, keyof Labels>;

export function WorkflowInteractive({
  activePhase,
  primerWhy,
  primerOutcome,
  locale,
  animationSeed,
  labels,
}: Props) {
  const rm = useReducedMotion();
  const [activeTierId, setActiveTierId] = useState<WorkflowTierId>("basic");
  const [activeNodeId, setActiveNodeId] = useState("");

  const activeCard =
    activePhase.cards.find((c) => c.id === activeTierId) ?? activePhase.cards[0]!;

  // Reset tier to basic when phase changes
  useEffect(() => {
    setActiveTierId("basic");
  }, [activePhase.id]);

  // Reset to first node when tier or phase changes
  useEffect(() => {
    setActiveNodeId(activeCard?.graph.nodes[0]?.id ?? "");
  }, [activeTierId, activePhase.id]);

  const activeNodeIndex = Math.max(
    activeCard.graph.nodes.findIndex((n) => n.id === activeNodeId),
    0,
  );
  const activeNode = activeCard.graph.nodes[activeNodeIndex] ?? activeCard.graph.nodes[0];
  const stepDetail = activeNode
    ? deriveStepDetail(activeCard, activeNodeIndex, activeCard.graph.nodes.length, locale)
    : "";

  const recommendLabelFor = (tierId: string): string => {
    if (tierId === "basic") return labels.tierRecommendBasic;
    if (tierId === "advanced") return labels.tierRecommendAdvanced;
    return labels.tierRecommendPower;
  };

  return (
    <motion.div
      key={`${activePhase.id}-${animationSeed}`}
      initial={rm ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid gap-5 lg:grid-cols-[1fr,1.55fr] lg:items-start"
    >
      {/* ── Left column: phase intro + workflow selector ─────────────────── */}
      <div className="space-y-4">
        {/* Phase intro */}
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <p className="section-kicker">{labels.phaseIntroLabel}</p>
          <h3 className="mt-3 font-heading text-2xl font-semibold text-white sm:text-[1.65rem]">
            {activePhase.title[locale]}
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-400">{primerWhy}</p>
        </div>

        {/* Workflow recommendation cards */}
        <div className="space-y-2.5">
          <p className="section-kicker px-1">{labels.selectWorkflow}</p>
          {activePhase.cards.map((card) => (
            <WorkflowRecommendCard
              key={card.id}
              card={card}
              isActive={card.id === activeTierId}
              locale={locale}
              onClick={() => setActiveTierId(card.id as WorkflowTierId)}
              recommendLabel={recommendLabelFor(card.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Right column: graph + step detail + outcome ───────────────────── */}
      <div className="space-y-4">
        {/* Graph panel */}
        <div className="rounded-[28px] border border-white/10 bg-black/25 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="section-kicker">{labels.workflowGraphLabel}</p>
            <p className="text-[0.63rem] text-slate-600">{labels.stepClickHint}</p>
          </div>

          <div className="mt-4">
            <WorkflowGraph
              nodes={activeCard.graph.nodes}
              edges={activeCard.graph.edges}
              accent={activeCard.accent}
              locale={locale}
              animationSeed={animationSeed}
              activeNodeId={activeNodeId}
              onSelectNode={setActiveNodeId}
            />
          </div>

          {/* Step detail */}
          {activeNode && (
            <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="section-kicker">{labels.whatHappens}</p>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.18em]",
                    GRAPH_ACCENT[activeCard.accent].pill,
                  )}
                >
                  {activeNodeIndex + 1} / {activeCard.graph.nodes.length}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">
                {activeNode.label[locale]}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">{stepDetail}</p>
            </div>
          )}
        </div>

        {/* Outcome */}
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
          <p className="section-kicker">{labels.outcomeLabel}</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{primerOutcome}</p>
        </div>
      </div>
    </motion.div>
  );
}
