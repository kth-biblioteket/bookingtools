import "server-only";
import * as client from "openid-client";

/**
 * KTH login via Microsoft Entra ID (OpenID Connect, Authorization Code +
 * PKCE). This app is server-rendered (a confidential client), so the client
 * secret lives here, never sent to the browser.
 *
 * NOTE: the app registration currently configured via OIDC_CLIENT_ID is a
 * reused, no-longer-used one — its only allowed redirect URI is the app's
 * own root (https://apps.lib.kth.se/mrbs), which is why the callback is
 * handled by src/app/page.tsx forwarding to /api/auth/kth/finish, rather
 * than Entra ID redirecting straight to a dedicated callback route. Once a
 * dedicated app registration exists, getRedirectUri() can point at
 * `${origin}${BASE_PATH ?? ""}/api/auth/kth/callback` directly and the
 * root-page forwarding can be removed.
 */

let configPromise: Promise<client.Configuration> | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set — KTH login is not configured.`);
  }
  return value;
}

/** Lazy, cached discovery — done once per process, not per request. */
function getOidcConfig(): Promise<client.Configuration> {
  if (!configPromise) {
    const issuer = requireEnv("OIDC_ISSUER");
    const clientId = requireEnv("OIDC_CLIENT_ID");
    const clientSecret = requireEnv("OIDC_CLIENT_SECRET");
    configPromise = client.discovery(new URL(issuer), clientId, clientSecret);
  }
  return configPromise;
}

/** The redirect_uri sent to Entra ID — see the note above re: the fixed,
 * no-suffix redirect URI of the currently-reused app registration. */
export function getRedirectUri(origin: string): string {
  return `${origin}${process.env.BASE_PATH ?? ""}`;
}

export type OidcRequest = {
  authorizationUrl: URL;
  state: string;
  nonce: string;
  codeVerifier: string;
};

export async function buildAuthorizationRequest(origin: string): Promise<OidcRequest> {
  const config = await getOidcConfig();
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const nonce = client.randomNonce();

  const authorizationUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: getRedirectUri(origin),
    scope: "openid profile email",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
  });

  return { authorizationUrl, state, nonce, codeVerifier };
}

export type KthClaims = { sub: string; email: string; name: string };

export async function exchangeCodeForClaims(
  callbackUrl: URL,
  origin: string,
  checks: { state: string; nonce: string; codeVerifier: string }
): Promise<{ claims: KthClaims; accessToken: string }> {
  const config = await getOidcConfig();

  // authorizationCodeGrant() derives the redirect_uri it sends to the token
  // endpoint from the URL it's given (minus the query string) — but the
  // actual callback lands on /api/auth/kth/finish, not the fixed root URI
  // (getRedirectUri()) that was registered and used for the authorization
  // request. Swap in that same fixed URI here, keeping the real query
  // string (code, state) so the response is still parsed correctly.
  const grantUrl = new URL(getRedirectUri(origin));
  grantUrl.search = callbackUrl.search;

  const tokens = await client.authorizationCodeGrant(config, grantUrl, {
    pkceCodeVerifier: checks.codeVerifier,
    expectedState: checks.state,
    expectedNonce: checks.nonce,
  });

  const idTokenClaims = tokens.claims();
  if (!idTokenClaims) {
    throw new Error("KTH login response did not include an ID token.");
  }

  // KTH's Entra ID tenant may surface the address as `email` or, for some
  // account types, only as `preferred_username` — confirm which against a
  // real token response once this is testable live (see the plan's
  // verification section) and adjust here if needed.
  const email = (idTokenClaims.email ?? idTokenClaims.preferred_username) as string | undefined;
  const name = (idTokenClaims.name as string | undefined) ?? email;
  if (!email || !name) {
    throw new Error("KTH login response did not include an email/name claim.");
  }

  return {
    claims: { sub: String(idTokenClaims.sub), email, name },
    accessToken: tokens.access_token,
  };
}

/** Whether OIDC_ADMIN_GROUP_ID is configured — lets callers skip the Graph
 * call entirely (no network, no behavior change) when it isn't. */
export function isAdminGroupConfigured(): boolean {
  return Boolean(process.env.OIDC_ADMIN_GROUP_ID);
}

/** Checks KTH-group membership via Microsoft Graph. Only call when
 * isAdminGroupConfigured() is true. */
export async function checkIsGroupAdmin(accessToken: string): Promise<boolean> {
  const groupId = process.env.OIDC_ADMIN_GROUP_ID;
  if (!groupId) return false;

  const response = await fetch("https://graph.microsoft.com/v1.0/me/checkMemberGroups", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ groupIds: [groupId] }),
  });
  if (!response.ok) return false;

  const data: { value?: string[] } = await response.json();
  return (data.value ?? []).includes(groupId);
}
