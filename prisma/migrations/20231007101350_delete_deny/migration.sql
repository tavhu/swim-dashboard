/*
  Warnings:

  - You are about to drop the column `deny` on the `RoleToResource` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoleToResource" (
    "roleID" TEXT NOT NULL,
    "resourceID" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,

    PRIMARY KEY ("roleID", "resourceID")
);
INSERT INTO "new_RoleToResource" ("granted", "resourceID", "roleID") SELECT "granted", "resourceID", "roleID" FROM "RoleToResource";
DROP TABLE "RoleToResource";
ALTER TABLE "new_RoleToResource" RENAME TO "RoleToResource";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
