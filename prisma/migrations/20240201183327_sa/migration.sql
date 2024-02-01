/*
  Warnings:

  - You are about to drop the column `DateTimeServed` on the `Client_PersonalInformation` table. All the data in the column will be lost.
  - You are about to drop the column `nameCenterorPrison` on the `Client_PersonalInformation` table. All the data in the column will be lost.
  - Added the required column `ClientFeelsHopless` to the `Client_PersonalInformation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `InterViewDate` to the `Client_PersonalInformation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `InterviewerID` to the `Client_PersonalInformation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `InterviewerisGovernStaff` to the `Client_PersonalInformation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client_PersonalInformation" DROP COLUMN "DateTimeServed",
DROP COLUMN "nameCenterorPrison",
ADD COLUMN     "ActivitiesThatClientLike" TEXT,
ADD COLUMN     "ClientFeelsHopless" BOOLEAN NOT NULL,
ADD COLUMN     "ClientHoplessDetails" TEXT,
ADD COLUMN     "ClientTalent" TEXT,
ADD COLUMN     "ConcernForClientFuture" TEXT,
ADD COLUMN     "DailyActivitiesInCenter" TEXT,
ADD COLUMN     "FuturePlanforClient" TEXT,
ADD COLUMN     "FuturePlanforClientDetails" TEXT,
ADD COLUMN     "HopeForClientFuture" TEXT,
ADD COLUMN     "InterViewDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "InterViewerSignature" TEXT,
ADD COLUMN     "InterviewerID" TEXT NOT NULL,
ADD COLUMN     "InterviewerOpinoin" TEXT,
ADD COLUMN     "InterviewerisGovernStaff" BOOLEAN NOT NULL,
ADD COLUMN     "RelationshipWithFriends" TEXT,
ADD COLUMN     "RelationshipWithOther" TEXT,
ADD COLUMN     "RelationshipWithStaff" TEXT,
ADD COLUMN     "RelationshipWithTeacher" TEXT,
ADD COLUMN     "StaffID" TEXT,
ADD COLUMN     "governStaffID" TEXT;

-- CreateTable
CREATE TABLE "ClientServeHistory" (
    "id" TEXT NOT NULL,
    "nameCenterorPrison" TEXT,
    "DateTimeServed" TIMESTAMP(3) NOT NULL,
    "Client_PersonalInformationID" TEXT NOT NULL,

    CONSTRAINT "ClientServeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientProgress" (
    "id" TEXT NOT NULL,
    "NoteDateTime" TIMESTAMP(3) NOT NULL,
    "Details" TEXT NOT NULL,
    "Client_PersonalInformationID" TEXT NOT NULL,

    CONSTRAINT "ClientProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientServeHistory_id_key" ON "ClientServeHistory"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProgress_id_key" ON "ClientProgress"("id");

-- AddForeignKey
ALTER TABLE "Client_PersonalInformation" ADD CONSTRAINT "Client_PersonalInformation_StaffID_fkey" FOREIGN KEY ("StaffID") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client_PersonalInformation" ADD CONSTRAINT "Client_PersonalInformation_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientServeHistory" ADD CONSTRAINT "ClientServeHistory_Client_PersonalInformationID_fkey" FOREIGN KEY ("Client_PersonalInformationID") REFERENCES "Client_PersonalInformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProgress" ADD CONSTRAINT "ClientProgress_Client_PersonalInformationID_fkey" FOREIGN KEY ("Client_PersonalInformationID") REFERENCES "Client_PersonalInformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
