/*
  Warnings:

  - You are about to drop the column `userOrgID` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ServiceCenter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameKH" TEXT NOT NULL,
    "nameEN" TEXT NOT NULL,
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
    "ProjectSummary" TEXT
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "serviceCenterID" TEXT NOT NULL,
    CONSTRAINT "Staff_serviceCenterID_fkey" FOREIGN KEY ("serviceCenterID") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstname" TEXT,
    "lastname" TEXT,
    "image" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "serviceCenterID" TEXT NOT NULL,
    CONSTRAINT "Client_serviceCenterID_fkey" FOREIGN KEY ("serviceCenterID") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstname" TEXT,
    "lastname" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "image" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "userRoleID" TEXT,
    "serviceCenterID" TEXT,
    CONSTRAINT "User_userRoleID_fkey" FOREIGN KEY ("userRoleID") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_serviceCenterID_fkey" FOREIGN KEY ("serviceCenterID") REFERENCES "ServiceCenter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("firstname", "id", "image", "lastname", "password", "status", "userRoleID", "username") SELECT "firstname", "id", "image", "lastname", "password", "status", "userRoleID", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Client_id_key" ON "Client"("id");
