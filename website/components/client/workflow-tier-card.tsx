"use client";

import { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getToolById } from "@/data/tools";
import { cn } from "@/lib/utils";
import type {
  Locale,
  LocalizedCopy,
  WorkflowNode,
  WorkflowTierCardData,
} from "@/types/content";

type WorkflowTierCardProps = {
  workflow: WorkflowTierCardData;
  animationSeed: number;
  locale: Locale;
  labels: {
    example: string;
    result: string;
    flow: string;
    stepDetail: string;
    stepHint: string;
    useCase: string;
    benefit: string;
    sources: string;
    supports: string;
  };
};

function readCopy(copy: LocalizedCopy, locale: Locale) {
  return copy[locale];
}

function buildFallbackFlow(workflow: WorkflowTierCardData, locale: Locale) {
  const primarySource = workflow.sources[0];

  return workflow.graph.nodes.map((node, index, nodes) => {
    if (index === 0) {
      return {
        id: `${workflow.id}-start`,
        title: node.label,
        detail:
          locale === "vi"
            ? {
                en: "",
                vi: `Đây là điểm user bắt đầu. ${readCopy(
                  workflow.useCase,
                  locale,
                )}`,
              }
            : {
                en: `This is where the user starts. ${readCopy(
                  workflow.useCase,
                  locale,
                )}`,
                vi: "",
              },
      };
    }

    if (index === nodes.length - 1) {
      return {
        id: `${workflow.id}-finish`,
        title: node.label,
        detail:
          locale === "vi"
            ? {
                en: "",
                vi: `Bạn kết thúc bước này với ${readCopy(
                  workflow.result ?? workflow.benefit,
                  locale,
                )}`,
              }
            : {
                en: `You finish this stage with ${readCopy(
                  workflow.result ?? workflow.benefit,
                  locale,
                )}`,
                vi: "",
              },
      };
    }

    return {
      id: `${workflow.id}-middle-${index}`,
      title: node.label,
      detail:
        locale === "vi"
          ? {
              en: "",
              vi: primarySource
                ? `Đây là bước workflow dựa vào ${readCopy(
                    primarySource.label,
                    locale,
                  )} để quyết định hướng đi tiếp theo.`
                : "Đây là bước workflow quyết định hướng đi tiếp theo.",
            }
          : {
              en: primarySource
                ? `This is the step where the workflow leans on ${readCopy(
                    primarySource.label,
                    locale,
                  )} to decide what happens next.`
                : "This is the step where the workflow decides what happens next.",
              vi: "",
            },
    };
  });
}

const accentStyles: Record<
  WorkflowTierCardData["accent"],
  {
    shell: string;
    halo: string;
    node: string;
    lineStart: string;
    lineEnd: string;
    pill: string;
  }
> = {
  cyan: {
    shell:
      "border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]",
    halo: "shadow-[0_30px_90px_rgba(8,145,178,0.16)]",
    node: "border-cyan-200/30 bg-cyan-300/15 text-cyan-100",
    lineStart: "#67e8f9",
    lineEnd: "#2563eb",
    pill: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  },
  blue: {
    shell:
      "border-blue-300/20 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]",
    halo: "shadow-[0_30px_90px_rgba(37,99,235,0.18)]",
    node: "border-blue-200/30 bg-blue-300/15 text-blue-100",
    lineStart: "#60a5fa",
    lineEnd: "#7c3aed",
    pill: "border-blue-300/20 bg-blue-300/10 text-blue-100",
  },
  amber: {
    shell:
      "border-amber-300/20 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]",
    halo: "shadow-[0_30px_90px_rgba(251,191,36,0.18)]",
    node: "border-amber-200/30 bg-amber-300/15 text-amber-50",
    lineStart: "#fbbf24",
    lineEnd: "#f59e0b",
    pill: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  },
};

