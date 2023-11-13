/*
  Warnings:

  - Added the required column `deleted` to the `contactMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contactMessage" ADD COLUMN     "deleted" BOOLEAN NOT NULL;
