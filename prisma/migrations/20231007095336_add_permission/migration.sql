/*
  Warnings:

  - Added the required column `deny` to the `RoleToResource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `granted` to the `RoleToResource` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoleToResource" (
    "roleID" TEXT NOT NULL,
    "resourceID" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "deny" BOOLEAN NOT NULL,

    PRIMARY KEY ("roleID", "resourceID")
);
INSERT INTO "new_RoleToResource" ("resourceID", "roleID") SELECT "resourceID", "roleID" FROM "RoleToResource";
DROP TABLE "RoleToResource";
ALTER TABLE "new_RoleToResource" RENAME TO "RoleToResource";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
