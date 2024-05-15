/*
  Warnings:

  - Made the column `amount` on table `Ingredient` required. This step will fail if there are existing NULL values in that column.
  - Made the column `modifier` on table `Ingredient` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unit` on table `Ingredient` required. This step will fail if there are existing NULL values in that column.
  - Made the column `plu` on table `Ingredient` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Ingredient" ALTER COLUMN "amount" SET NOT NULL,
ALTER COLUMN "amount" SET DEFAULT '',
ALTER COLUMN "modifier" SET NOT NULL,
ALTER COLUMN "modifier" SET DEFAULT '',
ALTER COLUMN "unit" SET NOT NULL,
ALTER COLUMN "unit" SET DEFAULT '',
ALTER COLUMN "plu" SET NOT NULL,
ALTER COLUMN "plu" SET DEFAULT '';
