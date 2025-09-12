-- AlterTable
ALTER TABLE
    "KrogerPurchase"
ADD
    COLUMN "wasAddedToCart" BOOLEAN NOT NULL DEFAULT false,
ADD
    COLUMN "note" TEXT;
