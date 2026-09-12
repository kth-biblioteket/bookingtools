// No "server-only" import — read by both server code (cookie lookup) and
// client components (the language switcher), unlike the rest of lib/i18n.

export const locales = ["sv", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sv";

/** Human-readable name for each locale, shown in the language switcher. */
export const localeLabels: Record<Locale, string> = {
  sv: "Svenska",
  en: "English",
};

export const LOCALE_COOKIE = "locale";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
