/*
  Warnings:

  - You are about to drop the column `StaffID` on the `Client_PersonalInformation` table. All the data in the column will be lost.
  - You are about to drop the column `governStaffID` on the `Client_PersonalInformation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Client_PersonalInformation" DROP CONSTRAINT "Client_PersonalInformation_StaffID_fkey";

-- DropForeignKey
ALTER TABLE "Client_PersonalInformation" DROP CONSTRAINT "Client_PersonalInformation_governStaffID_fkey";

-- AlterTable
ALTER TABLE "Client_PersonalInformation" DROP COLUMN "StaffID",
DROP COLUMN "governStaffID",
ADD COLUMN     "ClientHopelessMultiple" TEXT[];
