-- Fas 2: introduce the Schedule model and scope Room, Settings,
-- OpeningHours, Booking, and BookingHold to it. Written by hand (not
-- straight from `prisma migrate dev`, which refuses to run non-interactively
-- for a required-column-without-default change) so the scheduleId backfill
-- can run in the same migration, without losing any existing data: the one
-- real schedule that exists today ("grupprum") gets a fixed, deterministic
-- id — not a cuid — so this migration is reproducible across environments.

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_slug_key" ON "Schedule"("slug");

-- Backfill: the only schedule that exists today, with a fixed id (not a
-- cuid) so every environment that runs this migration ends up with the
-- exact same row.
INSERT INTO "Schedule" ("id", "slug", "name", "isActive")
VALUES ('grupprum', 'grupprum', 'Grupprum', true);

-- AlterTable: add scheduleId nullable first, backfill, then enforce
-- NOT NULL — the standard safe sequence for a required column on a table
-- that already has rows.
ALTER TABLE "Room" ADD COLUMN "scheduleId" TEXT;
UPDATE "Room" SET "scheduleId" = 'grupprum';
ALTER TABLE "Room" ALTER COLUMN "scheduleId" SET NOT NULL;

ALTER TABLE "Settings" ADD COLUMN "scheduleId" TEXT;
UPDATE "Settings" SET "scheduleId" = 'grupprum';
ALTER TABLE "Settings" ALTER COLUMN "scheduleId" SET NOT NULL;
-- Settings.id used to be a fixed "singleton" string; it's now a regular
-- cuid-defaulted primary key, but the existing "singleton" row's id value
-- is left as-is (a valid, if no longer meaningfully-named, primary key).

ALTER TABLE "OpeningHours" ADD COLUMN "scheduleId" TEXT;
UPDATE "OpeningHours" SET "scheduleId" = 'grupprum';
ALTER TABLE "OpeningHours" ALTER COLUMN "scheduleId" SET NOT NULL;
-- OpeningHours' primary key moves from a bare weekday to (scheduleId,
-- weekday) — drop and recreate after the backfill above.
ALTER TABLE "OpeningHours" DROP CONSTRAINT "OpeningHours_pkey";
ALTER TABLE "OpeningHours" ADD CONSTRAINT "OpeningHours_pkey" PRIMARY KEY ("scheduleId", "weekday");

ALTER TABLE "Booking" ADD COLUMN "scheduleId" TEXT;
UPDATE "Booking" SET "scheduleId" = 'grupprum';
ALTER TABLE "Booking" ALTER COLUMN "scheduleId" SET NOT NULL;

ALTER TABLE "BookingHold" ADD COLUMN "scheduleId" TEXT;
UPDATE "BookingHold" SET "scheduleId" = 'grupprum';
ALTER TABLE "BookingHold" ALTER COLUMN "scheduleId" SET NOT NULL;

-- Replace the old (roomId, startTime, endTime) indexes with scheduleId
-- leading, matching the new query pattern (every read is scoped to a
-- schedule first).
DROP INDEX "Booking_roomId_startTime_endTime_idx";
CREATE INDEX "Booking_scheduleId_roomId_startTime_endTime_idx" ON "Booking"("scheduleId", "roomId", "startTime", "endTime");

DROP INDEX "BookingHold_roomId_startTime_endTime_idx";
CREATE INDEX "BookingHold_scheduleId_roomId_startTime_endTime_idx" ON "BookingHold"("scheduleId", "roomId", "startTime", "endTime");

CREATE INDEX "Room_scheduleId_idx" ON "Room"("scheduleId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpeningHours" ADD CONSTRAINT "OpeningHours_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingHold" ADD CONSTRAINT "BookingHold_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddUniqueConstraint
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_scheduleId_key" UNIQUE ("scheduleId");
