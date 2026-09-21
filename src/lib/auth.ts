import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "session_id";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dagar

/** Pure DB half of session creation — no cookie access, so it also works
 * from src/proxy.ts (Proxy has its own NextRequest/NextResponse cookie API,
 * not next/headers' cookies()). */
export async function createSessionRecord(userId: string) {
  return db.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export async function createSession(userId: string) {
  const session = await createSessionRecord(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.id, sessionCookieOptions(session.expiresAt));
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await db.session.deleteMany({ where: { id: sessionId } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await db.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export function isAdminEmail(email: string) {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/** Admin if listed in ADMIN_EMAILS, or if their cached KTH-group membership
 * (see OIDC_ADMIN_GROUP_ID, refreshed on every KTH login) says so. */
export function isAdmin(user: { email: string; isGroupAdmin: boolean }) {
  return isAdminEmail(user.email) || user.isGroupAdmin;
}