function MiniWorkflowGraph({
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
  onSelectNode: (nodeId: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const gradientId = useId().replace(/:/g, "");
  const styles = accentStyles[accent];

  return (
    <div className="relative min-h-[11rem] overflow-hidden rounded-[28px] border border-white/10 bg-black/25 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)]" />
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="100%">
            <stop offset="0%" stopColor={styles.lineStart} />
            <stop offset="100%" stopColor={styles.lineEnd} />
          </linearGradient>
        </defs>

        {edges.map((edge, index) => {
          const from = nodes.find((node) => node.id === edge.from);
          const to = nodes.find((node) => node.id === edge.to);

          if (!from || !to) {
            return null;
          }

          return (
            <motion.line
              key={`${edge.from}-${edge.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={`url(#${gradientId})`}
              strokeWidth="0.8"
              strokeDasharray={edge.style === "dashed" ? "2.4 1.8" : undefined}
              strokeLinecap="round"
              initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 0.45,
                delay: reducedMotion ? 0 : index * 0.08 + animationSeed * 0.03,
              }}
            />
          );
        })}
      </svg>

      {nodes.map((node, index) => {
        const isActive = node.id === activeNodeId;

        return (
          <motion.div
            key={node.id}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.86, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.28,
              delay: reducedMotion ? 0 : index * 0.07 + animationSeed * 0.03,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <button
              type="button"
              onClick={() => onSelectNode(node.id)}
              className={cn(
                "focus-ring min-w-[4.25rem] rounded-2xl border px-3 py-2 text-center shadow-[0_14px_40px_rgba(2,8,23,0.35)] backdrop-blur-xl transition",
                styles.node,
                isActive &&
                  "scale-110 shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_16px_48px_rgba(2,8,23,0.5)]",
                node.emphasis === "primary" && "scale-105",
              )}
            >
              <p className="text-current/70 text-[0.65rem] font-semibold uppercase tracking-[0.22em]">
                {index + 1}
              </p>
              <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-current">
                {readCopy(node.label, locale)}
              </p>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

export function WorkflowTierCard({
  workflow,
  animationSeed,
  locale,
  labels,
}: WorkflowTierCardProps) {
  const reducedMotion = useReducedMotion();
  const styles = accentStyles[workflow.accent];
  const flowSteps = workflow.flowSteps ?? buildFallbackFlow(workflow, locale);
  const [activeNodeId, setActiveNodeId] = useState(
    workflow.graph.nodes[0]?.id ?? "",
  );

  useEffect(() => {
    setActiveNodeId(workflow.graph.nodes[0]?.id ?? "");
  }, [workflow.graph.nodes, workflow.id]);

  const activeNodeIndex = Math.max(
    workflow.graph.nodes.findIndex((node) => node.id === activeNodeId),
    0,
  );
  const activeNode =
    workflow.graph.nodes[activeNodeIndex] ?? workflow.graph.nodes[0];
  const activeStep = flowSteps[activeNodeIndex] ?? flowSteps[0];

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-[34px] border p-5 backdrop-blur-xl sm:p-6",
        styles.shell,
        styles.halo,
      )}
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em]",
                  styles.pill,
                )}
              >
                {readCopy(workflow.title, locale)}
              </span>
              {workflow.tools.map((toolId) => {
                const tool = getToolById(toolId);
                return (
                  <span
                    key={`${workflow.id}-${toolId}`}
                    className="bg-white/6 rounded-full border border-white/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.2em] text-slate-300"
                  >
                    {tool.shortLabel}
                  </span>
                );
              })}
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-200">
              {readCopy(workflow.summary, locale)}
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-400">
            {labels.supports}
          </div>
        </div>

        <div className="mt-6">
          <MiniWorkflowGraph
            nodes={workflow.graph.nodes}
            edges={workflow.graph.edges}
            accent={workflow.accent}
            locale={locale}
            animationSeed={animationSeed}
            activeNodeId={activeNodeId}
            onSelectNode={setActiveNodeId}
          />
        </div>

        {activeNode && activeStep ? (
          <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="section-kicker">{labels.stepDetail}</p>
                <p className="mt-3 text-sm font-semibold text-white">
                  {readCopy(activeNode.label, locale)}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em]",
                  styles.pill,
                )}
              >
                {activeNodeIndex + 1}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {readCopy(activeStep.detail, locale)}
            </p>
            <p className="mt-3 text-xs leading-6 text-slate-500">
              {labels.stepHint}
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <p className="section-kicker">{labels.example}</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {readCopy(workflow.realExample ?? workflow.useCase, locale)}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <p className="section-kicker">{labels.result}</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {readCopy(workflow.result ?? workflow.benefit, locale)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr,1fr]">
          <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <p className="section-kicker">{labels.useCase}</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {readCopy(workflow.useCase, locale)}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <p className="section-kicker">{labels.benefit}</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {readCopy(workflow.benefit, locale)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-white/10 bg-black/25 p-4">
          <p className="section-kicker">{labels.flow}</p>
          <div className="mt-4 grid gap-3">
            {flowSteps.map((step, index) => (
              <div
                key={step.id}
                className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      styles.pill,
                    )}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {readCopy(step.title, locale)}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      {readCopy(step.detail, locale)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-white/10 bg-black/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="section-kicker">{labels.sources}</p>
            <div className="flex flex-wrap gap-2">
              {workflow.tools.map((toolId) => {
                const tool = getToolById(toolId);
                return (
                  <span key={`${workflow.id}-tool-${toolId}`} className="pill">
                    {tool.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {workflow.sources.map((sourceItem) => (
              <div
                key={sourceItem.id}
                className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-white/6 rounded-full border border-white/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-slate-300">
                        {sourceItem.kind}
                      </span>
                      <p className="text-sm font-semibold text-white">
                        {readCopy(sourceItem.label, locale)}
                      </p>
                    </div>
                    <p className="font-mono text-[0.72rem] leading-6 text-cyan-200">
                      {sourceItem.path}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sourceItem.tools.map((toolId) => {
                      const tool = getToolById(toolId);
                      return (
                        <span
                          key={`${sourceItem.id}-${toolId}`}
                          className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-slate-400"
                        >
                          {tool.shortLabel}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {readCopy(sourceItem.note, locale)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
