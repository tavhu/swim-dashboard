/*
  Warnings:

  - You are about to drop the column `HeadQuarterAddress` on the `ServiceCenter` table. All the data in the column will be lost.
  - You are about to drop the column `HeadQuarterCountry` on the `ServiceCenter` table. All the data in the column will be lost.
  - You are about to drop the column `HeadQuarterEmail` on the `ServiceCenter` table. All the data in the column will be lost.
  - You are about to drop the column `HeadQuarterPhoneNumber` on the `ServiceCenter` table. All the data in the column will be lost.
  - You are about to drop the column `HeadQuarterWebsite` on the `ServiceCenter` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceCenter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameKH" TEXT NOT NULL,
    "nameEN" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "directorName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "PoBox" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "locationMap" TEXT NOT NULL,
    "Address" TEXT,
    "overview" TEXT,
    "background" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "goal" TEXT,
    "ProjectSummary" TEXT,
    "status" BOOLEAN NOT NULL
);
INSERT INTO "new_ServiceCenter" ("Address", "PoBox", "ProjectSummary", "background", "createdAt", "directorName", "email", "goal", "id", "locationMap", "logo", "mission", "nameEN", "nameKH", "overview", "phoneNumber", "status", "type", "vision", "website") SELECT "Address", "PoBox", "ProjectSummary", "background", "createdAt", "directorName", "email", "goal", "id", "locationMap", "logo", "mission", "nameEN", "nameKH", "overview", "phoneNumber", "status", "type", "vision", "website" FROM "ServiceCenter";
DROP TABLE "ServiceCenter";
ALTER TABLE "new_ServiceCenter" RENAME TO "ServiceCenter";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
