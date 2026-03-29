"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LanguageSwitcher } from "@/components/client/language-switcher";
import { useLocale } from "@/components/client/locale-provider";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", key: "nav.home" },
  { href: "/install", key: "nav.install" },
  { href: "/workflow", key: "nav.workflow" },
  { href: "/skills", key: "nav.skills" },
];

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-obsidian-900 text-slate-100">
      <div className="hero-blur hero-blur-one" />
      <div className="hero-blur hero-blur-two" />
      <div className="hero-blur hero-blur-three" />

      <header className="border-white/6 sticky top-0 z-50 border-b bg-obsidian-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-shell items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="focus-ring rounded-full px-2 py-2 font-mono text-sm tracking-[0.32em] text-slate-200"
          >
            &gt; ai-workflow
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navigation.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "focus-ring rounded-full px-4 py-2 text-sm text-slate-400 transition hover:text-white",
                    active && "bg-white/8 text-white",
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            <a
              href="https://github.com/phananhtuan09/ai-agent-workflow"
              target="_blank"
              rel="noreferrer"
              className="focus-ring rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/30 hover:text-white"
            >
              {t("nav.github")}
            </a>
            {pathname !== "/install" && (
              <Link
                href="/install"
                className="focus-ring inline-flex min-h-9 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-slate-200"
              >
                {t("nav.install")}
              </Link>
            )}
          </div>

          <button
            type="button"
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg md:hidden"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "×" : "≡"}
          </button>
        </div>

        {open ? (
          <div className="border-white/6 border-t px-4 py-4 md:hidden">
            <div className="mx-auto flex max-w-shell flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="focus-ring rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  {t(item.key)}
                </Link>
              ))}
              <div className="mt-2 flex items-center justify-between gap-4">
                <LanguageSwitcher />
                <a
                  href="https://github.com/phananhtuan09/ai-agent-workflow"
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring rounded-full border border-white/10 px-4 py-3 text-sm text-slate-200"
                >
                  {t("nav.github")}
                </a>
              </div>
              {pathname !== "/install" && (
                <Link
                  href="/install"
                  onClick={() => setOpen(false)}
                  className="focus-ring mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-black transition hover:bg-slate-200"
                >
                  {t("nav.install")}
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main>{children}</main>

      <footer className="border-white/6 border-t bg-obsidian-950/70">
        <div className="mx-auto grid max-w-shell gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr,1fr] lg:px-8">
          <div>
            <p className="font-mono text-sm tracking-[0.28em] text-slate-200">
              {t("footer.title")}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
              {t("footer.body")}
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
            <Link
              href="/install"
              className="focus-ring rounded-md transition hover:text-white"
            >
              {t("nav.install")}
            </Link>
            <Link
              href="/skills"
              className="focus-ring rounded-md transition hover:text-white"
            >
              {t("nav.skills")}
            </Link>
            <Link
              href="/workflow"
              className="focus-ring rounded-md transition hover:text-white"
            >
              {t("nav.workflow")}
            </Link>
            <span>{t("footer.license")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
