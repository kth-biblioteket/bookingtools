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

const WEEKDAY_LABELS = ["mån", "tis", "ons", "tor", "fre", "lör", "sön"];

/** Short Swedish weekday label ("mån", "tis", ...) for an ISO date string. */
export function weekdayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const isoDayOfWeek = (d.getDay() + 6) % 7;
  return WEEKDAY_LABELS[isoDayOfWeek];
}

const MONTH_LABELS = [
  "jan", "feb", "mar", "apr", "maj", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

/** "mon D" abbreviated-month/day-of-month label for an ISO date string (e.g. "sep 12"). */
export function dayMonthLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`;
}
