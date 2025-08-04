-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "isNameManuallySet" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_Product" ("brand", "calories", "carbs", "createdAt", "fat", "fullPayload", "id", "imageUrl", "name", "normalizedName", "protein", "updatedAt") SELECT "brand", "calories", "carbs", "createdAt", "fat", "fullPayload", "id", "imageUrl", "name", "normalizedName", "protein", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
