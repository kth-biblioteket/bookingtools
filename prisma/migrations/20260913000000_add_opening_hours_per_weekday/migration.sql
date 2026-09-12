-- CreateTable
CREATE TABLE "OpeningHours" (
    "weekday" INTEGER NOT NULL,
    "startHour" INTEGER NOT NULL DEFAULT 8,
    "endHour" INTEGER NOT NULL DEFAULT 20,
    "closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OpeningHours_pkey" PRIMARY KEY ("weekday")
);

-- Seed one row per weekday (0 = Monday ... 6 = Sunday), carrying forward the
-- single dayStartHour/dayEndHour that used to apply to every day, before
-- those columns are dropped below.
INSERT INTO "OpeningHours" ("weekday", "startHour", "endHour", "closed")
SELECT weekday, "Settings"."dayStartHour", "Settings"."dayEndHour", false
FROM "Settings", generate_series(0, 6) AS weekday
WHERE "Settings"."id" = 'singleton';

-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "dayEndHour",
DROP COLUMN "dayStartHour";
