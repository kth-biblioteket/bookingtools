-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "stepMinutes" INTEGER NOT NULL DEFAULT 60,
    "minMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxMinutes" INTEGER NOT NULL DEFAULT 120,
    "updatedAt" DATETIME NOT NULL
);
