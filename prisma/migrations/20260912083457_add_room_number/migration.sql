-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "roomNumber" INTEGER NOT NULL DEFAULT 0,
    "building" TEXT NOT NULL,
    "campus" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "floor" TEXT,
    "hasScreen" BOOLEAN NOT NULL DEFAULT false,
    "hasWhiteboard" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Room" ("building", "campus", "capacity", "floor", "hasScreen", "hasWhiteboard", "id", "name") SELECT "building", "campus", "capacity", "floor", "hasScreen", "hasWhiteboard", "id", "name" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
