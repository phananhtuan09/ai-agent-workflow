"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/client/locale-provider";
import { skillCategoryOrder, skills } from "@/data/skills";
import { tools, type ToolId } from "@/data/tools";
import { cn } from "@/lib/utils";
import type { LocalizedCopy, SkillCategoryId, SkillSummary } from "@/types/content";

const categoryAccentMap: Record<SkillCategoryId, string> = {
  planning: "from-amber-300/30 via-amber-200/10 to-transparent",
  orchestration: "from-cyan-300/30 via-cyan-200/10 to-transparent",
  requirements: "from-emerald-300/30 via-emerald-200/10 to-transparent",
  frontend: "from-fuchsia-300/30 via-fuchsia-200/10 to-transparent",
  quality: "from-rose-300/30 via-rose-200/10 to-transparent"
};

export function SkillsExplorer() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = useLocale();
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  const selectedTool = searchParams.get("tool");
  const normalizedTool = tools.some((tool) => tool.id === selectedTool)
    ? (selectedTool as ToolId)
    : null;
  const filteredSkills = normalizedTool
    ? skills.filter((skill) => skill.tools.includes(normalizedTool))
    : skills;
  const groupedSkills = skillCategoryOrder
    .map((category) => ({
      category,
      skills: filteredSkills.filter((skill) => skill.category === category)
    }))
    .filter((group) => group.skills.length > 0);

  function selectTool(tool: ToolId | "all") {
    const next = new URLSearchParams(searchParams.toString());

    if (tool === "all") {
      next.delete("tool");
    } else {
      next.set("tool", tool);
    }

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function toggleSkill(skillId: string) {
    setExpandedSkillId((current) => (current === skillId ? null : skillId));
  }

  function categoryLabel(category: SkillCategoryId) {
    return t(`skills.categories.${category}`);
  }

  return (
    <section className="space-y-6">
      <div className="glass-panel">
        <p className="section-kicker">{t("skills.filterLabel")}</p>
        <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-2">
          <button
            type="button"
            onClick={() => selectTool("all")}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition",
              !normalizedTool
                ? "border-transparent bg-hero-gradient text-white shadow-violet"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
            )}
          >
            {t("common.all")}
          </button>
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => selectTool(tool.id)}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition",
                normalizedTool === tool.id
                  ? "border-transparent bg-hero-gradient text-white shadow-violet"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
              )}
              aria-pressed={normalizedTool === tool.id}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <p>{t("skills.showing", { count: filteredSkills.length })}</p>
        <p>{t("skills.groupedBy", { count: groupedSkills.length })}</p>
      </div>

      {filteredSkills.length === 0 ? (
        <div className="glass-panel text-center">
          <h3 className="font-heading text-2xl font-semibold text-white">{t("skills.emptyTitle")}</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">{t("skills.emptyBody")}</p>
          <button
            type="button"
            onClick={() => selectTool("all")}
            className="mt-5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            {t("skills.viewAll")}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSkills.map((group) => (
            <section key={group.category} className="space-y-4">
              <div className="glass-panel relative overflow-hidden">
                <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r", categoryAccentMap[group.category])} />
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="section-kicker">{t("skills.groupLabel")}</p>
                    <h2 className="mt-3 font-heading text-3xl font-semibold text-white">
                      {categoryLabel(group.category)}
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {t("skills.categoryCount", { count: group.skills.length })}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {group.skills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    expanded={expandedSkillId === skill.id}
                    onToggle={() => toggleSkill(skill.id)}
                    locale={locale}
                    t={t}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function readCopy(copy: LocalizedCopy, locale: "en" | "vi") {
  return copy[locale];
}

function SkillCard({
  skill,
  expanded,
  onToggle,
  locale,
  t
}: {
  skill: SkillSummary;
  expanded: boolean;
  onToggle: () => void;
  locale: "en" | "vi";
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={cn(
        "glass-panel h-full w-full text-left transition",
        "hover:-translate-y-1 hover:border-white/20",
        expanded && "border-white/20 bg-white/[0.08]"
      )}
    >
      <div className="flex h-full flex-col">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-[0.24em] text-cyan-200">{skill.id}</p>
              <h3 className="mt-3 font-heading text-2xl font-semibold text-white">{skill.name}</h3>
            </div>
            <span
              className={cn(
                "rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs text-slate-300 transition",
                expanded && "border-cyan-200/40 text-cyan-100"
              )}
            >
              {expanded ? "−" : "+"}
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-400">{readCopy(skill.description, locale)}</p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {skill.tags.map((tag) => (
              <span key={tag} className="pill">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {skill.tools.map((toolId) => {
              const tool = tools.find((entry) => entry.id === toolId);
              return (
                <span key={`${skill.id}-${toolId}`} className="rounded-full border border-white/10 px-3 py-1">
                  {tool?.label ?? toolId}
                </span>
              );
            })}
          </div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            {expanded ? t("skills.collapse") : t("skills.expand")}
          </p>
        </div>

        {expanded ? (
          <div className="mt-6 grid gap-5 border-t border-white/10 pt-6 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">{t("skills.useCases")}</p>
              <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-300">
                {skill.useCases.map((useCase) => (
                  <li key={`${skill.id}-${useCase.en}`}>{readCopy(useCase, locale)}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">{t("skills.triggerKeywords")}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {skill.triggerKeywords.map((keyword) => (
                  <li
                    key={keyword}
                    className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 font-mono text-xs text-cyan-100"
                  >
                    {keyword}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </button>
  );
}
