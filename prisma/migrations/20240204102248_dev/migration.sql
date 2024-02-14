/*
  Warnings:

  - You are about to drop the column `ClientHopelessMultiple` on the `Client_PersonalInformation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client_PersonalInformation" DROP COLUMN "ClientHopelessMultiple";

-- CreateTable
CREATE TABLE "ClientHopelessMultiple" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "check" BOOLEAN NOT NULL,
    "client_PersonalInformationId" TEXT,

    CONSTRAINT "ClientHopelessMultiple_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientHopelessMultiple_id_key" ON "ClientHopelessMultiple"("id");

-- AddForeignKey
ALTER TABLE "ClientHopelessMultiple" ADD CONSTRAINT "ClientHopelessMultiple_client_PersonalInformationId_fkey" FOREIGN KEY ("client_PersonalInformationId") REFERENCES "Client_PersonalInformation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
