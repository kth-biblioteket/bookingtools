import { PrismaClient } from "@/generated/prisma/client";
import { notifyBookingsChanged } from "@/lib/booking-events";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const basePrisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

const BOOKING_WRITE_OPERATIONS = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
  "delete",
  "deleteMany",
]);

/**
 * Wrap the Prisma client so ANY write to the Booking model — no matter which
 * function or code path performs it, now or in the future — automatically
 * notifies connected clients over SSE. This replaces having to remember to
 * call notifyBookingsChanged() by hand at every call site (a past gap: the
 * lazy release of expired unconfirmed bookings in releaseExpiredPreliminaryBookings()
 * didn't notify, since it was calling db.booking.deleteMany() directly
 * without going through the action layer where the manual calls lived).
 */
export const db = basePrisma.$extends({
  query: {
    booking: {
      async $allOperations({ operation, args, query }) {
        const result = await query(args);
        if (BOOKING_WRITE_OPERATIONS.has(operation)) {
          notifyBookingsChanged();
        }
        return result;
      },
    },
  },
});
