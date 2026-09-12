"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import { locales, localeLabels, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/components/i18n-provider";

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9s-1.25 6.5-3.75 9c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3Z" />
    </svg>
  );
}

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();

  // Only two locales for now, so the switcher is a single pill that flips
  // straight to the other one rather than a row of options to pick from.
  const other = locales.find((l) => l !== locale) ?? locale;

  return (
    <button
      type="button"
      disabled={pending}
      title={localeLabels[other]}
      aria-label={t("nav.language")}
      onClick={(e) => {
        // Inside the mobile nav dropdown (MobileNav), any click closes the
        // menu — desired for the links, but this button's own click
        // shouldn't also close the menu before the switch takes effect.
        e.stopPropagation();
        startTransition(() => {
          setLocale(other);
        });
      }}
      className="flex items-center gap-1.5 self-start text-sm text-kth-light-blue transition-colors hover:text-white disabled:cursor-default disabled:opacity-60"
    >
      <GlobeIcon />
      {localeLabels[other]}
    </button>
  );
}
