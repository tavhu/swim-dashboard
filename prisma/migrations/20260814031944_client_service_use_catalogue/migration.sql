-- DropForeignKey
ALTER TABLE "clientServices" DROP CONSTRAINT "clientServices_followUpRehabilitationId_fkey";

-- DropForeignKey
ALTER TABLE "clientServices" DROP CONSTRAINT "clientServices_previousCenterId_fkey";

-- AlterTable
ALTER TABLE "clientServices" DROP COLUMN "followUpRehabilitationId",
DROP COLUMN "previousCenterId",
DROP COLUMN "totalTimes",
DROP COLUMN "usedServiceBefore",
ADD COLUMN     "followUpServiceId" TEXT,
ADD COLUMN     "serviceId" TEXT;

-- AddForeignKey
ALTER TABLE "clientServices" ADD CONSTRAINT "clientServices_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientServices" ADD CONSTRAINT "clientServices_followUpServiceId_fkey" FOREIGN KEY ("followUpServiceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

