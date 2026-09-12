import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getBookingSettings } from "@/lib/settings";

export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 20;
export const SLOT_MINUTES = 30;

// Re-exported for convenience so existing server-side importers of
// "@/lib/booking" keep working. Client components must import this pure
// logic directly from "@/lib/booking-status" instead — this file pulls in
// "server-only" and cannot be imported from a Client Component module.
export type { BookingConfirmationStatus } from "@/lib/booking-status";
export { getBookingConfirmationStatus } from "@/lib/booking-status";

/**
 * Deletes preliminary bookings whose confirmation window has closed without
 * being confirmed, freeing the room back up. There's no background job in
 * this app, so this runs lazily whenever bookings are read or a new one is
 * about to be checked for overlap.
 */
export async function releaseExpiredPreliminaryBookings() {
  const { requirePreliminaryConfirmation, confirmMinutesAfter } = await getBookingSettings();
  if (!requirePreliminaryConfirmation) return;

  const cutoff = new Date(Date.now() - confirmMinutesAfter * 60000);
  await db.booking.deleteMany({
    where: { confirmedAt: null, startTime: { lt: cutoff } },
  });
}

export function dayBounds(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59.999`);
  return { start, end };
}

export function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getRoomsWithTodayStatus() {
  await releaseExpiredPreliminaryBookings();
  const rooms = await db.room.findMany({ orderBy: { roomNumber: "asc" } });
  const now = new Date();
  const { start, end } = dayBounds(todayStr());

  const bookingsToday = await db.booking.findMany({
    where: { startTime: { lte: end }, endTime: { gte: start } },
    orderBy: { startTime: "asc" },
  });

  return rooms.map((room) => {
    const roomBookings = bookingsToday.filter((b) => b.roomId === room.id);
    const current = roomBookings.find((b) => b.startTime <= now && b.endTime > now);
    const next = roomBookings.find((b) => b.startTime > now);
    return {
      room,
      status: current
        ? { free: false, until: current.endTime }
        : { free: true, until: next?.startTime ?? null },
    };
  });
}

export async function getRoom(roomId: string) {
  return db.room.findUnique({ where: { id: roomId } });
}

export async function getBookingsForRoomOnDate(roomId: string, dateStr: string) {
  await releaseExpiredPreliminaryBookings();
  const { start, end } = dayBounds(dateStr);
  return db.booking.findMany({
    where: { roomId, startTime: { lte: end }, endTime: { gte: start } },
    include: { user: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });
}

export function generateDaySlots(dateStr: string) {
  const slots: { start: Date; end: Date; label: string }[] = [];
  const totalSlots = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES;
  for (let i = 0; i < totalSlots; i++) {
    const minutesFromStart = DAY_START_HOUR * 60 + i * SLOT_MINUTES;
    const start = new Date(`${dateStr}T00:00:00`);
    start.setMinutes(minutesFromStart);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + SLOT_MINUTES);
    const label = start.toTimeString().slice(0, 5);
    slots.push({ start, end, label });
  }
  return slots;
}

/** Anything with the `booking.findFirst` shape — the plain db client, or a `tx` inside db.$transaction(). */
type BookingReader = { booking: Pick<typeof db.booking, "findFirst"> };

/**
 * Checks for an existing booking overlapping [start, end) in the given
 * room. Pass a transaction client (not the plain `db`) when this check must
 * be atomic with the write that follows it — see createBooking/updateBooking
 * in src/app/rooms/[id]/actions.ts, which run this inside a Serializable
 * transaction so two concurrent requests can't both see "no overlap" and
 * both insert.
 */
export async function hasOverlap(
  client: BookingReader,
  roomId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string
) {
  const overlapping = await client.booking.findFirst({
    where: {
      roomId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });
  return Boolean(overlapping);
}

/** Thrown inside a withSerializableRetry-wrapped transaction to abort it when hasOverlap finds a conflict; callers catch this and translate it for the UI. */
export class BookingOverlapError extends Error {}

const MAX_SERIALIZATION_RETRIES = 3;

/**
 * Runs `run` — expected to call db.$transaction with Serializable isolation
 * — and retries it from scratch if Postgres aborts the transaction due to a
 * conflict with another concurrent transaction (Prisma surfaces this as
 * error code P2034). Under Serializable isolation Postgres can abort a
 * transaction even when it doesn't truly conflict with what committed, so
 * retrying is the standard, Prisma-recommended way to handle it rather than
 * treating it as a real failure. This is what actually prevents two
 * concurrent booking requests for the same overlapping slot from both
 * succeeding — the createOrRenewHold advisory hold in booking-hold.ts only
 * makes that outcome rare in the UI, it doesn't guarantee it.
 */
export async function withSerializableRetry<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      const isSerializationFailure =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!isSerializationFailure || attempt >= MAX_SERIALIZATION_RETRIES) throw error;
    }
  }
}

/** All of a room's bookings overlapping the [startStr, endStr] range of days, inclusive. */
export async function getBookingsForRoomInRange(roomId: string, startStr: string, endStr: string) {
  await releaseExpiredPreliminaryBookings();
  const { start } = dayBounds(startStr);
  const { end } = dayBounds(endStr);
  return db.booking.findMany({
    where: { roomId, startTime: { lte: end }, endTime: { gte: start } },
    include: { user: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });
}

export async function getAllRoomsBookingsForDate(dateStr: string) {
  await releaseExpiredPreliminaryBookings();
  const { start, end } = dayBounds(dateStr);
  const rooms = await db.room.findMany({
    orderBy: { roomNumber: "asc" },
    include: {
      bookings: {
        where: { startTime: { lte: end }, endTime: { gte: start } },
        include: { user: { select: { name: true } } },
        orderBy: { startTime: "asc" },
      },
    },
  });

  return rooms.map(({ bookings, ...room }) => ({ room, bookings }));
}

export async function getUpcomingBookingsForUser(userId: string) {
  await releaseExpiredPreliminaryBookings();
  return db.booking.findMany({
    where: { userId, endTime: { gte: new Date() } },
    include: { room: true },
    orderBy: { startTime: "asc" },
  });
}
