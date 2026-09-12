import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import {
  generateDaySlots,
  getBookingsForRoomInRange,
  getRoom,
  todayStr,
  DAY_START_HOUR,
  DAY_END_HOUR,
} from "@/lib/booking";
import { getActiveHoldsForRoomInRange } from "@/lib/booking-hold";
import { getBookingSettings } from "@/lib/settings";
import { AutoRefresh } from "@/components/auto-refresh";
import { DateNav } from "@/components/date-nav";
import { addDays, getWeekDates } from "@/lib/date";
import { RoomPlanner } from "./room-planner";

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr();

  const room = await getRoom(id);
  if (!room) notFound();

  const weekDates = getWeekDates(date);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];

  const [bookings, holds, slots, settings] = await Promise.all([
    getBookingsForRoomInRange(id, weekStart, weekEnd),
    getActiveHoldsForRoomInRange(id, weekStart, weekEnd),
    Promise.resolve(generateDaySlots(date)),
    getBookingSettings(),
  ]);

  function dateStrFromDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const bookingsByDate: Record<string, typeof bookings> = {};
  for (const d of weekDates) bookingsByDate[d] = [];
  for (const booking of bookings) {
    const key = dateStrFromDate(booking.startTime);
    if (bookingsByDate[key]) bookingsByDate[key].push(booking);
  }

  const holdsByDate: Record<string, typeof holds> = {};
  for (const d of weekDates) holdsByDate[d] = [];
  for (const hold of holds) {
    const key = dateStrFromDate(hold.startTime);
    if (holdsByDate[key]) holdsByDate[key].push(hold);
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <AutoRefresh />
      <Link href="/rooms" className="text-sm text-kth-blue hover:underline">
        ← Alla rum
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{room.name}</h1>
          <p className="text-sm text-gray-500">
            {room.building} · {room.campus} · Plats för {room.capacity} personer
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link
          href={`/rooms/${id}?date=${addDays(date, -7)}`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Föregående vecka
        </Link>
        <DateNav date={date} today={todayStr()} basePath={`/rooms/${id}`} />
        <Link
          href={`/rooms/${id}?date=${addDays(date, 7)}`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          Nästa vecka →
        </Link>
      </div>

      <RoomPlanner
        roomId={id}
        weekDates={weekDates}
        todayStr={todayStr()}
        bookingsByDate={bookingsByDate}
        holdsByDate={holdsByDate}
        slots={slots}
        settings={settings}
        currentUserId={user.id}
        isAdmin={isAdminEmail(user.email)}
        dayStartHour={DAY_START_HOUR}
        dayEndHour={DAY_END_HOUR}
      />
    </div>
  );
}
