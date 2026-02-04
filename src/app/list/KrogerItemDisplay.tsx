"use client";

import { type KrogerProduct } from "../kroger/model";
import { cn } from "~/lib/utils";
import Link from "next/link";
import { formatMoney } from "./formatMoney";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { ShoppingCart } from "lucide-react";
import { IconTextButton } from "~/components/ui/icon-text-button";

type KrogerItemDisplayProps = {
  result: KrogerProduct;
  originalListItemId?: number;
  onCloseModal?: () => void;
};

export function KrogerItemDisplay({
  result,
  originalListItemId,
  onCloseModal,
}: KrogerItemDisplayProps) {
  const hasPromo = (result.items[0]?.price?.promo ?? 0) > 0;
  const displayPrice = hasPromo
    ? result.items[0]?.price?.promo
    : result.items[0]?.price?.regular;
  const regularPrice = result.items[0]?.price?.regular ?? undefined;
  const promoPrice = result.items[0]?.price?.promo ?? undefined;

  // search through images to get front one and thumbnail size
  const image =
    result.images.find((image) => image.perspective.includes("front")) ??
    result.images[0];

  const imageUrl =
    image?.sizes.find((c) => c.size === "medium")?.url ?? image?.sizes[0]?.url;

  const [quantity, setQuantity] = useState(1);

  const addToCartMutation = api.kroger.addToCart.useMutation();

  const handleAddToCart = async (upc: string) => {
    await addToCartMutation.mutateAsync({
      items: [
        {
          upc,
          quantity,
        },
      ],
      listItemId: originalListItemId,
      purchaseDetails: {
        sku: result.upc,
        productId: result.productId,
        name: result.description,
        brand: result.brand,
        categories: result.categories,
        itemId: result.items[0]?.itemId,
        soldBy: result.items[0]?.soldBy,
        priceRegular: regularPrice,
        pricePromo: promoPrice,
        price: displayPrice ?? 0,
        quantity,
        size: result.items[0]?.size ?? "",
        imageUrl: imageUrl ?? "",
      },
    });

    if (onCloseModal) {
      onCloseModal();
    }
  };

  return (
    <div
      key={result.productId}
      className="flex w-64 flex-col gap-2 rounded-2xl border bg-card/70 p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex gap-3">
        <Link
          href={"https://www.kroger.com/p/x/" + result.upc}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold leading-snug hover:underline"
        >
          <p>{result.description}</p>
        </Link>
        <img
          src={imageUrl}
          alt={result.description}
          className="h-20 w-20 rounded-lg object-cover"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", {
            "bg-yellow-300/80 text-black": hasPromo,
            "bg-accent/60 text-foreground": !hasPromo,
          })}
        >
          {formatMoney(displayPrice)}
        </span>

        {hasPromo && (
          <span className="text-xs text-muted-foreground line-through">
            {formatMoney(result.items[0]?.price?.regular)}
          </span>
        )}

        <span className="rounded-full bg-accent/60 px-2 py-0.5 text-xs">
          {result.items[0]?.size}
        </span>
      </div>

      <div className="flex w-full items-center gap-2 rounded-xl bg-background/80 p-2">
        <Input
          type="number"
          value={quantity}
          min={1}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          className="h-9 w-14"
        />

        <IconTextButton
          onClick={() => handleAddToCart(result.upc)}
          disabled={addToCartMutation.isPending}
          variant="secondary"
          size="sm"
          icon={<ShoppingCart className="h-4 w-4 shrink-0" />}
          label="Add to cart"
          className="w-full justify-center"
        />
      </div>
    </div>
  );
}
