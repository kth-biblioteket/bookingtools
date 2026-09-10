type TimelineBooking = {
  id: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  user: { name: string };
};

function formatTime(date: Date) {
  return date.toTimeString().slice(0, 5);
}

export function RoomTimeline({
  bookings,
  currentUserId,
  dateStr,
  dayStartHour,
  dayEndHour,
}: {
  bookings: TimelineBooking[];
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
      {blocks.map(({ booking, left, width, isOwn }) => (
        <div
          key={booking.id}
          title={`${formatTime(booking.startTime)}–${formatTime(booking.endTime)} · ${booking.title} · ${
            isOwn ? "Din bokning" : booking.user.name
          }`}
          style={{ left: `${left}%`, width: `${width}%` }}
          className={`absolute top-0 flex h-full items-center overflow-hidden text-ellipsis whitespace-nowrap px-2 text-xs font-medium ${
            isOwn ? "bg-blue-200 text-blue-900" : "bg-red-200 text-red-800"
          }`}
        >
          {formatTime(booking.startTime)}–{formatTime(booking.endTime)} {booking.title}
        </div>
      ))}
    </div>
  );
}
