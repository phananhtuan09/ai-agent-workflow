"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultLocale, localeOptions, messages } from "@/lib/i18n/messages";
import type { Locale } from "@/types/content";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function resolvePath(target: unknown, key: string) {
  return key.split(".").reduce<unknown>((value, segment) => {
    if (value && typeof value === "object" && segment in value) {
      return (value as Record<string, unknown>)[segment];
    }

    return undefined;
  }, target);
}

function interpolate(text: string, params?: Record<string, string | number>) {
  if (!params) {
    return text;
  }

  return Object.entries(params).reduce((output, [key, value]) => {
    return output.split(`{${key}}`).join(String(value));
  }, text);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("ai-workflow-locale");
      if (stored && localeOptions.includes(stored as Locale)) {
        setLocaleState(stored as Locale);
      }
    } catch {
      setLocaleState(defaultLocale);
    }
  }, []);

  const value: LocaleContextValue = {
    locale,
    setLocale(nextLocale) {
      setLocaleState(nextLocale);

      try {
        window.localStorage.setItem("ai-workflow-locale", nextLocale);
      } catch {
        // Ignore storage errors and keep in-memory state.
      }
    },
    t(key, params) {
      const resolved = resolvePath(messages[locale], key);
      return typeof resolved === "string" ? interpolate(resolved, params) : key;
    }
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
