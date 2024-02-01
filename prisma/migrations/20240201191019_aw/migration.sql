/*
  Warnings:

  - Added the required column `IdentifyCode` to the `Client_PersonalInformation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client_PersonalInformation" ADD COLUMN     "IdentifyCode" TEXT NOT NULL;
