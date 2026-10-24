-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "nickname" TEXT NOT NULL DEFAULT '匿名访客',
    "workId" TEXT,
    "ip" TEXT NOT NULL DEFAULT '',
    "ownerToken" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Comment" ("content", "createdAt", "id", "ip", "nickname", "workId") SELECT "content", "createdAt", "id", "ip", "nickname", "workId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
