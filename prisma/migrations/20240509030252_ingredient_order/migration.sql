/*
  Warnings:

  - Added the required column `order` to the `IngredientGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IngredientGroup" ADD COLUMN     "order" INTEGER NOT NULL;
