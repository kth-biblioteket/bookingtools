"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { updateSettings as persistSettings } from "@/lib/settings";
import { notifyBookingsChanged } from "@/lib/booking-events";
import { getT } from "@/lib/i18n/get-dictionary";

export type SettingsState = { error?: string; success?: string } | undefined;

export async function updateSettings(
  _prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { t } = await getT();
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) {
    return { error: t("common.noPermission") };
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

  await persistSettings(parsed.data);

  revalidatePath("/admin");
  notifyBookingsChanged();
  return { success: t("admin.errors.saved") };
}
