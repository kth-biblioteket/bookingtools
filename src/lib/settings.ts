import "server-only";
import { db } from "@/lib/db";
import { isoWeekday } from "@/lib/date";

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

/** Every function here is scoped to one Schedule — a new Schedule gets
 * working defaults purely by being read from for the first time, via the
 * same self-seeding/upsert-on-read pattern this module always used for the
 * (formerly singleton) Settings/OpeningHours rows. */
export async function getSettings(scheduleId: string): Promise<AppSettings> {
  const settings = await db.settings.upsert({
    where: { scheduleId },
    update: {},
    create: { scheduleId },
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

export async function updateSettings(scheduleId: string, data: AppSettings) {
  await db.settings.upsert({
    where: { scheduleId },
    update: data,
    create: { scheduleId, ...data },
  });
}

/** Booking-rule-only subset, for callers that don't care about display settings. */
export async function getBookingSettings(scheduleId: string): Promise<BookingSettings> {
  const {
    stepMinutes,
    minMinutes,
    maxMinutes,
    requirePreliminaryConfirmation,
    confirmMinutesBefore,
    confirmMinutesAfter,
  } = await getSettings(scheduleId);
  return {
    stepMinutes,
    minMinutes,
    maxMinutes,
    requirePreliminaryConfirmation,
    confirmMinutesBefore,
    confirmMinutesAfter,
  };
}

export async function updateBookingSettings(scheduleId: string, data: BookingSettings) {
  const current = await getSettings(scheduleId);
  await updateSettings(scheduleId, { ...current, ...data });
}

/** Display-only subset, for callers that only need the schedule overview layout. */
export async function getScheduleLayout(scheduleId: string): Promise<ScheduleLayout> {
  const { scheduleLayout } = await getSettings(scheduleId);
  return scheduleLayout;
}

/** All 7 weekdays' opening hours for one schedule, ordered Monday (0)
 * through Sunday (6). Rows are seeded lazily here (rather than by a
 * migration, now that there can be more than one schedule), but upsert any
 * missing ones defensively so a partially-seeded table can't break callers. */
export async function getOpeningHours(scheduleId: string): Promise<OpeningHoursDay[]> {
  const existing = await db.openingHours.findMany({
    where: { scheduleId },
    orderBy: { weekday: "asc" },
  });
  const byWeekday = new Map(existing.map((row) => [row.weekday, row]));
  const missing = WEEKDAYS.filter((weekday) => !byWeekday.has(weekday));

  if (missing.length > 0) {
    await db.openingHours.createMany({
      data: missing.map((weekday) => ({ scheduleId, weekday })),
      skipDuplicates: true,
    });
    return getOpeningHours(scheduleId);
  }

  return WEEKDAYS.map((weekday) => {
    const row = byWeekday.get(weekday)!;
    return { weekday, startHour: row.startHour, endHour: row.endHour, closed: row.closed };
  });
}

/** The opening hours that apply to a specific date's weekday, for one schedule. */
export async function getOpeningHoursForDate(scheduleId: string, dateStr: string): Promise<OpeningHoursDay> {
  const days = await getOpeningHours(scheduleId);
  return days[isoWeekday(dateStr)];
}

export async function updateOpeningHours(scheduleId: string, days: OpeningHoursDay[]) {
  await db.$transaction(
    days.map((day) =>
      db.openingHours.upsert({
        where: { scheduleId_weekday: { scheduleId, weekday: day.weekday } },
        update: { startHour: day.startHour, endHour: day.endHour, closed: day.closed },
        create: { scheduleId, ...day },
      })
    )
  );
}
