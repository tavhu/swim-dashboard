/*
  Warnings:

  - You are about to drop the column `brithCity` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `FatherOccupation` on the `governStaff` table. All the data in the column will be lost.
  - You are about to drop the column `MotherOcupation` on the `governStaff` table. All the data in the column will be lost.
  - You are about to drop the column `fatherBrithAddress` on the `governStaff` table. All the data in the column will be lost.
  - You are about to drop the column `motherBrirthAddress` on the `governStaff` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "brithCity",
ADD COLUMN     "birthCity" TEXT,
ADD COLUMN     "birthCommune" TEXT,
ADD COLUMN     "birthVillage" TEXT,
ADD COLUMN     "currentCommune" TEXT,
ADD COLUMN     "currentVillage" TEXT,
ALTER COLUMN "birthAddress" DROP NOT NULL;

-- AlterTable
ALTER TABLE "governStaff" DROP COLUMN "FatherOccupation",
DROP COLUMN "MotherOcupation",
DROP COLUMN "fatherBrithAddress",
DROP COLUMN "motherBrirthAddress",
ADD COLUMN     "birthCity" TEXT,
ADD COLUMN     "birthCommune" TEXT,
ADD COLUMN     "birthDistrict" TEXT,
ADD COLUMN     "birthVillage" TEXT,
ADD COLUMN     "currentCity" TEXT,
ADD COLUMN     "currentCommune" TEXT,
ADD COLUMN     "currentDistrict" TEXT,
ADD COLUMN     "currentVillage" TEXT,
ADD COLUMN     "fatherBirthAddress" TEXT,
ADD COLUMN     "fatherOccupation" TEXT,
ADD COLUMN     "motherBirthAddress" TEXT,
ADD COLUMN     "motherOcupation" TEXT,
ADD COLUMN     "permanentCity" TEXT,
ADD COLUMN     "permanentCommune" TEXT,
ADD COLUMN     "permanentDistrict" TEXT,
ADD COLUMN     "permanentVillage" TEXT,
ALTER COLUMN "currentAddress" DROP NOT NULL,
ALTER COLUMN "permanentAddress" DROP NOT NULL;
