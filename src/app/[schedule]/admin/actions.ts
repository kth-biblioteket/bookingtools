"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { updateSettings as persistSettings, updateOpeningHours } from "@/lib/settings";
import { getScheduleBySlug, updateScheduleMap } from "@/lib/schedules";
import { sanitizeSvg } from "@/lib/svg-sanitize";
import { notifyBookingsChanged } from "@/lib/booking-events";
import { getT } from "@/lib/i18n/get-dictionary";

export type SettingsState = { error?: string; success?: string } | undefined;

export async function updateSettings(
  _prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { t } = await getT();
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return { error: t("common.noPermission") };
  }

  const scheduleSlug = formData.get("scheduleSlug");
  if (typeof scheduleSlug !== "string" || !scheduleSlug) {
    return { error: t("common.invalidData") };
  }
  const schedule = await getScheduleBySlug(scheduleSlug);
  if (!schedule || !schedule.isActive) {
    return { error: t("common.invalidData") };
  }

  const settingsSchema = z
    .object({
      stepMinutes: z.coerce.number().int().positive(t("admin.errors.stepPositive")),
      minMinutes: z.coerce.number().int().positive(t("admin.errors.minPositive")),
      maxMinutes: z.coerce.number().int().positive(t("admin.errors.maxPositive")),
      scheduleLayout: z.enum(["horizontal", "vertical"], {
        message: t("admin.errors.invalidLayout"),
      }),
      requirePreliminaryConfirmation: z.coerce.boolean(),
      confirmMinutesBefore: z.coerce.number().int().min(0, t("admin.errors.mustBeZeroOrMore")),
      confirmMinutesAfter: z.coerce.number().int().min(0, t("admin.errors.mustBeZeroOrMore")),
    })
    .refine((data) => data.minMinutes <= data.maxMinutes, {
      message: t("admin.errors.minMaxOrder"),
    })
    .refine((data) => data.minMinutes % data.stepMinutes === 0 && data.maxMinutes % data.stepMinutes === 0, {
      message: t("admin.errors.mustBeMultipleOfStep"),
    });

  const parsed = settingsSchema.safeParse({
    stepMinutes: formData.get("stepMinutes"),
    minMinutes: formData.get("minMinutes"),
    maxMinutes: formData.get("maxMinutes"),
    scheduleLayout: formData.get("scheduleLayout"),
    requirePreliminaryConfirmation: formData.get("requirePreliminaryConfirmation"),
    confirmMinutesBefore: formData.get("confirmMinutesBefore"),
    confirmMinutesAfter: formData.get("confirmMinutesAfter"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("common.invalidData") };
  }

  const openingHoursSchema = z
    .array(
      z
        .object({
          weekday: z.number().int().min(0).max(6),
          startHour: z.coerce
            .number()
            .int()
            .min(0, t("admin.errors.hourRange"))
            .max(23, t("admin.errors.hourRange")),
          endHour: z.coerce
            .number()
            .int()
            .min(1, t("admin.errors.hourRange"))
            .max(24, t("admin.errors.hourRange")),
          closed: z.coerce.boolean(),
        })
        .refine((day) => day.closed || day.startHour < day.endHour, {
          message: t("admin.errors.openingHoursOrder"),
        })
    )
    .length(7);

  const openingHoursParsed = openingHoursSchema.safeParse(
    Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      startHour: formData.get(`startHour-${weekday}`),
      endHour: formData.get(`endHour-${weekday}`),
      closed: formData.get(`closed-${weekday}`),
    }))
  );

  if (!openingHoursParsed.success) {
    return { error: openingHoursParsed.error.issues[0]?.message ?? t("common.invalidData") };
  }

  await persistSettings(schedule.id, parsed.data);
  await updateOpeningHours(schedule.id, openingHoursParsed.data);

  revalidatePath(`/${scheduleSlug}/admin`);
  notifyBookingsChanged();
  return { success: t("admin.errors.saved") };
}

const MAX_MAP_SVG_LENGTH = 500_000; // 500 KB of raw markup — generous for a floor plan, not for an image bomb.

export type MapState = { error?: string; success?: string } | undefined;

export async function updateMap(_prevState: MapState, formData: FormData): Promise<MapState> {
  const { t } = await getT();
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return { error: t("common.noPermission") };
  }

  const scheduleSlug = formData.get("scheduleSlug");
  if (typeof scheduleSlug !== "string" || !scheduleSlug) {
    return { error: t("common.invalidData") };
  }
  const schedule = await getScheduleBySlug(scheduleSlug);
  if (!schedule || !schedule.isActive) {
    return { error: t("common.invalidData") };
  }

  const raw = formData.get("mapSvg");
  const trimmed = typeof raw === "string" ? raw.trim() : "";

  if (!trimmed) {
    await updateScheduleMap(schedule.id, null);
    revalidatePath(`/${scheduleSlug}/admin`);
    revalidatePath(`/${scheduleSlug}/schedule`);
    return { success: t("admin.errors.mapRemoved") };
  }

  if (trimmed.length > MAX_MAP_SVG_LENGTH) {
    return { error: t("admin.errors.mapTooLarge") };
  }
  if (!/^<svg[\s>]/i.test(trimmed)) {
    return { error: t("admin.errors.mapInvalid") };
  }

  const sanitized = sanitizeSvg(trimmed);
  if (!/^<svg[\s>]/i.test(sanitized)) {
    return { error: t("admin.errors.mapInvalid") };
  }

  await updateScheduleMap(schedule.id, sanitized);
  revalidatePath(`/${scheduleSlug}/admin`);
  revalidatePath(`/${scheduleSlug}/schedule`);
  return { success: t("admin.errors.mapSaved") };
}
