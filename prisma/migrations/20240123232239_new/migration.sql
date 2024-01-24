/*
  Warnings:

  - You are about to drop the `governStaffWorkingHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "governStaffWorkingHistory" DROP CONSTRAINT "governStaffWorkingHistory_governStaffID_fkey";

-- DropTable
DROP TABLE "governStaffWorkingHistory";

-- CreateTable
CREATE TABLE "governStaffWorkingHistoryPublic" (
    "id" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,
    "DateStartWorking" TIMESTAMP(3) NOT NULL,
    "DateStopWorking" TIMESTAMP(3) NOT NULL,
    "OgnisationName" TEXT NOT NULL,
    "Department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "SkillInPosition" TEXT NOT NULL,

    CONSTRAINT "governStaffWorkingHistoryPublic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governStaffWorkingHistoryPrivate" (
    "id" TEXT NOT NULL,
    "governStaffID" TEXT NOT NULL,
    "DateStartWorking" TIMESTAMP(3) NOT NULL,
    "DateStopWorking" TIMESTAMP(3) NOT NULL,
    "OgnisationName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "SkillInPosition" TEXT NOT NULL,

    CONSTRAINT "governStaffWorkingHistoryPrivate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "governStaffWorkingHistoryPublic" ADD CONSTRAINT "governStaffWorkingHistoryPublic_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governStaffWorkingHistoryPrivate" ADD CONSTRAINT "governStaffWorkingHistoryPrivate_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
