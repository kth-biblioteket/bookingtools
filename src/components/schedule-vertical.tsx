import Link from "next/link";
import { getBookingConfirmationStatus, type BookingConfirmationStatus } from "@/lib/booking-status";
import type { ActiveHold } from "@/lib/booking-hold";
import type { BookingSettings } from "@/lib/settings";

type TimelineBooking = {
  id: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  confirmedAt: Date | null;
  user: { name: string };
};

type RoomWithBookings = {
  room: {
    id: string;
    name: string;
    building: string;
    campus: string;
    capacity: number;
    hasScreen: boolean;
  };
  bookings: TimelineBooking[];
};

function formatTime(date: Date) {
  return date.toTimeString().slice(0, 5);
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 shrink-0">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20a4 4 0 0 0-3-3.87M9 20H4v-1a4 4 0 0 1 4-4h1m5-3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm3 8v-1a4 4 0 0 1 4-4h1a4 4 0 0 1 4 4v1"
      />
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 shrink-0">
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M8 20h8M12 16v4" />
    </svg>
  );
}

const statusClassNames: Record<BookingConfirmationStatus, string> = {
  preliminary: "bg-yellow-200 text-yellow-900",
  needs_confirmation: "bg-orange-200 text-orange-900",
  confirmed: "bg-red-200 text-red-800",
};

