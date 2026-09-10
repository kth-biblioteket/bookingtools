import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAllRoomsBookingsForDate, todayStr, DAY_START_HOUR, DAY_END_HOUR } from "@/lib/booking";
import { getScheduleLayout } from "@/lib/settings";
import { RoomTimeline } from "@/components/room-timeline";
import { ScheduleVertical } from "@/components/schedule-vertical";

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr();

  const [roomsWithBookings, scheduleLayout] = await Promise.all([
    getAllRoomsBookingsForDate(date),
    getScheduleLayout(),
  ]);

  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
    (_, i) => DAY_START_HOUR + i
  );

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Alla rum – schema för dagen</h1>
      <p className="mt-1 text-sm text-gray-500">
        Se vilka rum som är lediga eller bokade under dagen. Klicka på ett rum för att boka en tid.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <Link
          href={`/schedule?date=${addDays(date, -1)}`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          ← Föregående dag
        </Link>
        <span className="font-medium text-gray-900">{date}</span>
        <Link
          href={`/schedule?date=${addDays(date, 1)}`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          Nästa dag →
        </Link>
      </div>

      {scheduleLayout === "vertical" ? (
        <div className="mt-8">
          <ScheduleVertical
            roomsWithBookings={roomsWithBookings}
            currentUserId={user.id}
            dateStr={date}
            dayStartHour={DAY_START_HOUR}
            dayEndHour={DAY_END_HOUR}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-48 shrink-0" />
            <div className="relative h-5 flex-1">
              {hours.map((hour) => {
                const left = ((hour - DAY_START_HOUR) / (DAY_END_HOUR - DAY_START_HOUR)) * 100;
                return (
                  <span
                    key={hour}
                    style={{ left: `${left}%` }}
                    className="absolute -translate-x-1/2 text-xs text-gray-500"
                  >
                    {String(hour).padStart(2, "0")}
                  </span>
                );
              })}
            </div>
          </div>

          {roomsWithBookings.map(({ room, bookings }) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}?date=${date}`}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-blue-300 hover:shadow"
            >
              <div className="w-48 shrink-0">
                <p className="text-sm font-medium text-gray-900">{room.name}</p>
                <p className="text-xs text-gray-500">
                  {room.building} · {room.campus}
                </p>
              </div>
              <div className="flex-1">
                <RoomTimeline
                  bookings={bookings}
                  currentUserId={user.id}
                  dateStr={date}
                  dayStartHour={DAY_START_HOUR}
                  dayEndHour={DAY_END_HOUR}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
