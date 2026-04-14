"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ExampleFile = {
  path: string;
  label: string;
  content: string;
  language: string;
  githubHref: string;
};

type GraphNode = {
  label: string;
  caption: string;
};

export type LandingGuideStep = {
  id: string;
  stepLabel: string;
  title: string;
  body: string;
  whyItMatters: string;
  takeaway: string;
  graphTitle: string;
  graphDescription: string;
  graphNodes: GraphNode[];
  comparison?: Array<{
    title: string;
    body: string;
  }>;
  examples: ExampleFile[];
};

export function LandingPageGuide({ steps }: { steps: LandingGuideStep[] }) {
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeFileByStep, setActiveFileByStep] = useState<
    Record<string, string>
  >(
    Object.fromEntries(
      steps.map((step) => [step.id, step.examples[0]?.path ?? ""]),
    ),
  );

  const currentStep = steps[stepIndex];
  const activeFile =
    currentStep.examples.find(
      (file) => file.path === activeFileByStep[currentStep.id],
    ) ?? currentStep.examples[0];
  const isLastStep = stepIndex === steps.length - 1;

  const progressLabel = useMemo(
    () =>
      `${String(stepIndex + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`,
    [stepIndex, steps.length],
  );

  function openGuideAt(index: number) {
    setStarted(true);
    setStepIndex(index);
    document
      .getElementById("workflow-guide")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showNextStep() {
    if (isLastStep) {
      document
        .getElementById("guide-finish")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setStepIndex((value) => value + 1);
  }

  return (
    <div className="relative">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-shell items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,460px)] lg:items-center">
          <div className="max-w-3xl">
            <p className="section-kicker">AI Agent Workflow Guide</p>
            <h1 className="mt-6 max-w-4xl font-heading text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Build your own AI agent workflow,{" "}
              <span className="text-gradient">step by step.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100 sm:text-xl">
              This interactive guide walks through a real workflow from this
              repository so you can see how planning, execution, and review fit
              together. Learn the system first, then adapt it into your own
              process.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => openGuideAt(0)}
                className="focus-ring btn-white inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm"
              >
                Get Started
              </button>
              <a
                href="https://github.com/phananhtuan09/ai-agent-workflow"
                target="_blank"
                rel="noreferrer"
                className="focus-ring btn-ghost inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm"
              >
                Review The Example Repo
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Interactive walkthrough. Real Claude Code setup. Real workflow
              examples.
            </p>
          </div>

          <div className="glass-panel relative overflow-hidden border border-white/[0.1]">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-500">
              <span>Guide Preview</span>
              <span>{progressLabel}</span>
            </div>
            <div className="mt-8 space-y-4">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => openGuideAt(index)}
                  className={cn(
                    "focus-ring flex w-full items-start gap-4 rounded-[20px] border px-4 py-4 text-left transition",
                    index === stepIndex && started
                      ? "border-indigo-400/40 bg-indigo-500/10 shadow-card"
                      : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                      index === stepIndex && started
                        ? "border-indigo-300/50 bg-indigo-400/20 text-white"
                        : "border-white/10 bg-white/5 text-slate-300",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      {step.title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-400">
                      {step.takeaway}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="workflow-guide"
        className="mx-auto max-w-shell px-4 pb-20 sm:px-6 lg:px-8"
      >
        <div className="glass-panel">
          <div className="flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">
                {currentStep.stepLabel}
              </p>
              <h2 className="mt-4 max-w-3xl font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                {currentStep.title}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => openGuideAt(index)}
                  className={cn(
                    "focus-ring inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition",
                    index === stepIndex
                      ? "border-indigo-300/50 bg-indigo-400/20 text-white"
                      : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.9fr)]">
            <div className="space-y-6">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-base leading-8 text-slate-100">
                  {currentStep.body}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  label="Why This Matters"
                  body={currentStep.whyItMatters}
                />
                <InfoCard
                  label="Key Takeaway"
                  body={currentStep.takeaway}
                  accent
                />
              </div>

              {currentStep.comparison ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {currentStep.comparison.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[24px] border border-white/10 bg-surface-low/70 p-5"
                    >
                      <p className="text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-surface-low/80 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {currentStep.graphTitle}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-7 text-slate-400">
                    {currentStep.graphDescription}
                  </p>
                </div>
                <div className="hidden rounded-full border border-indigo-300/30 bg-indigo-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100 sm:block">
                  Active Step
                </div>
              </div>
              <div className="mt-8 space-y-4">
                {currentStep.graphNodes.map((node, index) => (
                  <div key={node.label} className="relative pl-8">
                    {index < currentStep.graphNodes.length - 1 ? (
                      <div className="absolute left-[15px] top-11 h-[calc(100%+0.5rem)] w-px bg-gradient-to-b from-indigo-400/60 to-white/10" />
                    ) : null}
                    <div className="absolute left-0 top-5 h-8 w-8 rounded-full border border-indigo-300/40 bg-indigo-400/20" />
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Node {String(index + 1).padStart(2, "0")}
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {node.label}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                          {index === 0
                            ? "Entry"
                            : index === currentStep.graphNodes.length - 1
                              ? "Outcome"
                              : "Flow"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {node.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-surface-low/80 p-6">
            <div className="flex flex-col gap-5 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Real Example From This Workflow
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  The viewer below loads the exact file content from this
                  repository for the current step.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentStep.examples.map((example) => (
                  <button
                    key={example.path}
                    type="button"
                    onClick={() =>
                      setActiveFileByStep((value) => ({
                        ...value,
                        [currentStep.id]: example.path,
                      }))
                    }
                    className={cn(
                      "focus-ring rounded-full border px-4 py-2 text-sm transition",
                      activeFile.path === example.path
                        ? "border-indigo-300/50 bg-indigo-400/20 text-white"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white",
                    )}
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-[#0A0E17]/90">
              <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
                    Source
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-slate-200">
                    {activeFile.path}
                  </p>
                </div>
                <Link
                  href={activeFile.githubHref}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring btn-ghost inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm"
                >
                  Open On GitHub
                </Link>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                  {activeFile.language}
                </span>
                <span className="text-xs text-slate-500">Full file view</span>
              </div>
              <pre className="max-h-[32rem] overflow-auto px-4 py-5 font-mono text-[13px] leading-6 text-slate-200">
                <code>{activeFile.content}</code>
              </pre>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStepIndex((value) => Math.max(value - 1, 0))}
              disabled={stepIndex === 0}
              className="focus-ring btn-ghost inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm disabled:cursor-not-allowed disabled:opacity-45"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={showNextStep}
              className="focus-ring btn-indigo inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm"
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </section>

      <section
        id="guide-finish"
        className="mx-auto max-w-shell px-4 pb-24 sm:px-6 lg:px-8"
      >
        <div className="glass-panel">
          <p className="section-kicker">Exit State</p>
          <h2 className="mt-5 max-w-3xl font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            You now have a workflow skeleton to copy and adapt.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Define your standards before asking the agent to execute.",
              "Create requirements and plans before the code changes start.",
              "Implement in small phases instead of improvising from a giant prompt.",
              "Validate and review before calling the work done.",
            ].map((item, index) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-sm font-semibold text-slate-400">
                  0{index + 1}
                </p>
                <p className="mt-3 text-base leading-7 text-slate-100">
                  {item}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="https://github.com/phananhtuan09/ai-agent-workflow"
              target="_blank"
              rel="noreferrer"
              className="focus-ring btn-white inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm"
            >
              Review The Example Repo
            </a>
            <button
              type="button"
              onClick={() => openGuideAt(0)}
              className="focus-ring btn-ghost inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm"
            >
              Restart The Guide
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  label,
  body,
  accent = false,
}: {
  label: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border p-5",
        accent
          ? "border-indigo-300/30 bg-indigo-400/10"
          : "border-white/10 bg-surface-low/70",
      )}
    >
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
    </div>
  );
}
