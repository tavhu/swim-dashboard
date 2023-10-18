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
    "userOrgID" TEXT,
    CONSTRAINT "User_userRoleID_fkey" FOREIGN KEY ("userRoleID") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("firstname", "id", "image", "lastname", "password", "status", "userOrgID", "userRoleID", "username") SELECT "firstname", "id", "image", "lastname", "password", "status", "userOrgID", "userRoleID", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_userRoleID_key" ON "User"("userRoleID");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
