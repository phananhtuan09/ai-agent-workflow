"use client";

import { startTransition, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale } from "@/components/client/locale-provider";
import { WorkflowPhaseRail } from "@/components/client/workflow-phase-rail";
import { WorkflowTierCard } from "@/components/client/workflow-tier-card";
import { workflowPhases } from "@/data/workflows";
import { getToolById } from "@/data/tools";
import { cn } from "@/lib/utils";
import type { LocalizedCopy, WorkflowMacroPhaseId, WorkflowSourceRef } from "@/types/content";

function readCopy(copy: LocalizedCopy, locale: "en" | "vi") {
  return copy[locale];
}

function getPhasePrimer(phaseId: string, locale: "en" | "vi") {
  const primers = {
    requirement: {
      en: {
        why: "This phase exists so a rough vibe-coded idea does not jump straight into code before anyone agrees on what should be built.",
        outcome:
          "You leave this phase with a clearer brief: a shaped prompt, a requirement draft, or a routed orchestrator path.",
      },
      vi: {
        why: "Phase này tồn tại để một ý tưởng kiểu vibe coding không nhảy thẳng vào code trước khi mọi người thống nhất cần xây gì.",
        outcome:
          "Kết thúc phase này, bạn có brief rõ hơn: prompt đã được nắn lại, requirement draft, hoặc một đường orchestrator rõ ràng.",
      },
    },
    planning: {
      en: {
        why: "This phase exists to turn the idea into a path that can be reviewed before code starts.",
        outcome:
          "You leave this phase with a plan, a list of slices, or a gated packet instead of a vague promise to implement later.",
      },
      vi: {
        why: "Phase này tồn tại để biến ý tưởng thành một đường đi có thể review trước khi code bắt đầu.",
        outcome:
          "Kết thúc phase này, bạn có plan, danh sách slice hoặc packet có gate thay vì một lời hứa mơ hồ rằng sẽ làm sau.",
      },
    },
    implement: {
      en: {
        why: "This phase exists to do the real work while keeping scope, file targets, and validation responsibilities visible.",
        outcome:
          "You leave this phase with an actual patch and an updated plan state instead of a hidden burst of chat-generated code.",
      },
      vi: {
        why: "Phase này tồn tại để làm việc thật nhưng vẫn giữ scope, file target và trách nhiệm validation ở trạng thái nhìn thấy được.",
        outcome:
          "Kết thúc phase này, bạn có patch thật và trạng thái plan được cập nhật thay vì một đợt code ẩn trong chat.",
      },
    },
    "review-testing": {
      en: {
        why: "This phase exists so delivery does not stop at 'the code seems done'. It forces a quality pass before the workflow closes.",
        outcome:
          "You leave this phase with review feedback, test evidence, and a safer decision about whether the work is ready to ship.",
      },
      vi: {
        why: "Phase này tồn tại để delivery không dừng ở mức 'có vẻ code xong rồi'. Nó buộc phải có một vòng quality trước khi workflow khép lại.",
        outcome:
          "Kết thúc phase này, bạn có review feedback, bằng chứng test và quyết định an toàn hơn xem công việc đã sẵn sàng ship hay chưa.",
      },
    },
  } as const;

  return primers[phaseId as keyof typeof primers][locale];
}

