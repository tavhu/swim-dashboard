/*
  Warnings:

  - Added the required column `workingPeroidStart` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Staff" ALTER COLUMN "attachedFileInfomation" DROP NOT NULL,
DROP COLUMN "workingPeroidStart",
ADD COLUMN     "workingPeroidStart" TIMESTAMP(3) NOT NULL;
