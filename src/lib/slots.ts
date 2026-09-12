// Pure slot-generation logic, with no "server-only" import, so both server
// pages and client components (e.g. room-planner.tsx, which needs to
// recompute slots for whichever day of the week the user clicked) can use it.

export const SLOT_MINUTES = 30;

type OpeningHoursLike = { startHour: number; endHour: number; closed: boolean };

/** Fallback bounds when every day in the set is closed, so the grid still has
 * a sane, non-empty size to render. */
const FALLBACK_START_HOUR = 8;
const FALLBACK_END_HOUR = 20;

/** The widest [start, end) hour range spanning every open day in `days` —
 * used as the shared hour axis for a multi-day grid where each day can have
 * its own (narrower) opening hours. */
export function openingHoursGridBounds(days: OpeningHoursLike[]) {
  const open = days.filter((d) => !d.closed);
  if (open.length === 0) return { startHour: FALLBACK_START_HOUR, endHour: FALLBACK_END_HOUR };
  return {
    startHour: Math.min(...open.map((d) => d.startHour)),
    endHour: Math.max(...open.map((d) => d.endHour)),
  };
}

export function generateDaySlots(dateStr: string, dayStartHour: number, dayEndHour: number) {
  const slots: { start: Date; end: Date; label: string }[] = [];
  const totalSlots = ((dayEndHour - dayStartHour) * 60) / SLOT_MINUTES;
  for (let i = 0; i < totalSlots; i++) {
    const minutesFromStart = dayStartHour * 60 + i * SLOT_MINUTES;
    const start = new Date(`${dateStr}T00:00:00`);
    start.setMinutes(minutesFromStart);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + SLOT_MINUTES);
    const label = start.toTimeString().slice(0, 5);
    slots.push({ start, end, label });
  }
  return slots;
}
