import { getCurrentUser } from "@/lib/auth";
import { BOOKING_EVENT, bookingEvents } from "@/lib/booking-events";

// This route holds an open connection and must never be statically cached
// or prerendered. Reading getCurrentUser() (which reads cookies()) already
// forces dynamic rendering, but this is set explicitly for clarity — this
// project does not enable the `cacheComponents` flag in next.config.ts, so
// the traditional route segment config below still applies (see
// node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md).
export const dynamic = "force-dynamic";

const HEARTBEAT_INTERVAL_MS = 20_000;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(null, { status: 401 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const onChanged = () => {
        controller.enqueue(encoder.encode("data: changed\n\n"));
      };

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, HEARTBEAT_INTERVAL_MS);

      bookingEvents.on(BOOKING_EVENT, onChanged);

      cleanup = () => {
        bookingEvents.off(BOOKING_EVENT, onChanged);
        clearInterval(heartbeat);
      };

      // Belt and suspenders: whichever of `cancel()` or the request's abort
      // signal fires first, the listener and timer get torn down. Without
      // this, every disconnected client leaks a bookingEvents listener and
      // a timer forever.
      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
