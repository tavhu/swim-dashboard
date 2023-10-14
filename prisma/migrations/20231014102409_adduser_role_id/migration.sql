/*
  Warnings:

  - You are about to drop the column `organisationID` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstname" TEXT,
    "middlename" TEXT,
    "lastname" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "image" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "userRoleID" TEXT,
    "userOrgID" TEXT
);
INSERT INTO "new_User" ("firstname", "id", "image", "lastname", "middlename", "password", "status", "username") SELECT "firstname", "id", "image", "lastname", "middlename", "password", "status", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
