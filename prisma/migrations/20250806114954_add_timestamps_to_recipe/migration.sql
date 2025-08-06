/*
  Warnings:

  - Added the required column `updatedAt` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Recipe" ("id", "imageUrl", "normalizedTitle", "slug", "steps", "title") SELECT "id", "imageUrl", "normalizedTitle", "slug", "steps", "title" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
CREATE UNIQUE INDEX "Recipe_slug_key" ON "Recipe"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
