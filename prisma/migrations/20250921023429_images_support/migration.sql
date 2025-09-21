-- CreateEnum
CREATE TYPE "ImageRole" AS ENUM ('HERO', 'GALLERY', 'STEP', 'OTHER');

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sha256" TEXT,
    "blurhash" TEXT,
    "dominantColor" TEXT,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeImage" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "imageId" INTEGER NOT NULL,
    "role" "ImageRole" NOT NULL DEFAULT 'GALLERY',
    "order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "stepGroupId" INTEGER,
    "stepIndex" INTEGER,

    CONSTRAINT "RecipeImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_sha256_key" ON "Image"("sha256");

-- CreateIndex
CREATE INDEX "Image_bucket_key_idx" ON "Image"("bucket", "key");

-- CreateIndex
CREATE INDEX "RecipeImage_imageId_idx" ON "RecipeImage"("imageId");

-- CreateIndex
CREATE INDEX "RecipeImage_recipeId_role_order_idx" ON "RecipeImage"("recipeId", "role", "order");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeImage" ADD CONSTRAINT "RecipeImage_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeImage" ADD CONSTRAINT "RecipeImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeImage" ADD CONSTRAINT "RecipeImage_stepGroupId_fkey" FOREIGN KEY ("stepGroupId") REFERENCES "StepGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
