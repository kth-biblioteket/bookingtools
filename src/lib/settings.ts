import "server-only";
import { db } from "@/lib/db";
import { isoWeekday } from "@/lib/date";

const SETTINGS_ID = "singleton";

export type ScheduleLayout = "horizontal" | "vertical";

export type AppSettings = {
  stepMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  scheduleLayout: ScheduleLayout;
  requirePreliminaryConfirmation: boolean;
  confirmMinutesBefore: number;
  confirmMinutesAfter: number;
};

export type BookingSettings = Pick<
  AppSettings,
  | "stepMinutes"
  | "minMinutes"
  | "maxMinutes"
  | "requirePreliminaryConfirmation"
  | "confirmMinutesBefore"
  | "confirmMinutesAfter"
>;

/** One weekday's opening hours (0 = Monday ... 6 = Sunday, see isoWeekday in src/lib/date.ts). */
export type OpeningHoursDay = {
  weekday: number;
  startHour: number;
  endHour: number;
  closed: boolean;
};

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

function toScheduleLayout(value: string): ScheduleLayout {
  return value === "vertical" ? "vertical" : "horizontal";
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
  return {
    stepMinutes: settings.stepMinutes,
    minMinutes: settings.minMinutes,
    maxMinutes: settings.maxMinutes,
    scheduleLayout: toScheduleLayout(settings.scheduleLayout),
    requirePreliminaryConfirmation: settings.requirePreliminaryConfirmation,
    confirmMinutesBefore: settings.confirmMinutesBefore,
    confirmMinutesAfter: settings.confirmMinutesAfter,
  };
}

export async function updateSettings(data: AppSettings) {
  await db.settings.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: { id: SETTINGS_ID, ...data },
  });
}

/** Booking-rule-only subset, for callers that don't care about display settings. */
export async function getBookingSettings(): Promise<BookingSettings> {
  const {
    stepMinutes,
    minMinutes,
    maxMinutes,
    requirePreliminaryConfirmation,
    confirmMinutesBefore,
    confirmMinutesAfter,
  } = await getSettings();
  return {
    stepMinutes,
    minMinutes,
    maxMinutes,
    requirePreliminaryConfirmation,
    confirmMinutesBefore,
    confirmMinutesAfter,
  };
}

export async function updateBookingSettings(data: BookingSettings) {
  const current = await getSettings();
  await updateSettings({ ...current, ...data });
}

/** Display-only subset, for callers that only need the schedule overview layout. */
export async function getScheduleLayout(): Promise<ScheduleLayout> {
  const { scheduleLayout } = await getSettings();
  return scheduleLayout;
}

/** All 7 weekdays' opening hours, ordered Monday (0) through Sunday (6). Rows
 * are seeded by a migration, but upsert any missing ones defensively so a
 * partially-seeded table can't break callers. */
export async function getOpeningHours(): Promise<OpeningHoursDay[]> {
  const existing = await db.openingHours.findMany({ orderBy: { weekday: "asc" } });
  const byWeekday = new Map(existing.map((row) => [row.weekday, row]));
  const missing = WEEKDAYS.filter((weekday) => !byWeekday.has(weekday));

  if (missing.length > 0) {
    await db.openingHours.createMany({
      data: missing.map((weekday) => ({ weekday })),
      skipDuplicates: true,
    });
    return getOpeningHours();
  }

  return WEEKDAYS.map((weekday) => {
    const row = byWeekday.get(weekday)!;
    return { weekday, startHour: row.startHour, endHour: row.endHour, closed: row.closed };
  });
}

/** The opening hours that apply to a specific date's weekday. */
export async function getOpeningHoursForDate(dateStr: string): Promise<OpeningHoursDay> {
  const days = await getOpeningHours();
  return days[isoWeekday(dateStr)];
}

export async function updateOpeningHours(days: OpeningHoursDay[]) {
  await db.$transaction(
    days.map((day) =>
      db.openingHours.upsert({
        where: { weekday: day.weekday },
        update: { startHour: day.startHour, endHour: day.endHour, closed: day.closed },
        create: day,
      })
    )
  );
}
