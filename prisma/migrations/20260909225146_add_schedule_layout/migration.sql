-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "stepMinutes" INTEGER NOT NULL DEFAULT 60,
    "minMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxMinutes" INTEGER NOT NULL DEFAULT 120,
    "scheduleLayout" TEXT NOT NULL DEFAULT 'horizontal',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("id", "maxMinutes", "minMinutes", "stepMinutes", "updatedAt") SELECT "id", "maxMinutes", "minMinutes", "stepMinutes", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
