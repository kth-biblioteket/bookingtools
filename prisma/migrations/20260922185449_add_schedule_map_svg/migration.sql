-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "mapSvg" TEXT;

-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "id" DROP DEFAULT;
