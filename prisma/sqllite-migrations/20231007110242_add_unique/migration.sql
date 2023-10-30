/*
  Warnings:

  - The primary key for the `RoleToResource` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoleToResource" (
    "userID" TEXT NOT NULL,
    "roleID" TEXT NOT NULL,
    "resourceID" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,

    PRIMARY KEY ("roleID", "resourceID", "userID")
);
INSERT INTO "new_RoleToResource" ("granted", "resourceID", "roleID", "userID") SELECT "granted", "resourceID", "roleID", "userID" FROM "RoleToResource";
DROP TABLE "RoleToResource";
ALTER TABLE "new_RoleToResource" RENAME TO "RoleToResource";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
