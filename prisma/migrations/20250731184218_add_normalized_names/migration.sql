-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL DEFAULT '',
    "calories" REAL NOT NULL,
    "fat" REAL NOT NULL,
    "protein" REAL NOT NULL,
    "carbs" REAL NOT NULL
);
INSERT INTO "new_CustomIngredient" ("calories", "carbs", "fat", "id", "name", "protein") SELECT "calories", "carbs", "fat", "id", "name", "protein" FROM "CustomIngredient";
DROP TABLE "CustomIngredient";
ALTER TABLE "new_CustomIngredient" RENAME TO "CustomIngredient";
CREATE UNIQUE INDEX "CustomIngredient_name_key" ON "CustomIngredient"("name");
CREATE TABLE "new_ProductCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productName" TEXT NOT NULL,
    "normalizedProductName" TEXT NOT NULL DEFAULT '',
    "brand" TEXT,
    "imageUrl" TEXT,
    "calories" REAL,
    "fat" REAL,
    "protein" REAL,
    "carbs" REAL,
    "fullPayload" JSONB,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProductCache" ("brand", "calories", "carbs", "fat", "fullPayload", "id", "imageUrl", "productName", "protein", "updatedAt") SELECT "brand", "calories", "carbs", "fat", "fullPayload", "id", "imageUrl", "productName", "protein", "updatedAt" FROM "ProductCache";
DROP TABLE "ProductCache";
ALTER TABLE "new_ProductCache" RENAME TO "ProductCache";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