export function WorkflowPreview() {
  const { locale, t } = useLocale();
  const [activePhaseId, setActivePhaseId] = useState(
    workflowPhases[0]?.id ?? "",
  );
  const [animationSeed, setAnimationSeed] = useState(0);
  const [showAllTiers, setShowAllTiers] = useState(false);
  const reducedMotion = useReducedMotion();

  const activePhase =
    workflowPhases.find((phase) => phase.id === activePhaseId) ??
    workflowPhases[0];

  function handlePhaseSelect(phaseId: WorkflowMacroPhaseId) {
    startTransition(() => {
      setActivePhaseId(phaseId);
      setShowAllTiers(false);
    });
  }

  const uniqueSources = useMemo(() => {
    if (!activePhase) {
      return [] as WorkflowSourceRef[];
    }

    const sourceMap = new Map<string, WorkflowSourceRef>();

    activePhase.cards.forEach((card) => {
      card.sources.forEach((source) => {
        sourceMap.set(source.id, source);
      });
    });

    return Array.from(sourceMap.values());
  }, [activePhase]);

  if (!activePhase) {
    return null;
  }

  const primer = getPhasePrimer(activePhase.id, locale);

  return (
    <section className="space-y-7">
      <div className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          <p className="section-kicker">{t("workflow.whyFourPhasesLabel")}</p>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            {t("workflow.whyFourPhasesBody")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
            <p className="section-kicker">{t("workflow.primerWhy")}</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {primer.why}
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
            <p className="section-kicker">{t("workflow.primerOutcome")}</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {primer.outcome}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-3xl">
          <p className="section-kicker">{t("workflow.phaseLabel")}</p>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            {t("workflow.hint")}
          </p>
        </div>
        <button
          type="button"
          className="focus-ring rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          onClick={() => {
            startTransition(() => {
              setAnimationSeed((value) => value + 1);
            });
          }}
        >
          {t("workflow.replay")}
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="relative">
          <div className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-accent-blue/10 blur-3xl" />
          <div className="absolute right-0 top-20 h-48 w-48 rounded-full bg-accent-cyan/10 blur-3xl" />

          <div className="relative">
            <WorkflowPhaseRail
              phases={workflowPhases}
              activePhaseId={activePhase.id}
              animationSeed={animationSeed}
              locale={locale}
              onSelect={handlePhaseSelect}
            />

            <motion.div
              key={`${activePhase.id}-${animationSeed}`}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 rounded-[30px] border border-white/10 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              <div className="grid gap-5 lg:grid-cols-[1.15fr,0.85fr] lg:items-start">
                <div>
                  <p className="section-kicker">{t("workflow.contextLabel")}</p>
                  <h3 className="mt-4 font-heading text-3xl font-semibold text-white sm:text-[2rem]">
                    {readCopy(activePhase.title, locale)}
                  </h3>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                    {readCopy(activePhase.caption, locale)}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {activePhase.cards.map((card) => (
                    <div
                      key={`${activePhase.id}-${card.id}-metric`}
                      className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {readCopy(card.title, locale)}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {readCopy(card.summary, locale)}
                      </p>
                      <p className="mt-3 text-xs leading-6 text-slate-500">
                        {readCopy(card.result ?? card.benefit, locale)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-kicker">{t("workflow.sectionLabel")}</p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
              {t("workflow.sectionBody")}
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-400">
            {t("workflow.repoBadge")}
          </span>
        </div>

        {/* Basic card always visible */}
        {activePhase.cards
          .filter((card) => card.id === "basic")
          .map((workflow, index) => (
            <div key={`${activePhase.id}-${workflow.id}`}>
              <WorkflowTierCard
                workflow={workflow}
                animationSeed={animationSeed + index}
                locale={locale}
                labels={{
                  example: t("workflow.fieldExample"),
                  result: t("workflow.fieldResult"),
                  flow: t("workflow.fieldFlow"),
                  stepDetail: t("workflow.fieldStepDetail"),
                  stepHint: t("workflow.fieldStepHint"),
                  useCase: t("workflow.fieldUseCase"),
                  benefit: t("workflow.fieldBenefit"),
                  sources: t("workflow.fieldSources"),
                  supports: t("workflow.fieldSupports"),
                }}
              />
            </div>
          ))}

        {/* Tier expand / collapse toggle */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <button
            type="button"
            className="focus-ring flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
            onClick={() => setShowAllTiers((prev) => !prev)}
          >
            <span
              className={cn(
                "inline-block transition-transform duration-200",
                showAllTiers ? "rotate-90" : "rotate-0",
              )}
            >
              ›
            </span>
            {showAllTiers ? t("workflow.tierShowBasic") : t("workflow.tierShowAll")}
          </button>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {!showAllTiers && (
          <p className="text-center text-xs text-slate-500">
            {t("workflow.tierBasicHint")}
          </p>
        )}

        {/* Advanced + Power cards shown when expanded */}
        {showAllTiers && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="grid gap-5 lg:grid-cols-2"
          >
            {activePhase.cards
              .filter((card) => card.id !== "basic")
              .map((workflow, index) => (
                <div
                  key={`${activePhase.id}-${workflow.id}`}
                  className={cn(workflow.id === "power" && "lg:col-span-2")}
                >
                  <WorkflowTierCard
                    workflow={workflow}
                    animationSeed={animationSeed + index + 1}
                    locale={locale}
                    labels={{
                      example: t("workflow.fieldExample"),
                      result: t("workflow.fieldResult"),
                      flow: t("workflow.fieldFlow"),
                      stepDetail: t("workflow.fieldStepDetail"),
                      stepHint: t("workflow.fieldStepHint"),
                      useCase: t("workflow.fieldUseCase"),
                      benefit: t("workflow.fieldBenefit"),
                      sources: t("workflow.fieldSources"),
                      supports: t("workflow.fieldSupports"),
                    }}
                  />
                </div>
              ))}
          </motion.div>
        )}
      </div>

      <div className="glass-panel overflow-hidden bg-white/[0.035]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-kicker">{t("workflow.repoSourcesLabel")}</p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
              {t("workflow.repoSourcesBody")}
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-400">
            {readCopy(activePhase.title, locale)}
          </span>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {uniqueSources.map((source) => (
            <div
              key={`strip-${source.id}`}
              className="rounded-[24px] border border-white/10 bg-black/20 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {readCopy(source.label, locale)}
                  </p>
                  <p className="mt-2 font-mono text-[0.72rem] leading-6 text-cyan-200">
                    {source.path}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {source.tools.map((toolId) => {
                    const tool = getToolById(toolId);
                    return (
                      <span key={`${source.id}-${toolId}`} className="pill">
                        {tool.shortLabel}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
