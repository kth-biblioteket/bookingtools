import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getAllRoomsBookingsForDate, todayStr, DAY_START_HOUR, DAY_END_HOUR } from "@/lib/booking";
import { getActiveHoldsForDate } from "@/lib/booking-hold";
import { getBookingSettings, getScheduleLayout } from "@/lib/settings";
import { AutoRefresh } from "@/components/auto-refresh";
import { DateNav } from "@/components/date-nav";
import { addDays } from "@/lib/date";
import { ScheduleBoard } from "./schedule-board";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr();

  const [roomsWithBookings, scheduleLayout, settings, holds] = await Promise.all([
    getAllRoomsBookingsForDate(date),
    getScheduleLayout(),
    getBookingSettings(),
    getActiveHoldsForDate(date),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1228px] flex-1 px-4 py-8">
      <AutoRefresh />
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
        <DateNav date={date} today={todayStr()} basePath="/schedule" />
        <Link
          href={`/schedule?date=${addDays(date, 1)}`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          Nästa dag →
        </Link>
      </div>

      <ScheduleBoard
        roomsWithBookings={roomsWithBookings}
        scheduleLayout={scheduleLayout}
        settings={settings}
        currentUserId={user.id}
        isAdmin={isAdminEmail(user.email)}
        date={date}
        dayStartHour={DAY_START_HOUR}
        dayEndHour={DAY_END_HOUR}
        holds={holds}
      />
    </div>
  );
}
