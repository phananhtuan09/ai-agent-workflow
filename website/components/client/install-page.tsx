"use client";

import { InstallToolSelector } from "@/components/client/install-tool-selector";
import { useLocale } from "@/components/client/locale-provider";

export function InstallPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-3xl">
        <p className="section-kicker">/install</p>
        <h1 className="mt-4 font-heading text-4xl font-semibold text-white sm:text-5xl">
          {t("install.title")}
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-400">{t("install.description")}</p>
      </div>

      <div className="mt-10">
        <InstallToolSelector />
      </div>
    </div>
  );
}
