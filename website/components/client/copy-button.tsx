"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/client/locale-provider";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "failed";

export function CopyButton({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const { t } = useLocale();
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => setState("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [state]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  const label =
    state === "copied"
      ? t("common.copied")
      : state === "failed"
        ? t("common.copyFailed")
        : t("common.copy");

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "focus-ring border-white/12 inline-flex min-h-11 items-center justify-center rounded-full border bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-200",
          className,
        )}
      >
        {state === "copied" ? "✓" : "⎘"}&nbsp;
        {state === "failed" ? t("common.copy") : label}
      </button>
      <span className="sr-only" aria-live="polite">
        {label}
      </span>
    </>
  );
}
