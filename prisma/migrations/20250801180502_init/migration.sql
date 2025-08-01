/*
  Warnings:

  - You are about to drop the `ProductCache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `productCacheId` on the `RecipeIngredient` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductCache";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "brand" TEXT,
    "imageUrl" TEXT,
    "calories" REAL,
    "fat" REAL,
    "protein" REAL,
    "carbs" REAL,
    "fullPayload" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "calories" REAL NOT NULL,
    "fat" REAL NOT NULL,
    "protein" REAL NOT NULL,
    "carbs" REAL NOT NULL
);
INSERT INTO "new_CustomIngredient" ("calories", "carbs", "fat", "id", "name", "normalizedName", "protein") SELECT "calories", "carbs", "fat", "id", "name", "normalizedName", "protein" FROM "CustomIngredient";
DROP TABLE "CustomIngredient";
ALTER TABLE "new_CustomIngredient" RENAME TO "CustomIngredient";
CREATE UNIQUE INDEX "CustomIngredient_name_key" ON "CustomIngredient"("name");
CREATE TABLE "new_RecipeIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "productId" TEXT,
    "customIngredientId" TEXT,
    "quantity" REAL NOT NULL,
    CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_customIngredientId_fkey" FOREIGN KEY ("customIngredientId") REFERENCES "CustomIngredient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RecipeIngredient" ("customIngredientId", "id", "quantity", "recipeId") SELECT "customIngredientId", "id", "quantity", "recipeId" FROM "RecipeIngredient";
DROP TABLE "RecipeIngredient";
ALTER TABLE "new_RecipeIngredient" RENAME TO "RecipeIngredient";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
