/*
  Warnings:

  - You are about to drop the `GovernStaffFreeNoSalary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GovernStaffLetterAppreciation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GovernStaffFreeNoSalary" DROP CONSTRAINT "GovernStaffFreeNoSalary_governStaffID_fkey";

-- DropForeignKey
ALTER TABLE "GovernStaffLetterAppreciation" DROP CONSTRAINT "GovernStaffLetterAppreciation_governStaffID_fkey";

-- DropTable
DROP TABLE "GovernStaffFreeNoSalary";

-- DropTable
DROP TABLE "GovernStaffLetterAppreciation";

-- CreateTable
CREATE TABLE "governStaffFreeNoSalary" (
    "id" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "Oginisationname" TEXT NOT NULL,
    "NumberofMonthandYear" TEXT NOT NULL,

    CONSTRAINT "governStaffFreeNoSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governStaffLetterAppreciation" (
    "id" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,
    "letterNumber" TEXT NOT NULL,
    "OfficialDate" TIMESTAMP(3) NOT NULL,
    "RequestedOrginsation" TEXT NOT NULL,
    "LetterDetails" TEXT NOT NULL,
    "TypeReceived" TEXT NOT NULL,

    CONSTRAINT "governStaffLetterAppreciation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "governStaffFreeNoSalary" ADD CONSTRAINT "governStaffFreeNoSalary_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governStaffLetterAppreciation" ADD CONSTRAINT "governStaffLetterAppreciation_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
