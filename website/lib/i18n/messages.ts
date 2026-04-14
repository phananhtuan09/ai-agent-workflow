import en from "@/lib/i18n/en.json";
import vi from "@/lib/i18n/vi.json";
import type { Locale } from "@/types/content";

export const messages = {
  en,
  vi,
} as const;

export const defaultLocale: Locale = "en";
export const localeOptions: Locale[] = ["en", "vi"];
