/*
  Warnings:

  - You are about to drop the column `title` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Staff` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "title",
DROP COLUMN "type";
