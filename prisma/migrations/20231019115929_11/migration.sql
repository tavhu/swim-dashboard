-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoleToResource" (
    "roleID" TEXT NOT NULL,
    "resourceID" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("roleID", "resourceID"),
    CONSTRAINT "RoleToResource_resourceID_fkey" FOREIGN KEY ("resourceID") REFERENCES "Resources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RoleToResource" ("granted", "read", "resourceID", "roleID") SELECT "granted", "read", "resourceID", "roleID" FROM "RoleToResource";
DROP TABLE "RoleToResource";
ALTER TABLE "new_RoleToResource" RENAME TO "RoleToResource";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
