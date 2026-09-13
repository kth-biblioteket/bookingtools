-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isGroupAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oidcSubject" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_oidcSubject_key" ON "User"("oidcSubject");
