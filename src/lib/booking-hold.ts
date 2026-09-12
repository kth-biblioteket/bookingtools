import "server-only";
import { db } from "@/lib/db";
import { hasOverlap } from "@/lib/booking";

/** How long a hold stays valid without being renewed by the client heartbeat. */
export const HOLD_TTL_MS = 60_000;

export type ActiveHold = {
  id: string;
  roomId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
};

/**
 * Deletes holds whose TTL has passed without a renewal. There's no
 * background job in this app — this runs lazily wherever holds are read or
 * about to be checked for a conflict, same pattern as
 * releaseExpiredPreliminaryBookings() in src/lib/booking.ts. This is the
 * only cleanup path for a hold abandoned by a crashed tab, a dead network,
 * or a browser closed without running its cleanup JS.
 */
export async function releaseExpiredHolds() {
  await db.bookingHold.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

/**
 * Creates or renews the calling user's hold on a slot. A user can only hold
 * one slot at a time — opening the booking form for a different slot (or a
 * heartbeat renewing the same one) replaces any previous hold via upsert on
 * the unique userId.
 *
 * Returns an error code instead of throwing if the slot is already booked,
 * or already held by a different user, so the caller can surface that in
 * the UI (translated) without a try/catch.
 */
export async function createOrRenewHold(
  userId: string,
  roomId: string,
  start: Date,
  end: Date
): Promise<{ error: "room_booked" | "slot_held" } | { hold: ActiveHold }> {
  await releaseExpiredHolds();

  if (await hasOverlap(roomId, start, end)) {
    return { error: "room_booked" };
  }

  const conflictingHold = await db.bookingHold.findFirst({
    where: {
      roomId,
      userId: { not: userId },
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });
  if (conflictingHold) {
    return { error: "slot_held" };
  }

  const hold = await db.bookingHold.upsert({
    where: { userId },
    create: { userId, roomId, startTime: start, endTime: end, expiresAt: new Date(Date.now() + HOLD_TTL_MS) },
    update: { roomId, startTime: start, endTime: end, expiresAt: new Date(Date.now() + HOLD_TTL_MS) },
  });

  return { hold };
}

/** Releases the calling user's hold, if any (form closed, cancelled, or booking submitted). */
export async function releaseHold(userId: string) {
  await db.bookingHold.deleteMany({ where: { userId } });
}

/** Active (non-expired) holds for a room on a given day, for rendering in the schedule. */
export async function getActiveHoldsForRoomOnDate(roomId: string, dateStr: string) {
  await releaseExpiredHolds();
  const { start, end } = dayBoundsFor(dateStr);
  return db.bookingHold.findMany({
    where: { roomId, startTime: { lte: end }, endTime: { gte: start } },
  });
}

/** Active (non-expired) holds for a room over a [startStr, endStr] range of days, inclusive. */
export async function getActiveHoldsForRoomInRange(roomId: string, startStr: string, endStr: string) {
  await releaseExpiredHolds();
  const { start } = dayBoundsFor(startStr);
  const { end } = dayBoundsFor(endStr);
  return db.bookingHold.findMany({
    where: { roomId, startTime: { lte: end }, endTime: { gte: start } },
  });
}

/** Active (non-expired) holds across all rooms on a given day. */
export async function getActiveHoldsForDate(dateStr: string) {
  await releaseExpiredHolds();
  const { start, end } = dayBoundsFor(dateStr);
  return db.bookingHold.findMany({
    where: { startTime: { lte: end }, endTime: { gte: start } },
  });
}

function dayBoundsFor(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59.999`);
  return { start, end };
}
