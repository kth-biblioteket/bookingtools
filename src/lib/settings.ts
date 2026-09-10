import "server-only";
import { db } from "@/lib/db";

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
