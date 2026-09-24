"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { createSchedule, isReservedScheduleSlug, renameSchedule, setScheduleActive } from "@/lib/schedules";
import { getT } from "@/lib/i18n/get-dictionary";

export type ScheduleActionState = { error?: string; success?: string } | undefined;

export async function createScheduleAction(
  _prevState: ScheduleActionState,
  formData: FormData
): Promise<ScheduleActionState> {
  const { t } = await getT();
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return { error: t("common.noPermission") };
  }

  const schema = z.object({
    slug: z
      .string()
      .trim()
      .min(1, t("systemAdmin.errors.slugRequired"))
      .max(50, t("systemAdmin.errors.slugTooLong"))
      .regex(/^[a-z0-9-]+$/i, t("systemAdmin.errors.slugInvalid"))
      .refine((slug) => !isReservedScheduleSlug(slug), t("systemAdmin.errors.slugReserved")),
    name: z.string().trim().min(1, t("systemAdmin.errors.nameRequired")).max(100),
    description: z.string().trim().max(300).optional(),
  });

  const parsed = schema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("common.invalidData") };
  }

  try {
    await createSchedule(parsed.data);
  } catch {
    return { error: t("systemAdmin.errors.slugTaken") };
  }

  revalidatePath("/system-admin");
  revalidatePath("/");
  return { success: t("systemAdmin.created") };
}

export async function renameScheduleAction(
  _prevState: ScheduleActionState,
  formData: FormData
): Promise<ScheduleActionState> {
  const { t } = await getT();
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return { error: t("common.noPermission") };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: t("common.invalidData") };
  }

  const schema = z.object({
    name: z.string().trim().min(1, t("systemAdmin.errors.nameRequired")).max(100),
    description: z.string().trim().max(300).optional(),
  });

  const parsed = schema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("common.invalidData") };
  }

  await renameSchedule(id, parsed.data);

  revalidatePath("/system-admin");
  revalidatePath("/");
  return { success: t("systemAdmin.saved") };
}

export async function toggleScheduleActiveAction(id: string, isActive: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return;

  await setScheduleActive(id, isActive);

  revalidatePath("/system-admin");
  revalidatePath("/");
}
