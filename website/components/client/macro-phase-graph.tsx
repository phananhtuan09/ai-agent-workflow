"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Locale, WorkflowMacroPhase, WorkflowMacroPhaseId } from "@/types/content";

const ACCENT = [
  {
    active:
      "border-cyan-400/35 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_60%)] shadow-[0_0_50px_rgba(34,211,238,0.1)]",
    badge: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
    title: "text-cyan-50",
    arrow: "#22d3ee",
  },
  {
    active:
      "border-blue-400/35 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_60%)] shadow-[0_0_50px_rgba(59,130,246,0.1)]",
    badge: "border-blue-400/25 bg-blue-400/10 text-blue-300",
    title: "text-blue-50",
    arrow: "#3b82f6",
  },
  {
    active:
      "border-violet-400/35 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.08),transparent_60%)] shadow-[0_0_50px_rgba(139,92,246,0.1)]",
    badge: "border-violet-400/25 bg-violet-400/10 text-violet-300",
    title: "text-violet-50",
    arrow: "#8b5cf6",
  },
  {
    active:
      "border-amber-400/35 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.08),transparent_60%)] shadow-[0_0_50px_rgba(251,191,36,0.1)]",
    badge: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    title: "text-amber-50",
    arrow: "#f59e0b",
  },
] as const;

type Props = {
  phases: WorkflowMacroPhase[];
  activePhaseId: string;
  locale: Locale;
  onSelect: (id: WorkflowMacroPhaseId) => void;
  animationSeed: number;
  eyebrow: string;
};

export function MacroPhaseGraph({
  phases,
  activePhaseId,
  locale,
  onSelect,
  animationSeed,
  eyebrow,
}: Props) {
  const rm = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/20 p-4 sm:p-6">
      <div className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <p className="section-kicker mb-4">{eyebrow}</p>

      <div className="flex items-stretch">
        {phases.flatMap((phase, i) => {
          const a = ACCENT[Math.min(i, ACCENT.length - 1)]!;
          const isActive = phase.id === activePhaseId;
          const prevIsActive = i > 0 && phases[i - 1]?.id === activePhaseId;

          const node = (
            <motion.button
              key={phase.id}
              type="button"
              onClick={() => onSelect(phase.id as WorkflowMacroPhaseId)}
              initial={rm ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: i * 0.07 + animationSeed * 0.01 }}
              className={cn(
                "focus-ring flex-1 rounded-[22px] border p-3 text-left transition-all duration-300 sm:p-4",
                isActive
                  ? a.active
                  : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-[0.58rem] font-bold tracking-[0.2em] transition-colors duration-300",
                    isActive ? a.badge : "border-white/8 bg-white/[0.04] text-slate-600",
                  )}
                >
                  {phase.shortLabel[locale]}
                </span>
                <span className="hidden text-[0.58rem] text-slate-700 sm:block">
                  {phase.cards.length}×
                </span>
              </div>

              <p
                className={cn(
                  "mt-2.5 font-heading text-xs font-semibold leading-snug transition-colors duration-300 sm:text-sm",
                  isActive ? a.title : "text-slate-400",
                )}
              >
                {phase.title[locale]}
              </p>

              <p className="mt-1.5 hidden text-[0.65rem] leading-[1.5] text-slate-600 sm:line-clamp-2">
                {phase.summary[locale]}
              </p>
            </motion.button>
          );

          if (i < phases.length - 1) {
            const connector = (
              <div
                key={`conn-${i}`}
                className="mx-1 hidden shrink-0 items-center justify-center sm:flex"
              >
                <svg
                  width="18"
                  height="12"
                  viewBox="0 0 18 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0 6 L11 6 M8 2 L14 6 L8 10"
                    stroke={isActive || prevIsActive ? a.arrow : "#1e293b"}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transition: "stroke 0.3s" }}
                  />
                </svg>
              </div>
            );
            return [node, connector];
          }

          return [node];
        })}
      </div>
    </div>
  );
}
