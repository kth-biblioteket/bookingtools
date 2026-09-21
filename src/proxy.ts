import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { db } from "@/lib/db";
import { createSessionRecord, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

/**
 * Upgrades the short-lived identity token librarytools-auth sets after a
 * successful KTH ADFS login into this app's own local session — the JIT
 * user-provisioning logic that used to live in
 * src/app/api/auth/kth/finish/route.ts, now triggered by "a valid signed
 * token showed up" instead of "we personally just finished an ADFS
 * exchange". See the plan (Fas 1) for the full design.
 */

const IDENTITY_COOKIE = "kth_identity";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    const jwksUrl = process.env.KTH_AUTH_JWKS_URL;
    if (!jwksUrl) {
      throw new Error("KTH_AUTH_JWKS_URL is not set — cannot verify KTH identity tokens.");
    }
    jwks = createRemoteJWKSet(new URL(jwksUrl));
  }
  return jwks;
}

type IdentityClaims = {
  sub: string;
  email: string;
  name: string;
  isGroupAdmin: boolean;
};

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(IDENTITY_COOKIE)?.value;
  if (!token) return NextResponse.next();

  try {
    const { payload } = await jwtVerify(token, getJwks());
    const claims = payload as unknown as IdentityClaims;

    let user = await db.user.findUnique({ where: { oidcSubject: claims.sub } });
    if (!user) {
      const existing = await db.user.findUnique({ where: { email: claims.email } });
      user = existing
        ? await db.user.update({ where: { id: existing.id }, data: { oidcSubject: claims.sub } })
        : await db.user.create({
            data: { email: claims.email, name: claims.name, passwordHash: null, oidcSubject: claims.sub },
          });
    }

    if (claims.isGroupAdmin !== user.isGroupAdmin) {
      user = await db.user.update({ where: { id: user.id }, data: { isGroupAdmin: claims.isGroupAdmin } });
    }

    const session = await createSessionRecord(user.id);

    // The in-flight request's own cookie jar can't see a cookie just added
    // to the response, so the page about to render would still look logged
    // out. Redirecting to the same URL forces one more round trip that
    // actually carries session_id.
    const response = NextResponse.redirect(request.nextUrl);
    response.cookies.set(SESSION_COOKIE, session.id, sessionCookieOptions(session.expiresAt));
    response.cookies.delete(IDENTITY_COOKIE);
    return response;
  } catch (error) {
    console.error("KTH identity token verification failed:", error);
    const response = NextResponse.next();
    response.cookies.delete(IDENTITY_COOKIE);
    return response;
  }
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      has: [{ type: "cookie", key: "kth_identity" }],
    },
  ],
};
