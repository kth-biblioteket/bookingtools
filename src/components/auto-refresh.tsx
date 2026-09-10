"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-fetches the current route's server-rendered data (fresh booking
 * statuses, past-time graying, and the lazy release of expired unconfirmed
 * bookings all get recomputed against "now" on the server) whenever
 * something changes elsewhere in the app.
 *
 * Primarily driven by a Server-Sent Events connection to
 * `/api/booking-events`, which pushes a `changed` frame the instant a
 * booking/room/setting is created, updated, or deleted, so updates show up
 * near-instantly instead of waiting for the next poll. A slower interval
 * poll is kept as a fallback safety net for the rare case where the SSE
 * connection is silently stuck or blocked (e.g. a restrictive proxy)
 * without ever erroring.
 *
 * `/api/booking-events` requires the viewer to be logged in and returns 401
 * otherwise, which `EventSource` treats as an error and retries forever
 * with backoff. We don't special-case that here: `AutoRefresh` is only ever
 * rendered on pages that are already auth-gated server-side (they redirect
 * logged-out visitors to /login before rendering), so a 401 loop shouldn't
 * happen in practice.
 *
 * Renders nothing — drop it anywhere in a page tree.
 */
export function AutoRefresh({ intervalMs = 60000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const eventSource = new EventSource("/api/booking-events");

    eventSource.onmessage = () => router.refresh();
    // EventSource retries dropped connections on its own; no manual
    // reconnect logic needed. Keep this quiet so transient reconnects
    // don't spam the console.
    eventSource.onerror = () => {
      console.debug("AutoRefresh: SSE connection error, browser will retry");
    };

    return () => eventSource.close();
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
