import "server-only";
import type { Locale } from "./config";
import { getLocale } from "./get-locale";
import { bindT, type Dictionary, type T } from "./translate";
import en from "./dictionaries/en";
import sv from "./dictionaries/sv";

const dictionaries: Record<Locale, Dictionary> = { en, sv };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Convenience for Server Components/actions: the current viewer's locale, dictionary, and a bound `t`. */
export async function getT(): Promise<{ locale: Locale; dict: Dictionary; t: T }> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { locale, dict, t: bindT(dict) };
}
