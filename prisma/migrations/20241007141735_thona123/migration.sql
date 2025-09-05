/*
  Warnings:

  - You are about to drop the column `Communte` on the `ServiceCenter` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ServiceCenter" DROP COLUMN "Communte",
ADD COLUMN     "Commute" TEXT;
