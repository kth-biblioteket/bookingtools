import "server-only";
import { db } from "@/lib/db";

export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 20;
export const SLOT_MINUTES = 30;

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
  const rooms = await db.room.findMany({ orderBy: [{ campus: "asc" }, { building: "asc" }, { name: "asc" }] });
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

export async function hasOverlap(roomId: string, start: Date, end: Date, excludeBookingId?: string) {
  const overlapping = await db.booking.findFirst({
    where: {
      roomId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });
  return Boolean(overlapping);
}

export async function getAllRoomsBookingsForDate(dateStr: string) {
  const { start, end } = dayBounds(dateStr);
  const rooms = await db.room.findMany({
    orderBy: [{ campus: "asc" }, { building: "asc" }, { name: "asc" }],
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
  return db.booking.findMany({
    where: { userId, endTime: { gte: new Date() } },
    include: { room: true },
    orderBy: { startTime: "asc" },
  });
}
