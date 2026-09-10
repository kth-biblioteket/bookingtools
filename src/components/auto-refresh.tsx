"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Periodically re-fetches the current route's server-rendered data (fresh
 * booking statuses, past-time graying, and the lazy release of expired
 * unconfirmed bookings all get recomputed against "now" on the server).
 * Renders nothing — drop it anywhere in a page tree.
 */
export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
