"use client";

import Link from "next/link";
import { useLocale } from "@/components/client/locale-provider";

export function NotFoundPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-shell items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="glass-panel max-w-xl">
        <p className="font-mono text-xs tracking-[0.24em] text-slate-300">
          404
        </p>
        <h1 className="mt-4 font-heading text-4xl font-semibold text-white">
          {t("notFound.title")}
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-400">
          {t("notFound.description")}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-slate-200"
        >
          {t("notFound.cta")}
        </Link>
      </div>
    </div>
  );
}
