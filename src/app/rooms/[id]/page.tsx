import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import {
  generateDaySlots,
  getBookingsForRoomOnDate,
  getRoom,
  todayStr,
} from "@/lib/booking";
import { getActiveHoldsForRoomOnDate } from "@/lib/booking-hold";
import { getBookingSettings } from "@/lib/settings";
import { AutoRefresh } from "@/components/auto-refresh";
import { RoomPlanner } from "./room-planner";

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

  const [bookings, slots, settings, holds] = await Promise.all([
    getBookingsForRoomOnDate(id, date),
    Promise.resolve(generateDaySlots(date)),
    getBookingSettings(),
    getActiveHoldsForRoomOnDate(id, date),
  ]);

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
          href={`/rooms/${id}?date=${addDays(date, -1)}`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Föregående dag
        </Link>
        <span className="font-medium text-gray-900">{date}</span>
        <Link
          href={`/rooms/${id}?date=${addDays(date, 1)}`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          Nästa dag →
        </Link>
      </div>

      <RoomPlanner
        roomId={id}
        date={date}
        bookings={bookings}
        slots={slots}
        settings={settings}
        currentUserId={user.id}
        isAdmin={isAdminEmail(user.email)}
        holds={holds}
      />
    </div>
  );
}
