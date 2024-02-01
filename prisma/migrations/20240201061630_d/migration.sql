/*
  Warnings:

  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClientHistroy` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_serviceCenterID_fkey";

-- DropForeignKey
ALTER TABLE "ClientHistroy" DROP CONSTRAINT "ClientHistroy_clientID_fkey";

-- DropTable
DROP TABLE "Client";

-- DropTable
DROP TABLE "ClientHistroy";

-- CreateTable
CREATE TABLE "Client_PersonalInformation" (
    "id" TEXT NOT NULL,
    "fullNameKH" TEXT NOT NULL,
    "nickName" TEXT NOT NULL,
    "ReadableCode" TEXT NOT NULL,
    "Gender" TEXT NOT NULL,
    "DOB" TIMESTAMP(3),
    "POB" TEXT NOT NULL,
    "EducationLevel" TEXT,
    "Occupation" TEXT,
    "DateArrested" TEXT,
    "homeBA" TEXT NOT NULL,
    "StreetBA" TEXT NOT NULL,
    "villageBA" TEXT NOT NULL,
    "districtBA" TEXT NOT NULL,
    "commuteBA" TEXT NOT NULL,
    "cityProBA" TEXT NOT NULL,
    "FatherOrChaperoneName" TEXT,
    "FOCDOB" TIMESTAMP(3),
    "FOCMarried" TEXT,
    "FOCTelandAddress" TEXT,
    "MotherOrChaperoneName" TEXT,
    "MOCMarried" TEXT,
    "MOCDOB" TIMESTAMP(3),
    "MOCTelandAddress" TEXT,
    "OtherFamilyMembers" TEXT,
    "CloseFriend" TEXT,
    "ClientSendBy" TEXT NOT NULL,
    "ImportantChallenge" TEXT NOT NULL,
    "PastActivities" TEXT NOT NULL,
    "ReasonUseDrug" TEXT NOT NULL,
    "KnownLegalConsequence" BOOLEAN NOT NULL,
    "typeDrugUsed" TEXT NOT NULL,
    "DrugVolumeUsed" TEXT NOT NULL,
    "DrugRequecyUse" TEXT NOT NULL,
    "DrugDurationUse" TEXT NOT NULL,
    "LivingSituation" TEXT NOT NULL,
    "UsedtoRehab" BOOLEAN NOT NULL,
    "nameCenterorPrison" TEXT,
    "DateTimeServed" TIMESTAMP(3) NOT NULL,
    "HowManyTimeHaveServed" TEXT,
    "ReasonComingtoCenter" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "serviceCenterID" TEXT NOT NULL,

    CONSTRAINT "Client_PersonalInformation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_PersonalInformation_id_key" ON "Client_PersonalInformation"("id");

-- AddForeignKey
ALTER TABLE "Client_PersonalInformation" ADD CONSTRAINT "Client_PersonalInformation_serviceCenterID_fkey" FOREIGN KEY ("serviceCenterID") REFERENCES "ServiceCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
