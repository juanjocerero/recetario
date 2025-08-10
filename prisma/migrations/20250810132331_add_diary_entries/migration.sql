-- CreateTable
CREATE TABLE "public"."DiaryEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "ingredients" JSONB,
    "baseProductId" TEXT,
    "baseRecipeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiaryEntry_userId_idx" ON "public"."DiaryEntry"("userId");

-- CreateIndex
CREATE INDEX "DiaryEntry_date_idx" ON "public"."DiaryEntry"("date");

-- AddForeignKey
ALTER TABLE "public"."DiaryEntry" ADD CONSTRAINT "DiaryEntry_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiaryEntry" ADD CONSTRAINT "DiaryEntry_baseRecipeId_fkey" FOREIGN KEY ("baseRecipeId") REFERENCES "public"."Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
