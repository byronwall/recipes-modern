/*
  Warnings:

  - You are about to drop the column `shoppingListId` on the `Ingredient` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_shoppingListId_fkey";

-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "shoppingListId";

-- AlterTable
ALTER TABLE "ShoppingList" ADD COLUMN     "ingredientId" INTEGER,
ADD COLUMN     "looseItem" TEXT,
ALTER COLUMN "isBought" DROP NOT NULL,
ALTER COLUMN "isBought" SET DEFAULT false,
ALTER COLUMN "recipeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
