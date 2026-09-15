/**
 * The externally-visible origin (protocol + host) for an incoming request.
 *
 * Behind Traefik, a Route Handler's `request.url` reflects the container's
 * own internal listen address (e.g. http://localhost:3000), not the public
 * host the browser actually used — Next.js doesn't rewrite it from the
 * X-Forwarded-* headers Traefik sets. Read those explicitly instead, falling
 * back to request.url's own origin for local dev (no proxy in front).
 */
export function getExternalOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${forwardedProto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}
