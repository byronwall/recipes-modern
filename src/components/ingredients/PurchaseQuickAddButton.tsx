"use client";

import { ShoppingCart } from "lucide-react";
import { IconTextButton } from "~/components/ui/icon-text-button";
import { api, type RouterOutputs } from "~/trpc/react";

type RecentPurchase =
  RouterOutputs["purchases"]["recentByIngredientIds"]["ingredientPurchases"][number]["purchases"][number];

type Props = {
  purchase: RecentPurchase;
  ingredientId?: number;
  recipeId?: number;
  listItemId?: number;
  compact?: boolean;
};

export function PurchaseQuickAddButton(props: Props) {
  const { purchase, ingredientId, recipeId, listItemId, compact = false } = props;
  const utils = api.useUtils();
  const addToCart = api.kroger.addToCart.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.purchases.list.invalidate(),
        utils.purchases.recentByIngredientIds.invalidate(),
        utils.purchases.ingredientsCatalog.invalidate(),
        utils.shoppingList.getShoppingList.invalidate(),
      ]);
    },
  });

  return (
    <IconTextButton
      size="sm"
      variant="secondary"
      icon={<ShoppingCart className="h-3.5 w-3.5 shrink-0" />}
      label={addToCart.isPending ? "Adding..." : compact ? "Add" : "Add again"}
      disabled={addToCart.isPending}
      onClick={() =>
        addToCart.mutate({
          items: [{ upc: purchase.krogerSku, quantity: purchase.quantity }],
          listItemId,
          ingredientId,
          recipeId,
          purchaseDetails: {
            sku: purchase.krogerSku,
            productId: purchase.krogerProductId,
            name: purchase.krogerName,
            brand: purchase.krogerBrand ?? undefined,
            categories: purchase.krogerCategories,
            itemId: purchase.krogerItemId ?? undefined,
            soldBy: purchase.krogerSoldBy ?? undefined,
            priceRegular: purchase.krogerPriceRegular ?? undefined,
            pricePromo: purchase.krogerPricePromo ?? undefined,
            price: purchase.price,
            quantity: purchase.quantity,
            size: purchase.itemSize,
            imageUrl: purchase.imageUrl,
          },
        })
      }
      className={compact ? "h-7 px-2 text-xs" : "h-7 px-2.5 text-xs"}
    />
  );
}
