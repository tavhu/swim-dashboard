/*
  Warnings:

  - You are about to drop the column `commuteBA` on the `Client_PersonalInformation` table. All the data in the column will be lost.
  - Added the required column `communeBA` to the `Client_PersonalInformation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client_PersonalInformation" DROP COLUMN "commuteBA",
ADD COLUMN     "communeBA" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "nameKh" TEXT NOT NULL,
    "providingInstitution" TEXT,
    "purpose" TEXT,
    "legalBasis" TEXT,
    "eligibleClients" TEXT,
    "serviceStandard" TEXT,
    "requiredDocuments" TEXT,
    "feedback" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicesOnClients" (
    "clientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "ServicesOnClients_pkey" PRIMARY KEY ("clientId","serviceId")
);

-- CreateTable
CREATE TABLE "ServicesOnServiceCenters" (
    "serviceCenterId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "ServicesOnServiceCenters_pkey" PRIMARY KEY ("serviceCenterId","serviceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_nameKh_key" ON "services"("nameKh");

-- AddForeignKey
ALTER TABLE "ServicesOnClients" ADD CONSTRAINT "ServicesOnClients_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client_PersonalInformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicesOnClients" ADD CONSTRAINT "ServicesOnClients_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicesOnServiceCenters" ADD CONSTRAINT "ServicesOnServiceCenters_serviceCenterId_fkey" FOREIGN KEY ("serviceCenterId") REFERENCES "ServiceCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicesOnServiceCenters" ADD CONSTRAINT "ServicesOnServiceCenters_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
