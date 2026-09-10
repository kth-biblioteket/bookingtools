import Link from "next/link";

type TimelineBooking = {
  id: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  user: { name: string };
};

type RoomWithBookings = {
  room: {
    id: string;
    name: string;
    building: string;
    campus: string;
  };
  bookings: TimelineBooking[];
};

function formatTime(date: Date) {
  return date.toTimeString().slice(0, 5);
}

export function ScheduleVertical({
  roomsWithBookings,
  currentUserId,
  dateStr,
  dayStartHour,
  dayEndHour,
}: {
  roomsWithBookings: RoomWithBookings[];
  currentUserId: string;
  dateStr: string;
  dayStartHour: number;
  dayEndHour: number;
}) {
  const dayStart = new Date(`${dateStr}T00:00:00`);
  dayStart.setHours(dayStartHour, 0, 0, 0);
  const dayEnd = new Date(`${dateStr}T00:00:00`);
  dayEnd.setHours(dayEndHour, 0, 0, 0);
  const totalMs = dayEnd.getTime() - dayStart.getTime();

  const hourCount = dayEndHour - dayStartHour;
  const hours = Array.from({ length: hourCount + 1 }, (_, i) => dayStartHour + i);
  const rowHeightPx = 64;
  const totalHeightPx = hourCount * rowHeightPx;

  const gridTemplateColumns = `4rem repeat(${roomsWithBookings.length}, minmax(140px, 1fr))`;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max" style={{ display: "grid", gridTemplateColumns }}>
        {/* Header row */}
        <div className="sticky left-0 z-20 bg-gray-50" />
        {roomsWithBookings.map(({ room }) => (
          <Link
            key={room.id}
            href={`/rooms/${room.id}?date=${dateStr}`}
            className="min-w-[140px] border-b border-gray-200 px-2 pb-2 text-center hover:bg-gray-50"
          >
            <p className="truncate text-sm font-medium text-gray-900">{room.name}</p>
            <p className="truncate text-xs text-gray-500">{room.building}</p>
          </Link>
        ))}

        {/* Hour label column — stays put when scrolling horizontally through many rooms */}
        <div
          className="sticky left-0 z-20 bg-gray-50"
          style={{ gridColumn: 1, gridRow: 2, height: totalHeightPx }}
        >
          {Array.from({ length: hourCount }, (_, i) => i).map((i) => (
            <div key={i} className={`h-16 ${i % 2 === 1 ? "bg-gray-50/70" : ""}`} />
          ))}
          {hours.map((hour, i) => (
            <span
              key={hour}
              className="absolute right-2 -translate-y-1/2 text-xs font-medium text-gray-500"
              style={{ top: `${(i / hourCount) * 100}%` }}
            >
              {String(hour).padStart(2, "0")}
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

          return (
            <div
              key={room.id}
              className="relative min-w-[140px] border-l border-gray-200"
              style={{ gridRow: 2, height: totalHeightPx }}
            >
              {/* hour gridlines, with zebra striping to make each hour row easy to trace */}
              {Array.from({ length: hourCount }, (_, i) => i).map((i) => (
                <div
                  key={i}
                  className={`h-16 border-t first:border-t-0 ${
                    i % 2 === 1 ? "border-gray-200 bg-gray-50/70" : "border-gray-200"
                  }`}
                />
              ))}

              {/* booking blocks, absolutely positioned over the gridlines */}
              <div className="absolute inset-0">
                {blocks.map(({ booking, top, height, isOwn }) => (
                  <div
                    key={booking.id}
                    title={`${formatTime(booking.startTime)}–${formatTime(booking.endTime)} · ${booking.title} · ${
                      isOwn ? "Din bokning" : booking.user.name
                    }`}
                    style={{ top: `${top}%`, height: `${height}%` }}
                    className={`absolute left-0.5 right-0.5 overflow-hidden rounded-sm px-1 py-0.5 text-[11px] font-medium leading-tight ${
                      isOwn ? "bg-blue-200 text-blue-900" : "bg-red-200 text-red-800"
                    }`}
                  >
                    <span className="block truncate">
                      {formatTime(booking.startTime)}–{formatTime(booking.endTime)}
                    </span>
                    <span className="block truncate">{booking.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
