import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getBookingsForRoomInRange, getRoom, todayStr } from "@/lib/booking";
import { getActiveHoldsForRoomInRange } from "@/lib/booking-hold";
import { getBookingSettings, getOpeningHours } from "@/lib/settings";
import { openingHoursGridBounds } from "@/lib/slots";
import { AutoRefresh } from "@/components/auto-refresh";
import { DateNav } from "@/components/date-nav";
import { addDays, getWeekDates, isoWeekday } from "@/lib/date";
import { getT } from "@/lib/i18n/get-dictionary";
import { RoomPlanner } from "./room-planner";

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();

  const { id } = await params;
  const { date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr();

  const room = await getRoom(id);
  if (!room) notFound();

  const weekDates = getWeekDates(date);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];

  const [bookings, holds, settings, openingHours, { t }] = await Promise.all([
    getBookingsForRoomInRange(id, weekStart, weekEnd),
    getActiveHoldsForRoomInRange(id, weekStart, weekEnd),
    getBookingSettings(),
    getOpeningHours(),
    getT(),
  ]);

  const hoursByDate: Record<string, (typeof openingHours)[number]> = {};
  for (const d of weekDates) hoursByDate[d] = openingHours[isoWeekday(d)];
  const { startHour: gridStartHour, endHour: gridEndHour } = openingHoursGridBounds(
    weekDates.map((d) => hoursByDate[d])
  );

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
        {t("roomDetail.backToRooms")}
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{room.name}</h1>
          <p className="text-sm text-gray-500">
            {room.building} · {room.campus} · {t("rooms.capacity", { n: room.capacity })}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        <Link
          href={`/rooms/${id}?date=${addDays(date, -7)}`}
          aria-label={t("roomDetail.prevWeek")}
          className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          <span className="sm:hidden" aria-hidden="true">←</span>
          <span className="hidden sm:inline">{t("roomDetail.prevWeek")}</span>
        </Link>
        <DateNav date={date} today={todayStr()} basePath={`/rooms/${id}`} />
        <Link
          href={`/rooms/${id}?date=${addDays(date, 7)}`}
          aria-label={t("roomDetail.nextWeek")}
          className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          <span className="sm:hidden" aria-hidden="true">→</span>
          <span className="hidden sm:inline">{t("roomDetail.nextWeek")}</span>
        </Link>
      </div>

      <RoomPlanner
        roomId={id}
        weekDates={weekDates}
        todayStr={todayStr()}
        bookingsByDate={bookingsByDate}
        holdsByDate={holdsByDate}
        hoursByDate={hoursByDate}
        settings={settings}
        currentUserId={user?.id ?? null}
        isAdmin={user ? isAdmin(user) : false}
        dayStartHour={gridStartHour}
        dayEndHour={gridEndHour}
      />
    </div>
  );
}
