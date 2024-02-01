/*
  Warnings:

  - You are about to drop the column `email` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `workingPeroid` on the `Staff` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "email",
DROP COLUMN "workingPeroid",
ADD COLUMN     "workingContractAt" TEXT,
ADD COLUMN     "workingPeroidStart" TEXT;
