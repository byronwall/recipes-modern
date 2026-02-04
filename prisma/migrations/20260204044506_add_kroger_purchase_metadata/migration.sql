-- AlterTable
ALTER TABLE "KrogerPurchase" ADD COLUMN     "krogerBrand" TEXT,
ADD COLUMN     "krogerCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "krogerItemId" TEXT,
ADD COLUMN     "krogerPricePromo" DOUBLE PRECISION,
ADD COLUMN     "krogerPriceRegular" DOUBLE PRECISION,
ADD COLUMN     "krogerSoldBy" TEXT;
