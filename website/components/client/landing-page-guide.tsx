"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  summary: string;
  bullets: string[];
  whyItMatters: string;
  takeaway: string;
  inspectLabel: string;
  inspectBullets: string[];
  graphTitle: string;
  graphDescription: string;
  graphNodes: GraphNode[];
  graphFocusIndex?: number;
  comparison?: Array<{
    title: string;
    body: string;
  }>;
  examples: ExampleFile[];
};

export function LandingPageGuide({ steps }: { steps: LandingGuideStep[] }) {
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeGraphNodeByStep, setActiveGraphNodeByStep] = useState<
    Record<string, number>
  >(
    Object.fromEntries(
      steps.map((step) => [step.id, step.graphFocusIndex ?? 0]),
    ),
  );
  const [activeFileByStep, setActiveFileByStep] = useState<
    Record<string, string>
  >(
    Object.fromEntries(
      steps.map((step) => [step.id, step.examples[0]?.path ?? ""]),
    ),
  );

  const currentStep = steps[stepIndex];
  const activeNodeIndex = Math.min(
    activeGraphNodeByStep[currentStep.id] ?? currentStep.graphFocusIndex ?? 0,
    currentStep.graphNodes.length - 1,
  );
  const activeNode = currentStep.graphNodes[activeNodeIndex];
  const activeFile =
    currentStep.examples.find(
      (file) => file.path === activeFileByStep[currentStep.id],
    ) ?? currentStep.examples[0];
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    setActiveGraphNodeByStep((value) => ({
      ...value,
      [currentStep.id]:
        value[currentStep.id] ?? currentStep.graphFocusIndex ?? 0,
    }));
  }, [currentStep.id, currentStep.graphFocusIndex]);

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

  function setActiveGraphNode(index: number) {
    setActiveGraphNodeByStep((value) => ({
      ...value,
      [currentStep.id]: index,
    }));
  }

  return (
    <div className="relative pb-8">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-shell items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,480px)] lg:items-center">
          <motion.div
            className="max-w-3xl"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportSection}
          >
            <motion.p className="section-kicker" variants={itemVariants}>
              AI Agent Workflow Guide
            </motion.p>
            <motion.h1
              className="mt-6 max-w-4xl font-heading text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl"
              variants={itemVariants}
            >
              Build your own AI agent workflow,{" "}
              <span className="text-gradient">without the docs-wall feel.</span>
            </motion.h1>
            <motion.p
              className="mt-6 max-w-2xl text-lg leading-8 text-slate-100 sm:text-xl"
              variants={itemVariants}
            >
              Start with one clear entry point, then move through the workflow
              as a guided sequence. Each step explains what changes, why it
              matters, and which real file proves it.
            </motion.p>
            <motion.div
              className="mt-10 flex flex-col gap-4 sm:flex-row"
              variants={itemVariants}
            >
              <motion.button
                type="button"
                onClick={() => openGuideAt(0)}
                className="focus-ring btn-white btn-shimmer inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm"
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
              >
                Get Started
              </motion.button>
              <motion.a
                href="https://github.com/phananhtuan09/ai-agent-workflow"
                target="_blank"
                rel="noreferrer"
                className="focus-ring btn-ghost btn-shimmer inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm"
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
              >
                Review The Example Repo
              </motion.a>
            </motion.div>
            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              variants={staggerChildren}
            >
              {[
                "4 guided steps",
                "Animated workflow view",
                "Real files, not summaries",
              ].map((pill) => (
                <motion.span
                  key={pill}
                  className="pill"
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportItem}
                  whileHover={{ y: -2, scale: 1.03 }}
                >
                  {pill}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="glass-panel relative overflow-hidden border border-white/[0.1]"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportSection}
            whileHover={{ y: -4 }}
          >
            <HeroWorkflowGraph />
          </motion.div>
        </div>
      </section>

      <section
        id="workflow-guide"
        className="mx-auto max-w-shell px-4 pb-20 sm:px-6 lg:px-8"
      >
        <motion.div
          className="glass-panel overflow-hidden"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportSection}
        >
          <div className="flex flex-col gap-6 border-b border-white/10 pb-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  className="max-w-3xl"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.35 }}
                >
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">
                    {currentStep.stepLabel}
                  </p>
                  <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                    {currentStep.title}
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                    {currentStep.summary}
                  </p>
                </motion.div>
              </AnimatePresence>
              <div className="flex flex-wrap gap-2">
                {steps.map((step, index) => (
                  <motion.button
                    key={step.id}
                    type="button"
                    onClick={() => openGuideAt(index)}
                    className={cn(
                      "focus-ring inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition",
                      index === stepIndex
                        ? "border-indigo-300/50 bg-indigo-400/20 text-white"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white",
                    )}
                    aria-label={`Open ${step.stepLabel}`}
                    whileHover={{ y: -2, scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-300 via-sky-300 to-teal-300 transition-all duration-500"
                  animate={{
                    width: `${((stepIndex + 1) / steps.length) * 100}%`,
                  }}
                  transition={{ type: "spring", stiffness: 140, damping: 24 }}
                />
              </div>
              <motion.div
                className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-400"
                whileHover={{ y: -2 }}
              >
                <span>Guided Mode</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={started ? "active" : "preview"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    {started ? "Active walkthrough" : "Preview only"}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,0.82fr)_minmax(360px,1fr)]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div className="space-y-6" variants={staggerChildren}>
                <motion.div
                  className="btn-shimmer border-indigo-300/18 rounded-[28px] border bg-indigo-400/[0.08] p-6"
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.01 }}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-indigo-100/80">
                    What Happens In This Step
                  </p>
                  <p className="mt-3 text-xl font-semibold text-white">
                    {currentStep.takeaway}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {currentStep.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-3 text-sm leading-6 text-slate-200"
                      >
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-teal-300" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div
                  className="grid gap-4 md:grid-cols-2"
                  variants={staggerChildren}
                >
                  <InfoCard
                    label="Why This Matters"
                    body={currentStep.whyItMatters}
                  />
                  <InfoCard
                    label="What To Inspect"
                    body={currentStep.inspectLabel}
                    accent
                  />
                </motion.div>

                {currentStep.comparison ? (
                  <motion.div
                    className="grid gap-4 md:grid-cols-2"
                    variants={staggerChildren}
                  >
                    {currentStep.comparison.map((item) => (
                      <motion.div
                        key={item.title}
                        className="btn-shimmer rounded-[24px] border border-white/10 bg-surface-low/70 p-5"
                        variants={itemVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewportItem}
                        whileHover={{ y: -5, scale: 1.01 }}
                      >
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                          {item.title}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-200">
                          {item.body}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : null}
              </motion.div>

              <motion.div
                className="btn-shimmer rounded-[28px] border border-white/10 bg-surface-low/80 p-6"
                variants={itemVariants}
                whileHover={{ y: -6 }}
              >
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {currentStep.graphTitle}
                      </p>
                      <p className="mt-2 max-w-md text-sm leading-7 text-slate-400">
                        {currentStep.graphDescription}
                      </p>
                    </div>
                    <motion.div
                      className="rounded-full border border-indigo-300/30 bg-indigo-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100"
                      animate={{ opacity: [0.75, 1, 0.75] }}
                      transition={{
                        duration: 2.4,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    >
                      Click nodes to inspect flow
                    </motion.div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {currentStep.graphNodes.map((node, index) => {
                      const isActive = index === activeNodeIndex;
                      const isPassed = index < activeNodeIndex;

                      return (
                        <motion.button
                          key={node.label}
                          type="button"
                          onClick={() => setActiveGraphNode(index)}
                          className={cn(
                            "focus-ring btn-shimmer group flex items-center gap-4 rounded-[22px] border px-4 py-4 text-left transition",
                            isActive
                              ? "bg-indigo-400/14 border-indigo-300/45 shadow-card"
                              : isPassed
                                ? "border-emerald-300/25 bg-emerald-400/10"
                                : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]",
                          )}
                          aria-pressed={isActive}
                          initial="hidden"
                          whileInView="visible"
                          viewport={viewportItem}
                          animate={{
                            scale: isActive ? 1.02 : 1,
                            y: isActive ? -2 : 0,
                          }}
                          whileHover={{ x: 6, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{
                            type: "spring",
                            stiffness: 220,
                            damping: 18,
                          }}
                        >
                          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                            {isActive ? (
                              <motion.span
                                className="absolute inset-0 rounded-full bg-indigo-300/15"
                                layoutId="graph-node-glow"
                                transition={{
                                  type: "spring",
                                  stiffness: 260,
                                  damping: 22,
                                }}
                              />
                            ) : null}
                            <motion.span
                              className={cn(
                                "relative inline-flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition",
                                isActive
                                  ? "border-indigo-200/50 bg-indigo-300/20 text-white"
                                  : isPassed
                                    ? "border-emerald-300/35 bg-emerald-400/15 text-emerald-100"
                                    : "border-white/10 bg-white/5 text-slate-300",
                              )}
                              animate={{
                                scale: isActive ? [1, 1.08, 1] : 1,
                              }}
                              transition={{
                                duration: 1.6,
                                repeat: isActive ? Number.POSITIVE_INFINITY : 0,
                              }}
                            >
                              {String(index + 1).padStart(2, "0")}
                            </motion.span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-semibold text-white">
                                {node.label}
                              </span>
                              <motion.span
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]",
                                  isActive
                                    ? "border-indigo-300/30 bg-indigo-400/10 text-indigo-100"
                                    : isPassed
                                      ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                                      : "border-white/10 bg-white/5 text-slate-400",
                                )}
                                animate={{ opacity: isActive ? 1 : 0.85 }}
                              >
                                {isActive
                                  ? "Active"
                                  : isPassed
                                    ? "Passed"
                                    : "Upcoming"}
                              </motion.span>
                            </span>
                            <span className="mt-2 block text-sm leading-6 text-slate-400">
                              {node.caption}
                            </span>
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentStep.id}-${activeNodeIndex}`}
                    className="btn-shimmer mt-5 rounded-[24px] border border-indigo-300/20 bg-[#0A1020]/80 p-5 transition duration-300"
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -14, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Active Workflow Moment
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <motion.span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-indigo-300/40 bg-indigo-400/15 text-sm font-semibold text-white"
                        animate={{ rotate: [0, -6, 0], scale: [1, 1.06, 1] }}
                        transition={{
                          duration: 1.7,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      >
                        {String(activeNodeIndex + 1).padStart(2, "0")}
                      </motion.span>
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {activeNode.label}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-300">
                          {activeNode.caption}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-300 via-sky-300 to-teal-300 transition-all duration-500"
                        animate={{
                          width: `${((activeNodeIndex + 1) / currentStep.graphNodes.length) * 100}%`,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 150,
                          damping: 24,
                        }}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="btn-shimmer mt-8 rounded-[28px] border border-white/10 bg-surface-low/80 p-6"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportSection}
            whileHover={{ y: -6 }}
          >
            <div className="grid gap-6 border-b border-white/10 pb-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
              <motion.div variants={itemVariants}>
                <p className="text-sm font-semibold text-white">
                  Real Example From This Workflow
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Keep the step explanation lightweight, then inspect the exact
                  file only when you know what signal to look for.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {currentStep.examples.map((example) => (
                    <motion.button
                      key={example.path}
                      type="button"
                      onClick={() =>
                        setActiveFileByStep((value) => ({
                          ...value,
                          [currentStep.id]: example.path,
                        }))
                      }
                      className={cn(
                        "focus-ring btn-shimmer rounded-full border px-4 py-2 text-sm transition",
                        activeFile.path === example.path
                          ? "border-indigo-300/50 bg-indigo-400/20 text-white"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white",
                      )}
                      initial="hidden"
                      whileInView="visible"
                      viewport={viewportItem}
                      whileHover={{ y: -2, scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {example.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="btn-shimmer border-teal-300/18 rounded-[22px] border bg-teal-300/[0.08] p-5"
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <p className="text-xs uppercase tracking-[0.22em] text-teal-100/80">
                  Guided Inspection
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {currentStep.inspectLabel}
                </p>
                <ul className="mt-4 space-y-3">
                  {currentStep.inspectBullets.map((bullet) => (
                    <motion.li
                      key={bullet}
                      className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                      variants={itemVariants}
                      initial="hidden"
                      whileInView="visible"
                      viewport={viewportItem}
                    >
                      <motion.span
                        className="mt-1.5 h-2 w-2 rounded-full bg-teal-300"
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{
                          duration: 1.7,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      />
                      <span>{bullet}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeFile.path}
                className="btn-shimmer mt-5 rounded-[24px] border border-white/10 bg-[#0A0E17]/90"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
                      Source
                    </p>
                    <p className="mt-2 break-all font-mono text-sm text-slate-200">
                      {activeFile.path}
                    </p>
                  </div>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href={activeFile.githubHref}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring btn-ghost btn-shimmer inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm"
                    >
                      Open On GitHub
                    </Link>
                  </motion.div>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                    {activeFile.language}
                  </span>
                  <span className="text-xs text-slate-500">
                    Full file view, scroll to inspect
                  </span>
                </div>
                <motion.pre
                  className="max-h-[28rem] overflow-auto px-4 py-5 font-mono text-[13px] leading-6 text-slate-200"
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <code>{activeFile.content}</code>
                </motion.pre>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"
            variants={itemVariants}
          >
            <motion.button
              type="button"
              onClick={() => setStepIndex((value) => Math.max(value - 1, 0))}
              disabled={stepIndex === 0}
              className="focus-ring btn-ghost btn-shimmer inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm disabled:cursor-not-allowed disabled:opacity-45"
              whileHover={stepIndex === 0 ? undefined : { x: -4, y: -2 }}
              whileTap={stepIndex === 0 ? undefined : { scale: 0.98 }}
            >
              Prev
            </motion.button>
            <motion.button
              type="button"
              onClick={showNextStep}
              className="focus-ring btn-indigo btn-shimmer inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm"
              whileHover={{ x: 4, y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
            >
              {isLastStep ? "Finish" : "Next"}
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      <section
        id="guide-finish"
        className="mx-auto max-w-shell px-4 pb-24 sm:px-6 lg:px-8"
      >
        <motion.div
          className="glass-panel"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportSection}
        >
          <motion.p className="section-kicker" variants={itemVariants}>
            Exit State
          </motion.p>
          <motion.h2
            className="mt-5 max-w-3xl font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl"
            variants={itemVariants}
          >
            You now have a workflow skeleton to copy and adapt.
          </motion.h2>
          <motion.p
            className="mt-4 max-w-2xl text-base leading-7 text-slate-300"
            variants={itemVariants}
          >
            The guide should end like a handoff, not like the bottom of a long
            article. Keep the four ideas visible so the visitor leaves with a
            reusable mental model.
          </motion.p>
          <motion.div
            className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            variants={staggerChildren}
          >
            {[
              "Define your standards before asking the agent to execute.",
              "Create requirements and plans before the code changes start.",
              "Implement in small phases instead of improvising from a giant prompt.",
              "Validate and review before calling the work done.",
            ].map((item, index) => (
              <motion.div
                key={item}
                className="btn-shimmer rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportItem}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <p className="text-sm font-semibold text-slate-400">
                  0{index + 1}
                </p>
                <p className="mt-3 text-base leading-7 text-slate-100">
                  {item}
                </p>
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            className="mt-8 flex flex-col gap-4 sm:flex-row"
            variants={itemVariants}
          >
            <motion.a
              href="https://github.com/phananhtuan09/ai-agent-workflow"
              target="_blank"
              rel="noreferrer"
              className="focus-ring btn-white btn-shimmer inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm"
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
            >
              Review The Example Repo
            </motion.a>
            <motion.button
              type="button"
              onClick={() => openGuideAt(0)}
              className="focus-ring btn-ghost btn-shimmer inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
            >
              Restart The Guide
            </motion.button>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}

function HeroWorkflowGraph() {
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const phases = [
    {
      label: "Requirement",
      detail: "Define the problem",
      skill: "Problem framing",
      agent: "Requirement analyzer",
    },
    {
      label: "Plan",
      detail: "Break into steps",
      skill: "Prompting + system design",
      agent: "Planner agent",
    },
    {
      label: "Implement",
      detail: "Build solution",
      skill: "Code gen + debugging",
      agent: "Coding agent",
    },
    {
      label: "Verify",
      detail: "Review output",
      skill: "Code review + security",
      agent: "Review agent",
    },
    {
      label: "Testing",
      detail: "Ensure quality",
      skill: "Test strategy + edge cases",
      agent: "QA agent",
    },
  ] as const;

  useEffect(() => {
    const sequence = [0, 1, 2, 3, 4, 1];
    let cursor = 0;
    const timer = window.setInterval(() => {
      cursor = (cursor + 1) % sequence.length;
      setActivePhaseIndex(sequence[cursor] ?? 0);
    }, 1400);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
          Structured AI workflow
        </p>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-slate-400">
          Iterative system
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        User prompt enters once. The workflow moves phase by phase, then loops
        back to planning to improve the next iteration.
      </p>

      <div className="relative mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-[#08111f]/90 p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(20,184,166,0.12),_transparent_40%)]" />

        <div className="relative flex flex-col items-center">
          <motion.div
            className="rounded-full border border-sky-300/45 bg-sky-400/15 px-6 py-3 text-center shadow-[0_0_28px_rgba(56,189,248,0.22)]"
            animate={{ y: [0, -2, 0], boxShadow: ["0 0 24px rgba(56,189,248,0.18)", "0 0 34px rgba(56,189,248,0.3)", "0 0 24px rgba(56,189,248,0.18)"] }}
            transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-sky-50">
              User Prompt
            </p>
            <p className="mt-1 text-xs font-semibold text-sky-100/80">
              Start here
            </p>
          </motion.div>

          <div className="mt-3 h-8 w-px bg-gradient-to-b from-sky-200/90 to-sky-300/0" />

          <div className="relative w-full max-w-[26rem] space-y-4">
            <div className="absolute right-[-0.35rem] top-[9.5rem] bottom-[4.2rem] hidden w-24 md:block">
              <svg viewBox="0 0 96 320" className="h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="hero-loop-stroke" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.95" />
                  </linearGradient>
                  <filter id="hero-loop-glow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <marker id="hero-loop-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="4.5" markerHeight="4.5" orient="auto">
                    <path d="M0 0.5 L6 4 L0 7.5" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </marker>
                  <path id="hero-loop-path" d="M16 284 C82 284 82 38 16 38" />
                </defs>
                <path
                  d="M16 284 C82 284 82 38 16 38"
                  stroke="rgba(129,140,248,0.22)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#hero-loop-glow)"
                />
                <path
                  d="M16 284 C82 284 82 38 16 38"
                  stroke="url(#hero-loop-stroke)"
                  strokeWidth="3.5"
                  strokeDasharray="7 8"
                  strokeLinecap="round"
                  fill="none"
                  markerEnd="url(#hero-loop-arrow)"
                  filter="url(#hero-loop-glow)"
                />
                <circle r="4.5" fill="#c4b5fd" filter="url(#hero-loop-glow)">
                  <animateMotion dur="5.8s" repeatCount="indefinite">
                    <mpath href="#hero-loop-path" />
                  </animateMotion>
                </circle>
              </svg>
              <div className="absolute left-7 top-1/2 -translate-y-1/2 rounded-full border border-indigo-200/20 bg-indigo-950/85 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-100 shadow-[0_0_24px_rgba(129,140,248,0.22)]">
                Iterate Back
              </div>
            </div>

            {phases.map((phase, index) => {
              const isActive = index === activePhaseIndex;
              return (
                <div key={phase.label} className="relative">
                  {index > 0 ? (
                    <div className="pointer-events-none absolute -top-4 left-1/2 h-4 w-px -translate-x-1/2 bg-gradient-to-b from-sky-200/80 to-sky-300/0" />
                  ) : null}
                  <motion.button
                    type="button"
                    onMouseEnter={() => setActivePhaseIndex(index)}
                    className="focus-ring relative block w-full rounded-[30px] text-left"
                    animate={{
                      y: isActive ? -3 : 0,
                      scale: isActive ? 1.015 : 1,
                    }}
                    transition={{ duration: 0.32, ease: "easeOut" }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-[30px]"
                      animate={{
                        opacity: isActive ? 1 : 0,
                        boxShadow: isActive
                          ? "0 0 0 1px rgba(186,230,253,0.72), 0 0 34px rgba(59,130,246,0.24)"
                          : "0 0 0 0 rgba(0,0,0,0)",
                      }}
                      transition={{ duration: 0.32, ease: "easeOut" }}
                    />
                    <motion.div
                      className="relative rounded-[30px] border px-5 py-5"
                      animate={{
                        background: isActive
                          ? "linear-gradient(135deg, rgba(30,64,175,0.72), rgba(15,23,42,0.95) 55%, rgba(8,145,178,0.3))"
                          : "rgba(9,18,38,0.94)",
                        borderColor: isActive
                          ? "rgba(186,230,253,0.72)"
                          : "rgba(255,255,255,0.1)",
                      }}
                      transition={{ duration: 0.32, ease: "easeOut" }}
                    >
                      <div className="flex items-start gap-4">
                        <motion.div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold"
                          animate={{
                            backgroundColor: isActive
                              ? "rgba(186,230,253,0.2)"
                              : "rgba(255,255,255,0.04)",
                            borderColor: isActive
                              ? "rgba(186,230,253,0.72)"
                              : "rgba(255,255,255,0.1)",
                            color: isActive ? "#f0f9ff" : "#94a3b8",
                            scale: isActive ? 1.06 : 1,
                          }}
                          transition={{ duration: 0.32, ease: "easeOut" }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-[1.45rem] font-extrabold leading-none text-white sm:text-[1.6rem]">
                              {phase.label}
                            </h3>
                            <motion.span
                              className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                              animate={{
                                backgroundColor: isActive
                                  ? "rgba(125,211,252,0.14)"
                                  : "rgba(255,255,255,0.03)",
                                borderColor: isActive
                                  ? "rgba(125,211,252,0.38)"
                                  : "rgba(255,255,255,0.08)",
                                color: isActive ? "#e0f2fe" : "#94a3b8",
                              }}
                              transition={{ duration: 0.32, ease: "easeOut" }}
                            >
                              Active
                            </motion.span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-sky-100/88 sm:text-[15px]">
                            {phase.detail}
                          </p>
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-2xl border border-emerald-300/18 bg-emerald-400/8 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/72">
                                Skill
                              </p>
                              <p className="mt-1 text-sm font-semibold text-emerald-50/92">
                                {phase.skill}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-indigo-300/18 bg-indigo-400/8 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200/72">
                                Agent
                              </p>
                              <p className="mt-1 text-sm font-semibold text-indigo-50/92">
                                {phase.agent}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.button>
                </div>
              );
            })}

            <div className="rounded-full border border-indigo-300/18 bg-indigo-400/8 px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.22em] text-indigo-100 md:hidden">
              Iterate back to plan
            </div>
          </div>
        </div>
      </div>
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
    <motion.div
      className={cn(
        "btn-shimmer rounded-[24px] border p-5",
        accent
          ? "border-indigo-300/30 bg-indigo-400/10"
          : "border-white/10 bg-surface-low/70",
      )}
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
    </motion.div>
  );
}

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
    },
  },
};

const staggerChildren = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const viewportSection = {
  once: true,
  amount: 0.2,
} as const;

const viewportItem = {
  once: true,
  amount: 0.35,
} as const;
