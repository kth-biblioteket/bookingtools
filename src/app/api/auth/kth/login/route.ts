import { NextResponse } from "next/server";
import { buildAuthorizationRequest } from "@/lib/oidc";

const OIDC_COOKIE_MAX_AGE = 60 * 10; // 10 minutes — long enough for the round trip to Entra ID and back, short enough to limit replay.

function oidcCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: OIDC_COOKIE_MAX_AGE,
  };
}

/** Only a same-origin relative path is safe to carry through as returnTo. */
function safeReturnTo(value: string | null): string | null {
  if (!value) return null;
  return /^\/(?!\/)/.test(value) ? value : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get("returnTo"));

  const { authorizationUrl, state, nonce, codeVerifier } = await buildAuthorizationRequest(url.origin);

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("oidc_state", state, oidcCookieOptions());
  response.cookies.set("oidc_nonce", nonce, oidcCookieOptions());
  response.cookies.set("oidc_verifier", codeVerifier, oidcCookieOptions());
  if (returnTo) {
    response.cookies.set("oidc_return_to", returnTo, oidcCookieOptions());
  }
  return response;
}
