"use client";

import { useLocale } from "@/components/client/locale-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="inline-flex rounded-full border border-white/10 bg-white/5 p-1"
      aria-label={t("nav.language")}
    >
      {[
        { id: "en", label: "EN" },
        { id: "vi", label: "VI" },
      ].map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setLocale(option.id as "en" | "vi")}
          className={cn(
            "focus-ring min-h-11 rounded-full px-3 text-xs font-semibold tracking-[0.24em] text-slate-400 transition",
            locale === option.id && "bg-hero-gradient text-white shadow-violet",
          )}
          aria-pressed={locale === option.id}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
