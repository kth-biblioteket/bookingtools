import { getBookingConfirmationStatus, type BookingConfirmationStatus } from "@/lib/booking-status";
import type { ActiveHold } from "@/lib/booking-hold";
import type { BookingSettings } from "@/lib/settings";

export type TimelineBooking = {
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

export function RoomTimeline({
  bookings,
  holds,
  currentUserId,
  dateStr,
  dayStartHour,
  dayEndHour,
  stepMinutes,
  settings,
  onFreeClick,
  onOwnBookingClick,
}: {
  bookings: TimelineBooking[];
  /** Other users' active holds on this room, already filtered to this room. */
  holds?: ActiveHold[];
  currentUserId: string;
  dateStr: string;
  dayStartHour: number;
  dayEndHour: number;
  stepMinutes?: number;
  settings: BookingSettings;
  onFreeClick?: (startTime: Date) => void;
  onOwnBookingClick?: (booking: TimelineBooking) => void;
}) {
  const dayStart = new Date(`${dateStr}T00:00:00`);
  dayStart.setHours(dayStartHour, 0, 0, 0);
  const dayEnd = new Date(`${dateStr}T00:00:00`);
  dayEnd.setHours(dayEndHour, 0, 0, 0);
  const totalMs = dayEnd.getTime() - dayStart.getTime();
  const hourCount = dayEndHour - dayStartHour;

  const totalMinutes = hourCount * 60;
  const stepCount = stepMinutes ? Math.round(totalMinutes / stepMinutes) : 0;

  const blocks = bookings
    .map((booking) => {
      const start = booking.startTime < dayStart ? dayStart : booking.startTime;
      const end = booking.endTime > dayEnd ? dayEnd : booking.endTime;
      if (start >= end) return null;
      const left = ((start.getTime() - dayStart.getTime()) / totalMs) * 100;
      const width = ((end.getTime() - start.getTime()) / totalMs) * 100;
      const isOwn = booking.userId === currentUserId;
      return { booking, left, width, isOwn };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  // Other users' active holds on otherwise-free time — advisory only, but
  // shown so a second person doesn't start filling in the same slot.
  const heldBlocks = (holds ?? [])
    .filter((hold) => hold.userId !== currentUserId)
    .map((hold) => {
      const start = hold.startTime < dayStart ? dayStart : hold.startTime;
      const end = hold.endTime > dayEnd ? dayEnd : hold.endTime;
      if (start >= end) return null;
      const left = ((start.getTime() - dayStart.getTime()) / totalMs) * 100;
      const width = ((end.getTime() - start.getTime()) / totalMs) * 100;
      return { hold, left, width };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null);

  return (
    <div className="relative h-10 w-full overflow-hidden rounded-md border border-gray-200 bg-green-50">
      {Array.from({ length: hourCount + 1 }, (_, i) => i).map((i) => {
        const left = (i / hourCount) * 100;
        const isHourMark = (dayStartHour + i) % 2 === 0;
        return (
          <div
            key={i}
            className={`absolute inset-y-0 w-px ${isHourMark ? "bg-gray-300" : "bg-gray-200"}`}
            style={{ left: `${left}%` }}
          />
        );
      })}

      {onFreeClick && stepMinutes && stepCount > 0 &&
        Array.from({ length: stepCount }, (_, i) => i).map((i) => {
          const left = (i / stepCount) * 100;
          const width = 100 / stepCount;
          const stepStart = new Date(dayStart.getTime() + i * stepMinutes * 60000);
          const isPast = stepStart < new Date();
          if (isPast) {
            return (
              <div
                key={i}
                title="Har passerat"
                style={{ left: `${left}%`, width: `${width}%` }}
                className="absolute inset-y-0 z-0 bg-gray-200/70"
              />
            );
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => onFreeClick(stepStart)}
              title={`${formatTime(stepStart)} – klicka för att boka`}
              style={{ left: `${left}%`, width: `${width}%` }}
              className="absolute inset-y-0 z-0 cursor-pointer"
            />
          );
        })}

      {heldBlocks.map(({ hold, left, width }) => (
        <div
          key={hold.id}
          title="Någon bokar den här tiden just nu"
          style={{
            left: `${left}%`,
            width: `${width}%`,
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(71,85,105,0.35) 0px, rgba(71,85,105,0.35) 6px, transparent 6px, transparent 12px)",
          }}
          className="absolute inset-y-0 z-[5] bg-slate-300/50"
        />
      ))}

      {blocks.map(({ booking, left, width, isOwn }) => {
        const status = getBookingConfirmationStatus(booking, settings);
        const commonProps = {
          title: `${formatTime(booking.startTime)}–${formatTime(booking.endTime)} · ${booking.title} · ${
            isOwn ? "Din bokning" : booking.user.name
          }`,
          style: { left: `${left}%`, width: `${width}%` },
        };
        const commonClassName = `absolute top-0 z-10 flex h-full items-center overflow-hidden text-ellipsis whitespace-nowrap px-2 text-xs font-medium ${
          statusClassNames[status]
        } ${isOwn ? "ring-2 ring-inset ring-blue-500" : ""}`;

        if (isOwn && onOwnBookingClick) {
          return (
            <button
              key={booking.id}
              {...commonProps}
              type="button"
              onClick={() => onOwnBookingClick(booking)}
              className={`${commonClassName} cursor-pointer hover:brightness-95`}
            >
              {formatTime(booking.startTime)}–{formatTime(booking.endTime)} {booking.title}
            </button>
          );
        }

        return (
          <div key={booking.id} {...commonProps} className={commonClassName}>
            {formatTime(booking.startTime)}–{formatTime(booking.endTime)} {booking.title}
          </div>
        );
      })}
    </div>
  );
}
