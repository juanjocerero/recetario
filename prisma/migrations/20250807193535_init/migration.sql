-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "isNameManuallySet" BOOLEAN NOT NULL DEFAULT false,
    "brand" TEXT,
    "imageUrl" TEXT,
    "calories" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fullPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomIngredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CustomIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Recipe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecipeUrl" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "RecipeUrl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "productId" TEXT,
    "customIngredientId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_normalizedName_idx" ON "public"."Product"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "CustomIngredient_name_key" ON "public"."CustomIngredient"("name");

-- CreateIndex
CREATE INDEX "CustomIngredient_normalizedName_idx" ON "public"."CustomIngredient"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_slug_key" ON "public"."Recipe"("slug");

-- CreateIndex
CREATE INDEX "Recipe_normalizedTitle_idx" ON "public"."Recipe"("normalizedTitle");

-- CreateIndex
CREATE INDEX "Recipe_slug_idx" ON "public"."Recipe"("slug");

-- CreateIndex
CREATE INDEX "RecipeUrl_recipeId_idx" ON "public"."RecipeUrl"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeUrl_recipeId_url_key" ON "public"."RecipeUrl"("recipeId", "url");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "public"."RecipeIngredient"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_productId_idx" ON "public"."RecipeIngredient"("productId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_customIngredientId_idx" ON "public"."RecipeIngredient"("customIngredientId");

-- AddForeignKey
ALTER TABLE "public"."RecipeUrl" ADD CONSTRAINT "RecipeUrl_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_customIngredientId_fkey" FOREIGN KEY ("customIngredientId") REFERENCES "public"."CustomIngredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
