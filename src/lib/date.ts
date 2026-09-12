// Pure date helpers with no "server-only" import, so both server pages and
// client components (e.g. room-week-vertical.tsx) can use them.

export function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** The Mon–Sun week (as ISO date strings) containing the given date. */
export function getWeekDates(dateStr: string): string[] {
  const d = new Date(`${dateStr}T00:00:00`);
  // getDay(): 0 = Sunday ... 6 = Saturday. Shift so Monday is the start.
  const isoDayOfWeek = (d.getDay() + 6) % 7;
  const monday = addDays(dateStr, -isoDayOfWeek);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Short locale-aware weekday label ("mån"/"Mon", ...) for an ISO date string. */
export function weekdayLabel(dateStr: string, locale: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d);
}

/** Locale-aware abbreviated-month/day-of-month label for an ISO date string (e.g. "sep 12" / "Sep 12"). */
export function dayMonthLabel(dateStr: string, locale: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(d);
}
