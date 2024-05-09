/*
  Warnings:

  - Added the required column `order` to the `StepGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StepGroup" ADD COLUMN     "order" INTEGER NOT NULL;
