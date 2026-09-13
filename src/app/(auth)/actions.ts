"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { getT } from "@/lib/i18n/get-dictionary";

export type ActionState = { error?: string } | undefined;

/** Only redirect to a same-origin relative path — never an absolute/protocol-
 * relative URL, which could otherwise be used for an open-redirect. */
function safeReturnTo(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || value === "") return null;
  return /^\/(?!\/)/.test(value) ? value : null;
}

export async function signup(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getT();

  const signupSchema = z.object({
    name: z.string().trim().min(1, t("auth.errors.nameRequired")).max(100),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email(t("auth.errors.invalidEmail"))
      .refine((email) => email.endsWith("@kth.se"), t("auth.errors.emailDomainNotAllowed")),
    password: z.string().min(8, t("auth.errors.passwordTooShort")),
  });

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("common.invalidData") };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: t("auth.errors.accountExists") };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { name, email, passwordHash },
  });

  await createSession(user.id);
  redirect("/rooms");
}

export async function login(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getT();

  const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email(t("auth.errors.invalidEmail")),
    password: z.string().min(1, t("auth.errors.passwordRequired")),
  });

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("common.invalidData") };
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { error: t("auth.errors.wrongCredentials") };
  }
  if (!user.passwordHash) {
    return { error: t("auth.errors.useKthLogin") };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: t("auth.errors.wrongCredentials") };
  }

  await createSession(user.id);
  redirect(safeReturnTo(formData.get("returnTo")) ?? "/rooms");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
