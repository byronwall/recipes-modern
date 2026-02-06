-- AlterTable
ALTER TABLE "KrogerPurchase" ADD COLUMN     "recipeId" INTEGER;

-- AddForeignKey
ALTER TABLE "KrogerPurchase" ADD CONSTRAINT "KrogerPurchase_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
