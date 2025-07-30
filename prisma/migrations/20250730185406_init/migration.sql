-- CreateTable
CREATE TABLE "ProductCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productName" TEXT NOT NULL,
    "brand" TEXT,
    "imageUrl" TEXT,
    "calories" REAL,
    "fat" REAL,
    "protein" REAL,
    "carbs" REAL,
    "fullPayload" JSONB,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "calories" REAL NOT NULL,
    "fat" REAL NOT NULL,
    "protein" REAL NOT NULL,
    "carbs" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "steps" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "productCacheId" TEXT,
    "customIngredientId" TEXT,
    "quantity" REAL NOT NULL,
    CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_productCacheId_fkey" FOREIGN KEY ("productCacheId") REFERENCES "ProductCache" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_customIngredientId_fkey" FOREIGN KEY ("customIngredientId") REFERENCES "CustomIngredient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomIngredient_name_key" ON "CustomIngredient"("name");
