/*
  Warnings:

  - You are about to drop the column `Lastname` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UserToRole" (
    "userID" TEXT NOT NULL,
    "roleID" TEXT NOT NULL,

    PRIMARY KEY ("userID", "roleID")
);

-- CreateTable
CREATE TABLE "RoleToResource" (
    "roleID" TEXT NOT NULL,
    "resourceID" TEXT NOT NULL,

    PRIMARY KEY ("roleID", "resourceID")
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstname" TEXT,
    "middlename" TEXT,
    "lastname" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "image" TEXT
);
INSERT INTO "new_User" ("firstname", "id", "image", "middlename", "password", "username") SELECT "firstname", "id", "image", "middlename", "password", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Resources_name_key" ON "Resources"("name");
