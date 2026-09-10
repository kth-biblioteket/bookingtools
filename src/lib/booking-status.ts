// Pure, framework-agnostic booking-confirmation-status logic — deliberately
// has NO "server-only" import (unlike lib/booking.ts) so client components
// (room-timeline.tsx, schedule-vertical.tsx, room-planner.tsx, etc.) can
// import it directly without pulling in database access.

export type BookingConfirmationStatus = "confirmed" | "preliminary" | "needs_confirmation";

export function getBookingConfirmationStatus(
  booking: { startTime: Date; confirmedAt: Date | null },
  settings: {
    requirePreliminaryConfirmation: boolean;
    confirmMinutesBefore: number;
    confirmMinutesAfter: number;
  },
  now: Date = new Date()
): BookingConfirmationStatus {
  if (!settings.requirePreliminaryConfirmation) return "confirmed";
  if (booking.confirmedAt) return "confirmed";

  const windowStart = new Date(
    booking.startTime.getTime() - settings.confirmMinutesBefore * 60000
  );
  if (now < windowStart) return "preliminary";
  return "needs_confirmation";
}