export function ScheduleVertical({
  roomsWithBookings,
  currentUserId,
  dateStr,
  dayStartHour,
  dayEndHour,
  stepMinutes,
  settings,
  holds,
  onFreeClick,
  onOwnBookingClick,
}: {
  roomsWithBookings: RoomWithBookings[];
  currentUserId: string;
  dateStr: string;
  dayStartHour: number;
  dayEndHour: number;
  stepMinutes?: number;
  settings: BookingSettings;
  /** Other users' active holds across all rooms; filtered per room below. */
  holds?: ActiveHold[];
  onFreeClick?: (roomId: string, startTime: Date) => void;
  onOwnBookingClick?: (roomId: string, booking: TimelineBooking) => void;
}) {
  const dayStart = new Date(`${dateStr}T00:00:00`);
  dayStart.setHours(dayStartHour, 0, 0, 0);
  const dayEnd = new Date(`${dateStr}T00:00:00`);
  dayEnd.setHours(dayEndHour, 0, 0, 0);
  const totalMs = dayEnd.getTime() - dayStart.getTime();

  const hourCount = dayEndHour - dayStartHour;
  // One label per hour row, centered inside that row (not one per gridline).
  const hours = Array.from({ length: hourCount }, (_, i) => dayStartHour + i);
  const rowHeightPx = 40;
  const totalHeightPx = hourCount * rowHeightPx;

  const totalMinutes = hourCount * 60;
  const stepCount = stepMinutes ? Math.round(totalMinutes / stepMinutes) : 0;

  // Each room column shrinks to fit the available width (so all rooms stay
  // visible without scrolling) down to a minimum readable width; only below
  // that minimum does the wrapper's overflow-x-auto kick in and scroll.
  const gridTemplateColumns = `4rem repeat(${roomsWithBookings.length}, minmax(40px, 1fr))`;

  return (
    // pb-3: the last hour label (e.g. "20") is centered on the grid's bottom
    // edge via -translate-y-1/2, so half its line-height visually pokes out
    // below the grid's own box. That "ink overflow" from the transform was
    // enough to make this element's own overflow-x-auto pick up a phantom
    // vertical scrollbar (per the CSS spec, an element with overflow-x:auto
    // implicitly gets overflow-y:auto too) instead of the page just growing
    // to fit. This padding gives the label room without affecting any of the
    // hour-percentage math used to position bookings/holds inside.
    <div className="overflow-x-auto pb-3">
      <div className="min-w-max" style={{ display: "grid", gridTemplateColumns }}>
        {/* Header row */}
        {/* Corner cell: split diagonally — the half facing the room-name row
            (top-right) matches its kth-sky background and says "Rum"; the
            half facing the hour column (bottom-left) matches its kth-blue
            background and says "Tid". clip-path (not a gradient) guarantees
            the split runs exactly corner-to-corner regardless of this cell's
            actual width/height. */}
        <div className="sticky left-0 z-20 relative">
          <div
            className="absolute inset-0 bg-kth-sky"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
          />
          <div
            className="absolute inset-0 bg-kth-blue"
            style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }}
          />
          <span className="absolute right-1 top-0.5 text-[9px] font-medium text-white">Rum</span>
          <span className="absolute bottom-0.5 left-1 text-[9px] font-medium text-white">Tid</span>
        </div>
        {roomsWithBookings.map(({ room }) => (
          <Link
            key={room.id}
            href={`/rooms/${room.id}?date=${dateStr}`}
            className="min-w-[40px] border-b border-gray-200 bg-kth-sky px-1 pb-2 text-center hover:bg-kth-blue"
          >
            <p className="break-words text-lg font-medium text-white">{room.name}</p>
            <div className="mt-0.5 flex flex-col items-center gap-0.5 text-[10px] font-medium text-black">
              <span className="flex items-center gap-0.5" title={`Plats för ${room.capacity} personer`}>
                <UsersIcon />
                {room.capacity}
              </span>
              {room.hasScreen && (
                <span title="Har skärm">
                  <ScreenIcon />
                </span>
              )}
            </div>
          </Link>
        ))}

        {/* Hour label column — stays put when scrolling horizontally through many rooms */}
        <div
          className="sticky left-0 z-20 bg-kth-blue"
          style={{ gridColumn: 1, gridRow: 2, height: totalHeightPx }}
        >
          {Array.from({ length: hourCount }, (_, i) => i).map((i) => (
            <div key={i} className={`h-10 ${i % 2 === 1 ? "bg-white/10" : ""}`} />
          ))}
          {hours.map((hour, i) => (
            <span
              key={hour}
              className="absolute inset-x-0 -translate-y-1/2 text-center text-xs font-medium text-white"
              style={{ top: `${((i + 0.5) / hourCount) * 100}%` }}
            >
              {String(hour).padStart(2, "0")}:00
            </span>
          ))}
        </div>

        {/* Room columns */}
        {roomsWithBookings.map(({ room, bookings }) => {
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

          const heldBlocks = (holds ?? [])
            .filter((hold) => hold.roomId === room.id && hold.userId !== currentUserId)
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
              key={room.id}
              className="relative min-w-[40px] border-l border-gray-200"
              style={{ gridRow: 2, height: totalHeightPx }}
            >
              {/* hour gridlines, with zebra striping to make each hour row easy to trace */}
              {Array.from({ length: hourCount }, (_, i) => i).map((i) => (
                <div
                  key={i}
                  className={`h-10 border-t first:border-t-0 ${
                    i % 2 === 1 ? "border-gray-200 bg-gray-50/70" : "border-gray-200"
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
                    if (isPast) {
                      return (
                        <div
                          key={i}
                          title="Har passerat"
                          style={{ top: `${top}%`, height: `${height}%` }}
                          className="absolute inset-x-0 bg-gray-200/70"
                        />
                      );
                    }
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onFreeClick(room.id, stepStart)}
                        title={`${formatTime(stepStart)} – klicka för att boka`}
                        style={{ top: `${top}%`, height: `${height}%` }}
                        className="absolute inset-x-0 cursor-pointer"
                      />
                    );
                  })}
                </div>
              )}

              {/* other users' active holds on otherwise-free time — advisory
                  only, but shown (and left clickable-blocking) so a second
                  person doesn't start filling in the same slot. */}
              {heldBlocks.length > 0 && (
                <div className="absolute inset-0 z-[5]">
                  {heldBlocks.map(({ hold, top, height }) => (
                    <div
                      key={hold.id}
                      title="Någon bokar den här tiden just nu"
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

              {/* booking blocks, absolutely positioned over the gridlines. The wrapper
                  itself must ignore pointer events so clicks on the free-time grid
                  underneath still reach it; each block opts back in individually. */}
              <div className="pointer-events-none absolute inset-0 z-10">
                {blocks.map(({ booking, top, height, isOwn }) => {
                  const status = getBookingConfirmationStatus(booking, settings);
                  const commonProps = {
                    title: `${formatTime(booking.startTime)}–${formatTime(booking.endTime)} · ${booking.title} · ${
                      isOwn ? "Din bokning" : booking.user.name
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
                        onClick={() => onOwnBookingClick(room.id, booking)}
                        className={`${commonClassName} cursor-pointer hover:brightness-95`}
                      >
                        <span className="block break-words">
                          {formatTime(booking.startTime)}–{formatTime(booking.endTime)}
                        </span>
                        <span className="block break-words">{booking.title}</span>
                      </button>
                    );
                  }

                  return (
                    <div key={booking.id} {...commonProps} className={commonClassName}>
                      <span className="block break-words">
                        {formatTime(booking.startTime)}–{formatTime(booking.endTime)}
                      </span>
                      <span className="block break-words">{booking.title}</span>
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
