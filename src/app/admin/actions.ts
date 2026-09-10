"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { updateSettings as persistSettings } from "@/lib/settings";

const settingsSchema = z
  .object({
    stepMinutes: z.coerce.number().int().positive("Bokningsintervallet måste vara ett positivt heltal"),
    minMinutes: z.coerce.number().int().positive("Minsta längd måste vara ett positivt heltal"),
    maxMinutes: z.coerce.number().int().positive("Längsta längd måste vara ett positivt heltal"),
    scheduleLayout: z.enum(["horizontal", "vertical"], {
      message: "Ogiltigt val för schemavy",
    }),
    requirePreliminaryConfirmation: z.coerce.boolean(),
    confirmMinutesBefore: z.coerce.number().int().min(0, "Måste vara 0 eller mer"),
    confirmMinutesAfter: z.coerce.number().int().min(0, "Måste vara 0 eller mer"),
  })
  .refine((data) => data.minMinutes <= data.maxMinutes, {
    message: "Minsta längd kan inte vara större än längsta längd",
  })
  .refine((data) => data.minMinutes % data.stepMinutes === 0 && data.maxMinutes % data.stepMinutes === 0, {
    message: "Minsta och längsta längd måste vara jämna multiplar av bokningsintervallet",
  });

export type SettingsState = { error?: string; success?: string } | undefined;

export async function updateSettings(
  _prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) {
    return { error: "Du har inte behörighet att göra detta" };
  }

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
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" };
  }

  await persistSettings(parsed.data);

  revalidatePath("/admin");
  return { success: "Inställningarna är sparade!" };
}
