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

/** librarytools-auth sets the identity cookie with `Domain=<shared host>`,
 * and a browser only drops a domain cookie when the deletion carries the
 * same Domain — a bare delete would leave it alive for its full 60s, and
 * every request in that window would mint another session. Traefik passes
 * the public Host header through unchanged, and that host is exactly the
 * cookie domain (apps.lib.kth.se / apps-ref.lib.kth.se). */
function deleteIdentityCookie(request: NextRequest, response: NextResponse) {
  const host = publicHost(request).split(":")[0];
  response.cookies.set(IDENTITY_COOKIE, "", { path: "/", maxAge: 0, ...(host && { domain: host }) });
}

function publicHost(request: NextRequest) {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
}

/** The URL the browser actually asked for — behind Traefik, request.nextUrl
 * can carry the container's own http origin instead of the public https one. */
function publicUrl(request: NextRequest) {
  const url = request.nextUrl.clone();
  const [hostname, port = ""] = publicHost(request).split(":");
  url.hostname = hostname;
  url.port = port;
  url.protocol = request.headers.get("x-forwarded-proto") ?? url.protocol;
  return url;
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
    // librarytools-auth sets `iss` to the public origin it was reached on —
    // the same shared host as this app — not to KTH_AUTH_JWKS_URL's origin,
    // which is the internal apps-net address (see bookingtools.env.example).
    const { payload } = await jwtVerify(token, getJwks(), {
      algorithms: ["EdDSA"],
      issuer: publicUrl(request).origin,
    });
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
    const response = NextResponse.redirect(publicUrl(request));
    response.cookies.set(SESSION_COOKIE, session.id, sessionCookieOptions(session.expiresAt));
    deleteIdentityCookie(request, response);
    return response;
  } catch (error) {
    console.error("KTH identity token verification failed:", error);
    const response = NextResponse.next();
    deleteIdentityCookie(request, response);
    return response;
  }
}

export const config = {
  matcher: [
    // Under a basePath the app root itself (/bookingtools, no trailing
    // slash) isn't matched by the catch-all below — and "/" is where
    // librarytools-auth sends people back to by default. Without this the
    // landing page renders logged out and the session only appears when a
    // background <Link> prefetch happens to trip the proxy.
    { source: "/", has: [{ type: "cookie", key: "kth_identity" }] },
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      has: [{ type: "cookie", key: "kth_identity" }],
    },
  ],
};
