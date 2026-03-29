"use client";

import { startTransition, useState } from "react";
import { useLocale } from "@/components/client/locale-provider";
import { MacroPhaseGraph } from "@/components/client/macro-phase-graph";
import { WorkflowInteractive } from "@/components/client/workflow-interactive";
import { workflowPhases } from "@/data/workflows";
import type { WorkflowMacroPhaseId } from "@/types/content";

// ── Phase primers ─────────────────────────────────────────────────────────────

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

// ── Journey accent classes ─────────────────────────────────────────────────────

const JOURNEY_ACCENTS = [
  "text-cyan-300 border-cyan-300/20 bg-cyan-300/10",
  "text-blue-300 border-blue-300/20 bg-blue-300/10",
  "text-blue-300 border-blue-300/20 bg-blue-300/10",
  "text-amber-300 border-amber-300/20 bg-amber-300/10",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export function WorkflowPage() {
  const { locale, t } = useLocale();
  const [activePhaseId, setActivePhaseId] = useState<string>(
    workflowPhases[0]?.id ?? "",
  );
  const [animationSeed, setAnimationSeed] = useState(0);

  const activePhase =
    workflowPhases.find((p) => p.id === activePhaseId) ?? workflowPhases[0]!;
  const primer = getPhasePrimer(activePhase.id, locale);

  function handlePhaseSelect(id: WorkflowMacroPhaseId) {
    startTransition(() => {
      setActivePhaseId(id);
      setAnimationSeed((s) => s + 1);
    });
  }

  const journeySteps = [
    {
      phase: t("workflow.journeyStep1Phase"),
      title: t("workflow.journeyStep1Title"),
      body: t("workflow.journeyStep1Body"),
    },
    {
      phase: t("workflow.journeyStep2Phase"),
      title: t("workflow.journeyStep2Title"),
      body: t("workflow.journeyStep2Body"),
    },
    {
      phase: t("workflow.journeyStep3Phase"),
      title: t("workflow.journeyStep3Title"),
      body: t("workflow.journeyStep3Body"),
    },
    {
      phase: t("workflow.journeyStep4Phase"),
      title: t("workflow.journeyStep4Title"),
      body: t("workflow.journeyStep4Body"),
    },
  ];

  return (
    <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_36px_140px_rgba(2,8,23,0.42)] sm:p-8 lg:p-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="absolute -left-12 top-6 h-56 w-56 rounded-full bg-accent-violet/15 blur-3xl" />
        <div className="bg-accent-blue/14 absolute right-0 top-20 h-60 w-60 rounded-full blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-44 w-44 rounded-full bg-accent-cyan/10 blur-3xl" />

        <div className="relative max-w-2xl">
          <p className="section-kicker">/workflow</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
            <span className="text-gradient">{t("workflow.title")}</span>
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
            {t("workflow.description")}
          </p>
        </div>
      </section>

      {/* ── Journey strip ─────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-[32px] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
        <p className="section-kicker">{t("workflow.journeyLabel")}</p>
        <h2 className="mt-3 font-heading text-2xl font-semibold text-white sm:text-3xl">
          {t("workflow.journeyTitle")}
        </h2>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((step, index) => (
            <div key={step.phase} className="relative">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.68rem] font-semibold tracking-[0.2em] ${JOURNEY_ACCENTS[index]}`}
                  >
                    0{index + 1}
                  </span>
                  <p
                    className={`text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${JOURNEY_ACCENTS[index]!.split(" ")[0]}`}
                  >
                    {step.phase}
                  </p>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-white">
                  {step.title}
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-400">{step.body}</p>
              </div>

              {index < journeySteps.length - 1 && (
                <div className="hidden lg:absolute lg:-right-1.5 lg:top-1/2 lg:z-10 lg:flex lg:-translate-y-1/2 lg:items-center">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-black/40 text-[0.6rem] text-slate-500">
                    →
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Macro graph ───────────────────────────────────────────────────── */}
      <div className="mt-6">
        <MacroPhaseGraph
          phases={workflowPhases}
          activePhaseId={activePhaseId}
          locale={locale}
          onSelect={handlePhaseSelect}
          animationSeed={animationSeed}
          eyebrow={t("workflow.macroGraphLabel")}
        />
      </div>

      {/* ── Interactive phase detail ───────────────────────────────────────── */}
      <div className="mt-5">
        <WorkflowInteractive
          activePhase={activePhase}
          primerWhy={primer.why}
          primerOutcome={primer.outcome}
          locale={locale}
          animationSeed={animationSeed}
          labels={{
            phaseIntroLabel: t("workflow.contextLabel"),
            selectWorkflow: t("workflow.selectWorkflow"),
            workflowGraphLabel: t("workflow.workflowGraphLabel"),
            whatHappens: t("workflow.whatHappens"),
            stepClickHint: t("workflow.stepClickHint"),
            outcomeLabel: t("workflow.primerOutcome"),
            tierRecommendBasic: t("workflow.tierRecommendBasic"),
            tierRecommendAdvanced: t("workflow.tierRecommendAdvanced"),
            tierRecommendPower: t("workflow.tierRecommendPower"),
          }}
        />
      </div>

      {/* ── Replay ────────────────────────────────────────────────────────── */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          className="focus-ring rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          onClick={() =>
            startTransition(() => setAnimationSeed((s) => s + 1))
          }
        >
          {t("workflow.replay")}
        </button>
      </div>
    </div>
  );
}
