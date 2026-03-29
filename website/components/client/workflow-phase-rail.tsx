"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {
  Locale,
  LocalizedCopy,
  WorkflowMacroPhase,
} from "@/types/content";

type WorkflowPhaseRailProps = {
  phases: WorkflowMacroPhase[];
  activePhaseId: WorkflowMacroPhase["id"];
  animationSeed: number;
  locale: Locale;
  onSelect: (phaseId: WorkflowMacroPhase["id"]) => void;
};

function readCopy(copy: LocalizedCopy, locale: Locale) {
  return copy[locale];
}

export function WorkflowPhaseRail({
  phases,
  activePhaseId,
  animationSeed,
  locale,
  onSelect,
}: WorkflowPhaseRailProps) {
  const reducedMotion = useReducedMotion();
  const activeIndex = phases.findIndex((phase) => phase.id === activePhaseId);

  return (
    <div className="overflow-x-auto pb-3">
      <div className="min-w-[52rem]">
        <div className="flex items-center gap-4">
          {phases.map((phase, index) => {
            const isActive = phase.id === activePhaseId;
            const isCompleteSegment = index <= activeIndex;

            return (
              <Fragment key={phase.id}>
                <motion.button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onSelect(phase.id)}
                  initial={
                    reducedMotion ? false : { opacity: 0, y: 18, scale: 0.94 }
                  }
                  animate={{ opacity: 1, y: 0, scale: isActive ? 1.02 : 1 }}
                  transition={{
                    duration: 0.36,
                    delay: reducedMotion
                      ? 0
                      : index * 0.08 + animationSeed * 0.02,
                  }}
                  className={cn(
                    "focus-ring group relative min-h-[7.25rem] min-w-[11rem] overflow-hidden rounded-[30px] border px-5 py-4 text-left backdrop-blur-xl transition",
                    isActive
                      ? "border-cyan-300/30 bg-[linear-gradient(145deg,rgba(8,145,178,0.2),rgba(37,99,235,0.18),rgba(124,58,237,0.16))] text-white shadow-[0_0_0_1px_rgba(103,232,249,0.2),0_30px_80px_rgba(6,182,212,0.14)]"
                      : "border-white/10 bg-white/[0.04] text-slate-100 hover:border-white/20 hover:bg-white/[0.07]",
                  )}
                >
                  <span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  <span
                    className={cn(
                      "absolute right-4 top-4 h-3 w-3 rounded-full transition",
                      isActive
                        ? "bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.75)]"
                        : "bg-white/15",
                    )}
                  />
                  <p className="text-current/60 font-mono text-[0.65rem] uppercase tracking-[0.32em]">
                    {readCopy(phase.shortLabel, locale)}
                  </p>
                  <p className="mt-4 max-w-[9rem] font-heading text-[1.35rem] font-semibold leading-tight text-current">
                    {readCopy(phase.title, locale)}
                  </p>
                  <p className="text-current/70 mt-3 text-xs leading-6">
                    {readCopy(phase.summary, locale)}
                  </p>
                </motion.button>

                {index < phases.length - 1 ? (
                  <div className="relative flex h-[7.25rem] flex-1 items-center">
                    <div className="relative h-px w-full overflow-hidden rounded-full bg-white/10">
                      <motion.span
                        key={`${animationSeed}-${phase.id}`}
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.65),rgba(59,130,246,0.85),rgba(251,191,36,0.85))]",
                          isCompleteSegment ? "opacity-100" : "opacity-45",
                        )}
                        initial={
                          reducedMotion
                            ? false
                            : { scaleX: 0, transformOrigin: "left" }
                        }
                        animate={{ scaleX: 1 }}
                        transition={{
                          duration: 0.45,
                          delay: reducedMotion
                            ? 0
                            : index * 0.12 + animationSeed * 0.03,
                        }}
                      />
                    </div>
                    <motion.span
                      key={`${animationSeed}-${phase.id}-pulse`}
                      className={cn(
                        "absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full",
                        isCompleteSegment
                          ? "bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.8)]"
                          : "bg-white/25",
                      )}
                      animate={
                        reducedMotion
                          ? undefined
                          : {
                              x: ["0%", "96%"],
                              opacity: [0.4, 1, 0.4],
                            }
                      }
                      transition={{
                        duration: 1.3,
                        ease: "easeInOut",
                        repeat: reducedMotion ? 0 : Number.POSITIVE_INFINITY,
                        repeatDelay: 0.5,
                        delay: index * 0.1,
                      }}
                    />
                  </div>
                ) : null}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
