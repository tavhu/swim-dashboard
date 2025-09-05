/*
  Warnings:

  - You are about to drop the column `villageBA` on the `ServiceCenter` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ServiceCenter" DROP COLUMN "villageBA",
ADD COLUMN     "Village" TEXT;
