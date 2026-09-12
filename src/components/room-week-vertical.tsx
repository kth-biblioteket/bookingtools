"use client";

import Link from "next/link";
import { getBookingConfirmationStatus, type BookingConfirmationStatus } from "@/lib/booking-status";
import type { ActiveHold } from "@/lib/booking-hold";
import type { BookingSettings, OpeningHoursDay } from "@/lib/settings";
import { weekdayLabel, dayMonthLabel } from "@/lib/date";
import { ScheduleCornerCell } from "@/components/schedule-corner-cell";
import { useI18n } from "@/components/i18n-provider";

type TimelineBooking = {
  id: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  confirmedAt: Date | null;
  user: { name: string };
};

function formatTime(date: Date) {
  return date.toTimeString().slice(0, 5);
}

const statusClassNames: Record<BookingConfirmationStatus, string> = {
  preliminary: "bg-yellow-200 text-yellow-900",
  needs_confirmation: "bg-orange-200 text-orange-900",
  confirmed: "bg-red-200 text-red-800",
};

/**
 * The single-room counterpart to ScheduleVertical: same grid/colors/hour
 * rows, but the horizontal axis is the current week's days (mån–sön)
 * instead of other rooms, since there's only one room to show here.
 */
export function RoomWeekVertical<B extends TimelineBooking>({
  weekDates,
  bookingsByDate,
  holdsByDate,
  hoursByDate,
  currentUserId,
  isAdmin,
  todayStr,
  dayStartHour,
  dayEndHour,
  stepMinutes,
  settings,
  onFreeClick,
  onOwnBookingClick,
}: {
  weekDates: string[];
  bookingsByDate: Record<string, B[]>;
  holdsByDate?: Record<string, ActiveHold[]>;
  /** Each date's own opening hours — can be narrower than [dayStartHour, dayEndHour]
   * (the shared grid bounds) or fully closed. Defaults to the grid bounds, open, when omitted. */
  hoursByDate?: Record<string, OpeningHoursDay>;
  currentUserId: string;
  /** Admins see every booking's real title, not just its status. */
  isAdmin?: boolean;
  todayStr: string;
  dayStartHour: number;
  dayEndHour: number;
  stepMinutes?: number;
  settings: BookingSettings;
  onFreeClick?: (dateStr: string, startTime: Date) => void;
  onOwnBookingClick?: (dateStr: string, booking: B) => void;
}) {
  const { locale, t } = useI18n();
  const hourCount = dayEndHour - dayStartHour;
  const hours = Array.from({ length: hourCount }, (_, i) => dayStartHour + i);
  const rowHeightPx = 40;
  const totalHeightPx = hourCount * rowHeightPx;

  const totalMinutes = hourCount * 60;
  const stepCount = stepMinutes ? Math.round(totalMinutes / stepMinutes) : 0;

  const gridTemplateColumns = `4rem repeat(${weekDates.length}, minmax(80px, 1fr))`;

  return (
    <div className="overflow-x-auto pb-3">
      <div className="min-w-max" style={{ display: "grid", gridTemplateColumns }}>
        {/* Header row */}
        <ScheduleCornerCell
          roomsLabel={t("schedule.cornerDay")}
          timeLabel={t("schedule.cornerTime")}
          className="sticky left-0 z-20"
        />
        {weekDates.map((date, i) => (
          <Link
            key={date}
            href={`/schedule?date=${date}`}
            title={t("roomDetail.viewDayForAllRooms")}
            className={`border-b border-black/10 px-1 py-1.5 text-center hover:brightness-95 ${
              date === todayStr ? "bg-kth-blue" : "bg-kth-sky"
            } ${i > 0 ? "border-l border-l-black/10" : ""}`}
          >
            <p className="text-xl font-medium capitalize text-white">{weekdayLabel(date, locale)}</p>
            <p className="text-sm font-medium text-white">{dayMonthLabel(date, locale)}</p>
            {hoursByDate?.[date]?.closed && (
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                {t("roomDetail.closedDay")}
              </p>
            )}
          </Link>
        ))}

        {/* Hour label column — stays put when scrolling horizontally */}
        <div
          className="sticky left-0 z-20 bg-kth-blue"
          style={{ gridColumn: 1, gridRow: 2, height: totalHeightPx }}
        >
          {Array.from({ length: hourCount }, (_, i) => i).map((i) => (
            <div
              key={i}
              className={`h-10 ${i % 2 === 1 ? "bg-white/10" : ""} ${i > 0 ? "border-t border-white/10" : ""}`}
            />
          ))}
          {hours.map((hour, i) => (
            <span
              key={hour}
              className="absolute inset-x-0 -translate-y-1/2 text-center text-sm font-medium text-white"
              style={{ top: `${((i + 0.5) / hourCount) * 100}%` }}
            >
              {String(hour).padStart(2, "0")}:00
            </span>
          ))}
        </div>

        {/* Day columns */}
        {weekDates.map((date) => {
          const dayStart = new Date(`${date}T00:00:00`);
          dayStart.setHours(dayStartHour, 0, 0, 0);
          const dayEnd = new Date(`${date}T00:00:00`);
          dayEnd.setHours(dayEndHour, 0, 0, 0);
          const totalMs = dayEnd.getTime() - dayStart.getTime();

          // This day's own opening hours, which can be narrower than the
          // shared grid — anything outside them (or the whole day, if
          // closed) is shown but isn't bookable.
          const ownHours = hoursByDate?.[date];
          const ownStart = new Date(`${date}T00:00:00`);
          ownStart.setHours(ownHours?.startHour ?? dayStartHour, 0, 0, 0);
          const ownEnd = new Date(`${date}T00:00:00`);
          ownEnd.setHours(ownHours?.endHour ?? dayEndHour, 0, 0, 0);
          const isOpenAt = (t: Date) => !ownHours?.closed && t >= ownStart && t < ownEnd;

          const bookings = bookingsByDate[date] ?? [];
          const holds = holdsByDate?.[date] ?? [];

          const blocks = bookings
            .map((booking) => {
              const start = booking.startTime < dayStart ? dayStart : booking.startTime;
              const end = booking.endTime > dayEnd ? dayEnd : booking.endTime;
              if (start >= end) return null;
              const top = ((start.getTime() - dayStart.getTime()) / totalMs) * 100;
              const height = ((end.getTime() - start.getTime()) / totalMs) * 100;
              const isOwn = booking.userId === currentUserId;
              return { booking, top, height, isOwn };
            })
            .filter((b): b is NonNullable<typeof b> => b !== null);

          const heldBlocks = holds
            .filter((hold) => hold.userId !== currentUserId)
            .map((hold) => {
              const start = hold.startTime < dayStart ? dayStart : hold.startTime;
              const end = hold.endTime > dayEnd ? dayEnd : hold.endTime;
              if (start >= end) return null;
              const top = ((start.getTime() - dayStart.getTime()) / totalMs) * 100;
              const height = ((end.getTime() - start.getTime()) / totalMs) * 100;
              return { hold, top, height };
            })
            .filter((h): h is NonNullable<typeof h> => h !== null);

          return (
            <div
              key={date}
              className="relative min-w-[80px] border-l border-gray-400"
              style={{ gridRow: 2, height: totalHeightPx }}
            >
              {/* hour gridlines, with zebra striping to make each hour row easy to trace */}
              {Array.from({ length: hourCount }, (_, i) => i).map((i) => (
                <div
                  key={i}
                  className={`h-10 border-t first:border-t-0 ${
                    i % 2 === 1 ? "border-gray-400 bg-gray-50/70" : "border-gray-400"
                  }`}
                />
              ))}

              {/* underlying grid of step-aligned free-time buttons, beneath the booking blocks */}
              {onFreeClick && stepMinutes && stepCount > 0 && (
                <div className="absolute inset-0 z-0">
                  {Array.from({ length: stepCount }, (_, i) => i).map((i) => {
                    const top = (i / stepCount) * 100;
                    const height = 100 / stepCount;
                    const stepStart = new Date(dayStart.getTime() + i * stepMinutes * 60000);
                    const isPast = stepStart < new Date();
                    if (isPast || !isOpenAt(stepStart)) {
                      return (
                        <div
                          key={i}
                          title={isPast ? t("bookingStatus.pastTooltip") : t("roomDetail.closedDay")}
                          style={{ top: `${top}%`, height: `${height}%` }}
                          className="absolute inset-x-0 bg-gray-300/80"
                        />
                      );
                    }
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onFreeClick(date, stepStart)}
                        title={t("bookingStatus.clickToBookTooltip", { time: formatTime(stepStart) })}
                        data-testid={`free-slot-${date}-${formatTime(stepStart)}`}
                        style={{ top: `${top}%`, height: `${height}%` }}
                        className="absolute inset-x-0 cursor-pointer touch-manipulation"
                      />
                    );
                  })}
                </div>
              )}

              {/* other users' active holds on otherwise-free time */}
              {heldBlocks.length > 0 && (
                <div className="absolute inset-0 z-[5]">
                  {heldBlocks.map(({ hold, top, height }) => (
                    <div
                      key={hold.id}
                      title={t("bookingStatus.someoneBookingTooltip")}
                      style={{
                        top: `${top}%`,
                        height: `${height}%`,
                        backgroundImage:
                          "repeating-linear-gradient(45deg, rgba(71,85,105,0.35) 0px, rgba(71,85,105,0.35) 6px, transparent 6px, transparent 12px)",
                      }}
                      className="absolute inset-x-0 bg-slate-300/50"
                    />
                  ))}
                </div>
              )}

              {/* booking blocks, absolutely positioned over the gridlines */}
              <div className="pointer-events-none absolute inset-0 z-10">
                {blocks.map(({ booking, top, height, isOwn }) => {
                  const status = getBookingConfirmationStatus(booking, settings);
                  const label = isOwn || isAdmin
                    ? booking.title
                    : status === "confirmed"
                      ? t("roomDetail.occupiedLabel")
                      : t("roomDetail.bookedLabel");
                  const commonProps = {
                    title: `${formatTime(booking.startTime)}–${formatTime(booking.endTime)} · ${
                      isOwn
                        ? `${booking.title} · ${t("bookingStatus.ownBookingTooltip")}`
                        : isAdmin
                          ? `${label} · ${booking.user.name}`
                          : label
                    }`,
                    style: { top: `${top}%`, height: `${height}%` },
                  };
                  const commonClassName = `pointer-events-auto absolute left-0.5 right-0.5 overflow-hidden rounded-sm px-1 py-0.5 text-left text-[11px] font-medium leading-tight ${
                    statusClassNames[status]
                  } ${isOwn ? "ring-2 ring-inset ring-kth-sky" : ""}`;

                  if (isOwn && onOwnBookingClick) {
                    return (
                      <button
                        key={booking.id}
                        {...commonProps}
                        type="button"
                        onClick={() => onOwnBookingClick(date, booking)}
                        className={`${commonClassName} cursor-pointer touch-manipulation hover:brightness-95`}
                      >
                        <span className="block break-words">
                          {formatTime(booking.startTime)}–{formatTime(booking.endTime)}
                        </span>
                        <span className="block break-words">{label}</span>
                      </button>
                    );
                  }

                  return (
                    <div key={booking.id} {...commonProps} className={commonClassName}>
                      <span className="block break-words">
                        {formatTime(booking.startTime)}–{formatTime(booking.endTime)}
                      </span>
                      <span className="block break-words">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
