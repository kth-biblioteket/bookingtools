"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import { locales, localeLabels, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/components/i18n-provider";

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label={t("nav.language")}
      value={locale}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as Locale;
        startTransition(() => {
          setLocale(next);
        });
      }}
      className="rounded-md border border-transparent bg-kth-blue px-1.5 py-1 text-sm text-kth-light-blue hover:border-kth-light-blue focus:outline-none focus:ring-1 focus:ring-kth-light-blue disabled:opacity-60"
    >
      {locales.map((l) => (
        <option key={l} value={l} className="text-gray-900">
          {localeLabels[l]}
        </option>
      ))}
    </select>
  );
}
