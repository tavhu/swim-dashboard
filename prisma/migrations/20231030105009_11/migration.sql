/*
  Warnings:

  - Added the required column `status` to the `ServiceCenter` table without a default value. This is not possible if the table is not empty.

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
    "HeadQuarterPhoneNumber" TEXT NOT NULL,
    "HeadQuarterWebsite" TEXT NOT NULL,
    "HeadQuarterEmail" TEXT NOT NULL,
    "HeadQuarterAddress" TEXT NOT NULL,
    "HeadQuarterCountry" TEXT NOT NULL,
    "overview" TEXT,
    "background" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "goal" TEXT,
    "ProjectSummary" TEXT,
    "status" BOOLEAN NOT NULL
);
INSERT INTO "new_ServiceCenter" ("Address", "HeadQuarterAddress", "HeadQuarterCountry", "HeadQuarterEmail", "HeadQuarterPhoneNumber", "HeadQuarterWebsite", "PoBox", "ProjectSummary", "background", "directorName", "email", "goal", "id", "locationMap", "logo", "mission", "nameEN", "nameKH", "overview", "phoneNumber", "type", "vision", "website") SELECT "Address", "HeadQuarterAddress", "HeadQuarterCountry", "HeadQuarterEmail", "HeadQuarterPhoneNumber", "HeadQuarterWebsite", "PoBox", "ProjectSummary", "background", "directorName", "email", "goal", "id", "locationMap", "logo", "mission", "nameEN", "nameKH", "overview", "phoneNumber", "type", "vision", "website" FROM "ServiceCenter";
DROP TABLE "ServiceCenter";
ALTER TABLE "new_ServiceCenter" RENAME TO "ServiceCenter";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
