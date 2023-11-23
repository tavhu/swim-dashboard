/*
  Warnings:

  - Added the required column `read` to the `contactMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contactMessage" ADD COLUMN     "read" BOOLEAN NOT NULL;
