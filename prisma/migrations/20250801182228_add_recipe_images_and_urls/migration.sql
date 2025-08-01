-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "RecipeUrl" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    CONSTRAINT "RecipeUrl_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RecipeUrl_recipeId_url_key" ON "RecipeUrl"("recipeId", "url");
