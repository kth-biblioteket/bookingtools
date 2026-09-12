"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n/config";
import { bindT, type Dictionary, type T } from "@/lib/i18n/translate";

const I18nContext = createContext<{ locale: Locale; t: T } | undefined>(undefined);

/**
 * Makes the current locale's dictionary available to every Client Component
 * in the tree via useI18n(), seeded from the root layout (a Server
 * Component) so it always starts in sync with what the server rendered.
 */
export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, t: bindT(dict) }), [locale, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
