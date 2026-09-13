import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAllRoomsBookingsForDate, todayStr } from "@/lib/booking";
import { getActiveHoldsForDate } from "@/lib/booking-hold";
import { getBookingSettings, getScheduleLayout, getOpeningHoursForDate } from "@/lib/settings";
import { AutoRefresh } from "@/components/auto-refresh";
import { DateNav } from "@/components/date-nav";
import { addDays } from "@/lib/date";
import { getT } from "@/lib/i18n/get-dictionary";
import { ScheduleBoard } from "./schedule-board";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();

  const { date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr();

  const [roomsWithBookings, scheduleLayout, settings, openingHours, holds, { t }] = await Promise.all([
    getAllRoomsBookingsForDate(date),
    getScheduleLayout(),
    getBookingSettings(),
    getOpeningHoursForDate(date),
    getActiveHoldsForDate(date),
    getT(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1228px] flex-1 px-4 py-8">
      <AutoRefresh />
      <h1 className="text-2xl font-semibold text-gray-900">{t("schedule.heading")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("schedule.subtitle")}</p>

      <div className="mt-6 flex items-center justify-between gap-2">
        <Link
          href={`/schedule?date=${addDays(date, -1)}`}
          aria-label={t("schedule.prevDay")}
          className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          <span className="sm:hidden" aria-hidden="true">←</span>
          <span className="hidden sm:inline">{t("schedule.prevDay")}</span>
        </Link>
        <DateNav date={date} today={todayStr()} basePath="/schedule" />
        <Link
          href={`/schedule?date=${addDays(date, 1)}`}
          aria-label={t("schedule.nextDay")}
          className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          <span className="sm:hidden" aria-hidden="true">→</span>
          <span className="hidden sm:inline">{t("schedule.nextDay")}</span>
        </Link>
      </div>

      {openingHours.closed ? (
        <p className="mt-8 text-sm text-gray-500">{t("schedule.closedToday")}</p>
      ) : (
        <ScheduleBoard
          roomsWithBookings={roomsWithBookings}
          scheduleLayout={scheduleLayout}
          settings={settings}
          currentUserId={user?.id ?? null}
          isAdmin={user ? isAdmin(user) : false}
          date={date}
          dayStartHour={openingHours.startHour}
          dayEndHour={openingHours.endHour}
          holds={holds}
        />
      )}
    </div>
  );
}
