/**
 * Prefixes a root-relative path with BASE_PATH (see next.config.ts).
 *
 * next/link's <Link> and next/navigation's redirect() apply BASE_PATH
 * automatically, but anywhere a URL is built by hand instead — a plain
 * <a href> (needed for a real full-page navigation, not a Next.js client
 * transition), or NextResponse.redirect() in a Route Handler — it isn't
 * applied, so it has to be added explicitly with this.
 *
 * Server-side only: BASE_PATH is a plain (non-NEXT_PUBLIC_) env var, so
 * process.env.BASE_PATH is undefined in the browser bundle. Compute the
 * final path/href on the server and pass it down as a prop instead of
 * calling this from a "use client" file.
 */
export function withBasePath(path: string): string {
  return `${process.env.BASE_PATH ?? ""}${path}`;
}
