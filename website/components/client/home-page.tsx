"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { AnimatedCounter } from "@/components/client/animated-counter";
import { AnimatedWorkflowNodes } from "@/components/client/animated-workflow-nodes";
import { CopyButton } from "@/components/client/copy-button";
import { useLocale } from "@/components/client/locale-provider";
import { ScrollReveal } from "@/components/client/scroll-reveal";
import { skills } from "@/data/skills";
import { tools, type ToolId } from "@/data/tools";
import { workflowGraphCount } from "@/data/workflows";

export function HomePage() {
  const { t } = useLocale();
  const [activeToolId, setActiveToolId] = useState<ToolId>(
    tools[1]?.id ?? tools[0].id,
  );
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const activeTool = tools.find((tool) => tool.id === activeToolId) ?? tools[0];
  const previewTargets = activeTool.installTargets.slice(0, 4);
  const hiddenTargetCount = Math.max(
    activeTool.installTargets.length - previewTargets.length,
    0,
  );

  const metrics = [
    { label: t("home.metricTools"), value: tools.length },
    { label: t("home.metricSkills"), value: skills.length },
    { label: t("home.metricGraphs"), value: workflowGraphCount },
  ];

  const workflowSteps = [
    { id: "01", label: t("home.proofStepOne") },
    { id: "02", label: t("home.proofStepTwo") },
    { id: "03", label: t("home.proofStepThree") },
    { id: "04", label: t("home.proofStepFour") },
  ];

  const highlights = [
    {
      title: t("home.highlightOneTitle"),
      body: t("home.highlightOneBody"),
    },
    {
      title: t("home.highlightTwoTitle"),
      body: t("home.highlightTwoBody"),
    },
    {
      title: t("home.highlightThreeTitle"),
      body: t("home.highlightThreeBody"),
    },
  ];

  const routeCards = [
    {
      href: "/install",
      title: t("nav.install"),
      body: t("home.routeInstallBody"),
    },
    {
      href: "/workflow",
      title: t("nav.workflow"),
      body: t("home.routeWorkflowBody"),
    },
    {
      href: "/skills",
      title: t("nav.skills"),
      body: t("home.routeSkillsBody"),
    },
  ];

  const whatYouGetItems = [
    t("home.whatYouGetItem1"),
    t("home.whatYouGetItem2"),
    t("home.whatYouGetItem3"),
    t("home.whatYouGetItem4"),
    t("home.whatYouGetItem5"),
  ];

  const personas = [
    {
      title: t("home.forPersonaOneTitle"),
      body: t("home.forPersonaOneBody"),
    },
    {
      title: t("home.forPersonaTwoTitle"),
      body: t("home.forPersonaTwoBody"),
    },
    {
      title: t("home.forPersonaThreeTitle"),
      body: t("home.forPersonaThreeBody"),
    },
  ];

  const faqItems = [
    { q: t("home.faqOne"), a: t("home.faqOneAnswer") },
    { q: t("home.faqTwo"), a: t("home.faqTwoAnswer") },
    { q: t("home.faqThree"), a: t("home.faqThreeAnswer") },
    { q: t("home.faqFour"), a: t("home.faqFourAnswer") },
    { q: t("home.faqFive"), a: t("home.faqFiveAnswer") },
    { q: t("home.faqSix"), a: t("home.faqSixAnswer") },
  ];

  const activeTabClass =
    "focus-ring rounded-full border border-cyan-300/30 bg-cyan-300/12 px-4 py-2 text-sm font-semibold text-cyan-100 transition";
  const inactiveTabClass =
    "focus-ring rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition hover:border-white/20 hover:bg-white/8 hover:text-slate-200";

  return (
    <div className="mx-auto flex max-w-shell flex-col gap-16 px-4 py-10 sm:px-6 lg:gap-20 lg:px-8 lg:py-16">
      <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_32px_120px_rgba(15,23,42,0.45)] sm:p-8 lg:p-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="absolute -left-24 top-12 h-56 w-56 rounded-full bg-accent-violet/15 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-accent-blue/15 blur-3xl" />

        <div className="relative grid gap-10 xl:grid-cols-[1.02fr,0.98fr] xl:items-center">
          <ScrollReveal className="space-y-8" direction="left">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <p className="section-kicker">{t("home.eyebrow")}</p>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                  {t("home.badge")}
                </span>
              </div>

              <h1 className="max-w-4xl font-heading text-5xl font-semibold leading-[0.92] text-white sm:text-6xl lg:text-7xl">
                <span className="text-gradient">{t("home.title")}</span>
              </h1>

              <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                {t("home.description")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/install"
                className="focus-ring btn-shimmer inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-slate-200"
              >
                {t("home.primaryCta")}
              </Link>
              <Link
                href="/workflow"
                className="focus-ring btn-glow border-white/12 inline-flex min-h-12 items-center justify-center rounded-full border bg-white/5 px-6 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/10"
              >
                {t("home.secondaryCta")}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {t("home.supportLabel")}
              </span>
              {tools.map((tool) => (
                <span key={tool.id} className="pill">
                  {tool.label}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1} className="xl:pl-4" direction="right">
            <AnimatedWorkflowNodes />
          </ScrollReveal>
        </div>
      </section>

      <ScrollReveal direction="up">
        <section className="overflow-hidden rounded-[36px] border border-white/10 bg-black/20 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.26)] sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[0.82fr,1.18fr] xl:items-end">
            <div>
              <p className="section-kicker">{t("home.proofBarEyebrow")}</p>
              <h2 className="mt-4 max-w-xl font-heading text-3xl font-semibold text-white sm:text-4xl">
                {t("home.proofLabel")}
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    role="group"
                    aria-label={`${metric.label}: ${metric.value}`}
                    className="card-hover-glow rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    <p className="font-heading text-3xl font-semibold text-white">
                      <AnimatedCounter value={metric.value} />
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {workflowSteps.map((step) => (
                <div
                  key={step.id}
                  className="card-hover-glow rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200/80">
                    {step.id}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-200">
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <section className="grid gap-6 xl:grid-cols-[0.84fr,1.16fr] xl:items-start">
        <ScrollReveal className="max-w-xl" direction="left">
          <p className="section-kicker">{t("home.installSectionEyebrow")}</p>
          <h2 className="mt-4 font-heading text-3xl font-semibold text-white sm:text-4xl">
            {t("home.installSectionTitle")}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-400">
            {t("home.installSectionBody")}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1} direction="right">
          <div className="glass-panel terminal-panel relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,232,249,0.1),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.12),transparent_34%)]" />
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />

            <div className="relative">
              <p className="section-kicker">{t("home.terminalTitle")}</p>
              <h3 className="mt-4 max-w-lg font-heading text-3xl font-semibold leading-tight text-white sm:text-[2rem]">
                {t("home.terminalHeadline")}
              </h3>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
                {t("home.terminalBody")}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveToolId(tool.id)}
                    aria-pressed={tool.id === activeTool.id}
                    className={
                      tool.id === activeTool.id
                        ? activeTabClass
                        : inactiveTabClass
                    }
                  >
                    {tool.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-[30px] border border-white/10 bg-black/50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-xs tracking-[0.24em] text-slate-500">
                    $ install
                  </p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                    {activeTool.shortLabel}
                  </span>
                </div>

                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all font-mono text-sm leading-7 text-cyan-200">
                  {activeTool.command}
                </pre>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <CopyButton value={activeTool.command} />
                <Link
                  href="/install"
                  className="focus-ring border-white/12 inline-flex min-h-11 items-center justify-center rounded-full border bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/10"
                >
                  {t("home.terminalCta")}
                </Link>
              </div>

              <div className="mt-8">
                <p className="section-kicker">
                  {t("home.terminalTargetsTitle")}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {t("home.terminalTargetsBody")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {previewTargets.map((target) => (
                    <span key={target} className="pill">
                      {target}
                    </span>
                  ))}
                  {hiddenTargetCount > 0 ? (
                    <span className="pill">+{hiddenTargetCount} more</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section className="space-y-6">
        <ScrollReveal className="max-w-xl">
          <p className="section-kicker">{t("home.whatYouGetEyebrow")}</p>
          <h2 className="mt-4 font-heading text-3xl font-semibold text-white sm:text-4xl">
            {t("home.whatYouGetTitle")}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-400">
            {t("home.whatYouGetBody")}
          </p>
        </ScrollReveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {whatYouGetItems.map((item, index) => (
            <ScrollReveal key={item} delay={index * 0.08}>
              <div className="card-hover-glow flex items-start gap-3 rounded-[20px] border border-white/10 bg-white/[0.04] p-5">
                <span
                  className="mt-0.5 shrink-0 font-bold text-cyan-400"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <p className="text-sm leading-7 text-slate-300">{item}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr,1.15fr] lg:items-start">
        <ScrollReveal className="max-w-xl" direction="left">
          <p className="section-kicker">{t("home.highlightsEyebrow")}</p>
          <h2 className="mt-4 font-heading text-3xl font-semibold text-white sm:text-4xl">
            {t("home.highlightsTitle")}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-400">
            {t("home.highlightsBody")}
          </p>
        </ScrollReveal>

        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((highlight, index) => (
            <ScrollReveal
              key={highlight.title}
              delay={index * 0.1}
              className="h-full"
            >
              <article className="glass-panel card-hover-glow group relative flex h-full min-h-[22rem] flex-col overflow-hidden bg-white/[0.04]">
                <div className="absolute inset-y-6 left-0 w-px bg-transparent transition group-hover:bg-cyan-300/40" />
                <div className="min-h-[9.5rem] border-b border-white/8 pb-6">
                  <span className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500 transition group-hover:text-slate-200">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-6 font-heading text-2xl font-semibold text-white">
                    {highlight.title}
                  </h3>
                </div>
                <p className="mt-6 text-sm leading-7 text-slate-400">
                  {highlight.body}
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <ScrollReveal className="max-w-xl">
          <p className="section-kicker">{t("home.forEyebrow")}</p>
          <h2 className="mt-4 font-heading text-3xl font-semibold text-white sm:text-4xl">
            {t("home.forTitle")}
          </h2>
        </ScrollReveal>
        <div className="grid gap-4 md:grid-cols-3">
          {personas.map((persona, index) => (
            <ScrollReveal key={persona.title} delay={index * 0.1}>
              <article className="glass-panel card-hover-glow bg-white/[0.04]">
                <h3 className="font-heading text-2xl font-semibold text-white">
                  {persona.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-400">
                  {persona.body}
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <ScrollReveal className="max-w-xl">
          <p className="section-kicker">{t("home.faqEyebrow")}</p>
          <h2 className="mt-4 font-heading text-3xl font-semibold text-white sm:text-4xl">
            {t("home.faqTitle")}
          </h2>
        </ScrollReveal>
        <div className="divide-y divide-white/10 overflow-hidden rounded-[28px] border border-white/10">
          {faqItems.map((item, index) => (
            <ScrollReveal key={item.q} delay={index * 0.05}>
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                  aria-expanded={openFaq === index}
                  className="focus-ring flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.03]"
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-cyan-400 transition-transform${openFaq === index ? " rotate-45" : ""}`}
                  >
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === index && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5">
                        <p className="text-sm leading-7 text-slate-400">{item.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <ScrollReveal className="max-w-2xl">
          <p className="section-kicker">{t("home.routesEyebrow")}</p>
          <h2 className="mt-4 font-heading text-3xl font-semibold text-white sm:text-4xl">
            {t("home.routesTitle")}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-400">
            {t("home.routesBody")}
          </p>
        </ScrollReveal>

        <div className="grid gap-4 xl:grid-cols-3">
          {routeCards.map((card, index) => (
            <ScrollReveal key={card.href} delay={index * 0.12}>
              <Link
                href={card.href}
                className="focus-ring glass-panel card-hover-glow group relative flex h-full min-h-[240px] flex-col justify-between overflow-hidden bg-white/[0.04]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 via-transparent to-cyan-400/5 opacity-0 transition group-hover:opacity-100" />
                <div className="relative">
                  <p className="font-mono text-xs tracking-[0.22em] text-cyan-200">
                    {card.href}
                  </p>
                  <h3 className="mt-4 font-heading text-3xl font-semibold text-white">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-400">
                    {card.body}
                  </p>
                </div>
                <div className="relative mt-8 flex items-center justify-between gap-3 text-sm text-slate-300">
                  <span>{t("home.routeLinkLabel")}</span>
                  <span
                    aria-hidden="true"
                    className="transition group-hover:translate-x-2"
                  >
                    →
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <ScrollReveal>
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.03] p-8 text-center sm:p-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <p className="section-kicker justify-center">
            {t("home.finalCtaEyebrow")}
          </p>
          <h2 className="mt-4 font-heading text-3xl font-semibold text-white sm:text-4xl">
            {t("home.finalCtaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-slate-400">
            {t("home.finalCtaBody")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/install"
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black transition hover:bg-slate-200"
            >
              {t("home.finalCtaPrimary")}
            </Link>
            <a
              href="https://github.com/phananhtuan09/ai-agent-workflow"
              target="_blank"
              rel="noreferrer"
              className="focus-ring border-white/12 inline-flex min-h-12 items-center justify-center rounded-full border bg-white/5 px-8 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/10"
            >
              {t("home.finalCtaSecondary")}
            </a>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
