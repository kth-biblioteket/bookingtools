import "server-only";
import { EventEmitter } from "node:events";

// Shared in-memory event bus so an SSE route can notify every connected
// browser tab when a booking, room, or setting changes elsewhere. Kept as a
// globalThis singleton (same pattern as the Prisma client in lib/db.ts) so
// Next.js dev's module hot-reloading doesn't spawn a fresh emitter — and
// with it, orphaned SSE subscribers — on every file save.
//
// This only broadcasts within a single Node process. If this app is ever
// deployed across multiple server instances, this needs to become a shared
// pub/sub (e.g. Redis) instead — a single instance can't see events
// emitted in another instance's memory.
const globalForEvents = globalThis as unknown as { bookingEvents?: EventEmitter };

export const bookingEvents = globalForEvents.bookingEvents ?? new EventEmitter();
if (process.env.NODE_ENV !== "production") globalForEvents.bookingEvents = bookingEvents;

// Many browser tabs may each hold open one SSE connection to this process.
bookingEvents.setMaxListeners(0);

export const BOOKING_EVENT = "changed";

/** Call after any mutation a connected client should hear about. */
export function notifyBookingsChanged() {
  bookingEvents.emit(BOOKING_EVENT);
}
