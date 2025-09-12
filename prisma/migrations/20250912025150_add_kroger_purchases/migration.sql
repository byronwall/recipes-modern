-- CreateTable
CREATE TABLE "KrogerPurchase" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "ingredientId" INTEGER,
    "krogerSku" TEXT NOT NULL,
    "krogerProductId" TEXT NOT NULL,
    "krogerName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "itemSize" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KrogerPurchase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KrogerPurchase" ADD CONSTRAINT "KrogerPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KrogerPurchase" ADD CONSTRAINT "KrogerPurchase_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
