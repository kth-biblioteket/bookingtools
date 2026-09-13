import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { exchangeCodeForClaims, isAdminGroupConfigured, checkIsGroupAdmin } from "@/lib/oidc";

/** Only a same-origin relative path is safe to redirect to. */
function safeReturnTo(value: string | undefined): string | null {
  if (!value) return null;
  return /^\/(?!\/)/.test(value) ? value : null;
}

/**
 * The actual OIDC token exchange, forwarded to from src/app/page.tsx (the
 * app's root — see src/lib/oidc.ts for why the callback can't live at a
 * dedicated route yet). Runs as a Route Handler specifically because it
 * needs to set cookies, which a page component can't do.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    })
  );

  const state = cookies.oidc_state;
  const nonce = cookies.oidc_nonce;
  const codeVerifier = cookies.oidc_verifier;
  const returnTo = safeReturnTo(cookies.oidc_return_to);

  if (!state || !nonce || !codeVerifier) {
    return clearOidcCookies(NextResponse.redirect(new URL("/login?error=oidc_state", url.origin)));
  }

  try {
    const { claims, accessToken } = await exchangeCodeForClaims(url, { state, nonce, codeVerifier });

    let user = await db.user.findUnique({ where: { oidcSubject: claims.sub } });
    if (!user) {
      const existing = await db.user.findUnique({ where: { email: claims.email } });
      user = existing
        ? await db.user.update({ where: { id: existing.id }, data: { oidcSubject: claims.sub } })
        : await db.user.create({
            data: { email: claims.email, name: claims.name, passwordHash: null, oidcSubject: claims.sub },
          });
    }

    if (isAdminGroupConfigured()) {
      const isGroupAdmin = await checkIsGroupAdmin(accessToken);
      if (isGroupAdmin !== user.isGroupAdmin) {
        user = await db.user.update({ where: { id: user.id }, data: { isGroupAdmin } });
      }
    }

    await createSession(user.id);
    return clearOidcCookies(NextResponse.redirect(new URL(returnTo ?? "/rooms", url.origin)));
  } catch {
    return clearOidcCookies(NextResponse.redirect(new URL("/login?error=oidc_failed", url.origin)));
  }
}

function clearOidcCookies(response: NextResponse) {
  for (const name of ["oidc_state", "oidc_nonce", "oidc_verifier", "oidc_return_to"]) {
    response.cookies.delete(name);
  }
  return response;
}
