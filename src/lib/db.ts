import { PrismaClient } from "@/generated/prisma/client";
import { notifyBookingsChanged } from "@/lib/booking-events";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const basePrisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

// Singular operations only ever succeed when they actually touched a row
// (e.g. update() on a missing id throws, it doesn't silently no-op), so
// those always represent a real change. The batch "Many" operations are
// different: deleteMany()/updateMany() succeed with `{ count: 0 }` when
// nothing matched their filter — which happens on almost every read, since
// releaseExpiredPreliminaryBookings() runs a deleteMany() on every page
// load "just in case". Notifying unconditionally there caused an infinite
// loop: an empty deleteMany still fired an SSE "changed" event, every
// connected tab (including the one that just loaded) called
// router.refresh(), which read bookings again, which ran another empty
// deleteMany, which notified again — forever. Only notify for batch
// operations when they actually changed at least one row.
const ALWAYS_CHANGES = new Set(["create", "createMany", "createManyAndReturn", "update", "upsert", "delete"]);
const CHANGES_IF_COUNT_POSITIVE = new Set(["updateMany", "updateManyAndReturn", "deleteMany"]);

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
        const changed =
          ALWAYS_CHANGES.has(operation) ||
          (CHANGES_IF_COUNT_POSITIVE.has(operation) &&
            typeof result === "object" &&
            result !== null &&
            "count" in result &&
            (result as { count: number }).count > 0);
        if (changed) {
          notifyBookingsChanged();
        }
        return result;
      },
    },
  },
});
