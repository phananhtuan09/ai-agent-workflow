"use client";

import { useState } from "react";
import { CopyButton } from "@/components/client/copy-button";
import { useLocale } from "@/components/client/locale-provider";
import { tools, type ToolId } from "@/data/tools";
import { cn } from "@/lib/utils";

export function InstallToolSelector() {
  const { t } = useLocale();
  const [selectedToolId, setSelectedToolId] = useState<ToolId>(tools[1]?.id ?? tools[0].id);
  const selectedTool = tools.find((tool) => tool.id === selectedToolId) ?? tools[0];

  return (
    <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
      <div className="glass-panel">
        <p className="section-kicker">{t("install.selectorLabel")}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setSelectedToolId(tool.id)}
              className={cn(
                "group min-h-12 rounded-3xl border border-white/10 px-4 py-4 text-left transition",
                selectedToolId === tool.id
                  ? "border-transparent bg-hero-gradient text-white shadow-violet"
                  : "bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/8"
              )}
            >
              <span className="text-xs font-semibold tracking-[0.24em] text-current/70">
                {tool.shortLabel}
              </span>
              <p className="mt-2 text-base font-semibold">{tool.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel terminal-panel">
        <p className="section-kicker">{t("install.panelTitle")}</p>
        <p className="mt-3 max-w-lg text-sm leading-7 text-slate-400">{t("install.panelBody")}</p>
        <div className="mt-5 rounded-[28px] border border-white/10 bg-black/45 p-4">
          <p className="font-mono text-xs tracking-[0.24em] text-slate-500">$ command</p>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all font-mono text-sm leading-7 text-cyan-200">
            {selectedTool.command}
          </pre>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <CopyButton value={selectedTool.command} />
          <span className="text-sm text-slate-500">{selectedTool.label}</span>
        </div>

        <div className="mt-8">
          <p className="section-kicker">{t("install.targetsTitle")}</p>
          <p className="mt-3 text-sm leading-7 text-slate-400">{t("install.targetsBody")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedTool.installTargets.map((target) => (
              <span key={target} className="pill">
                {target}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
