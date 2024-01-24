/*
  Warnings:

  - Added the required column `title` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Made the column `lastname` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `attachedFileInfomation` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthAddress` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateofbirth` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `familyAddress` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `familyEmail` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `familyPhoneNumber` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nationality` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `photo` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workingEXP` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "nameEN" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "sID" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "lastname" SET NOT NULL;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "attachedBackground" TEXT,
ADD COLUMN     "attachedContract" TEXT,
ADD COLUMN     "attachedFileInfomation" TEXT NOT NULL,
ADD COLUMN     "birthAddress" TEXT NOT NULL,
ADD COLUMN     "birthDistrict" TEXT,
ADD COLUMN     "brithCity" TEXT,
ADD COLUMN     "currentAddress" TEXT,
ADD COLUMN     "currentCity" TEXT,
ADD COLUMN     "currentDistrict" TEXT,
ADD COLUMN     "currentQualification" TEXT,
ADD COLUMN     "dateofbirth" TEXT NOT NULL,
ADD COLUMN     "familyAddress" TEXT NOT NULL,
ADD COLUMN     "familyEmail" TEXT NOT NULL,
ADD COLUMN     "familyPhoneNumber" TEXT NOT NULL,
ADD COLUMN     "nationality" TEXT NOT NULL,
ADD COLUMN     "passport" TEXT,
ADD COLUMN     "photo" TEXT NOT NULL,
ADD COLUMN     "sID" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "workingEXP" BOOLEAN NOT NULL,
ADD COLUMN     "workingEXPYes" TEXT,
ADD COLUMN     "workingPeroid" TEXT;

-- CreateTable
CREATE TABLE "governStaff" (
    "id" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "firstNameKH" TEXT NOT NULL,
    "lastNameKH" TEXT NOT NULL,
    "firstNameEN" TEXT NOT NULL,
    "lastNameEN" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "DateofBirth" TIMESTAMP(3) NOT NULL,
    "ethnicity" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "birthAddress" TEXT NOT NULL,
    "currentAddress" TEXT NOT NULL,
    "permanentAddress" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "officialID" TEXT NOT NULL,
    "CambodianSocialID" TEXT NOT NULL,
    "sIDValidStart" TIMESTAMP(3) NOT NULL,
    "sIDValidEnd" TIMESTAMP(3) NOT NULL,
    "physical" TEXT NOT NULL,
    "familyInfo" TEXT NOT NULL,
    "spouseNameKH" TEXT NOT NULL,
    "spuseNameEN" TEXT NOT NULL,
    "spouseDateOfBirth" TIMESTAMP(3) NOT NULL,
    "spouseSID" TEXT NOT NULL,
    "spouseBirthAddress" TEXT NOT NULL,
    "spouseCurrentOccupation" TEXT NOT NULL,
    "spouseOrganisationName" TEXT NOT NULL,
    "spuseCurrentAddress" TEXT NOT NULL,
    "fatherFullNameKH" TEXT NOT NULL,
    "FatherOccupation" TEXT NOT NULL,
    "fatherBrithAddress" TEXT NOT NULL,
    "MotherOcupation" TEXT NOT NULL,
    "motherFullNameKH" TEXT NOT NULL,
    "motherBrirthAddress" TEXT NOT NULL,
    "ECFirstNameKH" TEXT NOT NULL,
    "ECLastNameKH" TEXT NOT NULL,
    "ECGender" TEXT NOT NULL,
    "ECRelationshipAs" TEXT NOT NULL,
    "ECOccupation" TEXT NOT NULL,
    "ECAddress" TEXT NOT NULL,
    "ECTelehpone" TEXT NOT NULL,
    "DateStartOfficialWork" TIMESTAMP(3) NOT NULL,
    "DateWentFullTime" TIMESTAMP(3) NOT NULL,
    "CurrentRank" TEXT NOT NULL,
    "OfficialLevelKH" TEXT NOT NULL,
    "serviceCenterID" TEXT,

    CONSTRAINT "governStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governStaffChildren" (
    "id" TEXT NOT NULL,
    "fullnameKH" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dateofBirth" TIMESTAMP(3) NOT NULL,
    "occupation" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,

    CONSTRAINT "governStaffChildren_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governStaffQualifitcation" (
    "id" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,
    "couseLevel" TEXT NOT NULL,
    "SchoolName" TEXT NOT NULL,
    "SchoolLocation" TEXT NOT NULL,
    "CertificateLevel" TEXT NOT NULL,
    "majoring" TEXT NOT NULL,
    "StartDate" TIMESTAMP(3) NOT NULL,
    "finishDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "governStaffQualifitcation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governStaffLanuage" (
    "id" TEXT NOT NULL,
    "langName" TEXT NOT NULL,
    "read" TEXT NOT NULL,
    "conversation" TEXT NOT NULL,
    "writing" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,

    CONSTRAINT "governStaffLanuage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governStaffWorkingHistory" (
    "id" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,
    "PublicSector" BOOLEAN NOT NULL,
    "DateStartWorking" TIMESTAMP(3) NOT NULL,
    "DateStopWorking" TIMESTAMP(3) NOT NULL,
    "OgnisationName" TEXT NOT NULL,
    "Department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "SkillInPosition" TEXT NOT NULL,

    CONSTRAINT "governStaffWorkingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governStaffPositionHistory" (
    "id" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,
    "ValidDate" TIMESTAMP(3) NOT NULL,
    "MinistryName" TEXT NOT NULL,
    "Department" TEXT NOT NULL,
    "OfficialSection" TEXT NOT NULL,
    "oldOfficialLevel" TEXT NOT NULL,
    "newOffcialLevel" TEXT NOT NULL,
    "changeTo" TEXT NOT NULL,

    CONSTRAINT "governStaffPositionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governStaffCertificateLevelup" (
    "id" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,
    "validatDate" TIMESTAMP(3) NOT NULL,
    "SchoolName" TEXT NOT NULL,
    "PlaceStudy" TEXT NOT NULL,
    "ReceivedCertificate" TEXT NOT NULL,
    "OldPosition" TEXT NOT NULL,
    "NewPosition" TEXT NOT NULL,

    CONSTRAINT "governStaffCertificateLevelup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governStaffSituationOutsideOriginalOfficial" (
    "id" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "OginasationName" TEXT NOT NULL,
    "Position" TEXT NOT NULL,

    CONSTRAINT "governStaffSituationOutsideOriginalOfficial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernStaffFreeNoSalary" (
    "id" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "Oginisationname" TEXT NOT NULL,
    "NumberofMonthandYear" TEXT NOT NULL,

    CONSTRAINT "GovernStaffFreeNoSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernStaffLetterAppreciation" (
    "id" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,
    "letterNumber" TEXT NOT NULL,
    "OfficialDate" TIMESTAMP(3) NOT NULL,
    "RequestedOrginsation" TEXT NOT NULL,
    "LetterDetails" TEXT NOT NULL,
    "TypeReceived" TEXT NOT NULL,

    CONSTRAINT "GovernStaffLetterAppreciation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governStaffFineHistory" (
    "id" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,
    "letterNumber" TEXT NOT NULL,
    "OffialDate" TIMESTAMP(3) NOT NULL,
    "RequestedOrginsation" TEXT NOT NULL,
    "LetterDetails" TEXT NOT NULL,
    "TypeRecieved" TEXT NOT NULL,

    CONSTRAINT "governStaffFineHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientHistroy" (
    "id" TEXT NOT NULL,
    "noteDetails" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3) NOT NULL,
    "clientID" TEXT NOT NULL,

    CONSTRAINT "ClientHistroy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientHistroy_id_key" ON "ClientHistroy"("id");

-- AddForeignKey
ALTER TABLE "governStaff" ADD CONSTRAINT "governStaff_serviceCenterID_fkey" FOREIGN KEY ("serviceCenterID") REFERENCES "ServiceCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governStaffChildren" ADD CONSTRAINT "governStaffChildren_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governStaffQualifitcation" ADD CONSTRAINT "governStaffQualifitcation_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governStaffLanuage" ADD CONSTRAINT "governStaffLanuage_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governStaffWorkingHistory" ADD CONSTRAINT "governStaffWorkingHistory_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governStaffPositionHistory" ADD CONSTRAINT "governStaffPositionHistory_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governStaffCertificateLevelup" ADD CONSTRAINT "governStaffCertificateLevelup_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governStaffSituationOutsideOriginalOfficial" ADD CONSTRAINT "governStaffSituationOutsideOriginalOfficial_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernStaffFreeNoSalary" ADD CONSTRAINT "GovernStaffFreeNoSalary_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernStaffLetterAppreciation" ADD CONSTRAINT "GovernStaffLetterAppreciation_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governStaffFineHistory" ADD CONSTRAINT "governStaffFineHistory_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientHistroy" ADD CONSTRAINT "ClientHistroy_clientID_fkey" FOREIGN KEY ("clientID") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
