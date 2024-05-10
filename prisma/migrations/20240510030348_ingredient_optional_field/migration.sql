-- AlterTable
ALTER TABLE "Ingredient" ALTER COLUMN "isGoodName" DROP NOT NULL,
ALTER COLUMN "isGoodName" SET DEFAULT false;
