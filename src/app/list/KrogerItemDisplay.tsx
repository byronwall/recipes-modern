"use client";

import { Button } from "~/components/ui/button";
import { type KrogerProduct } from "../kroger/model";
import { cn } from "~/lib/utils";
import Link from "next/link";
import { formatMoney } from "./formatMoney";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { ShoppingCart } from "lucide-react";
import { env } from "~/env";

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
    <div key={result.productId} className="flex w-64 flex-col gap-1 border p-2">
      <div className="flex gap-2">
        <Link
          href={"https://www.kroger.com/p/x/" + result.upc}
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          <p>{result.description}</p>
        </Link>
        <img
          src={imageUrl}
          alt={result.description}
          className="h-28 w-28 object-cover "
        />
      </div>
      <p className="flex items-center gap-4">
        <span
          className={cn("rounded-sm p-1 text-lg font-bold", {
            "bg-yellow-300 ": hasPromo,
          })}
        >
          {formatMoney(displayPrice)}
        </span>

        {hasPromo && (
          <span className="text-gray-500 line-through">
            {result.items[0]?.price?.regular}
          </span>
        )}

        <span className="border p-1">{result.items[0]?.size}</span>
      </p>

      <div className="flex w-full gap-2 bg-purple-50 p-2">
        <Input
          type="number"
          value={quantity}
          min={1}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          className="w-16"
        />

        <Button
          onClick={() => handleAddToCart(result.upc)}
          disabled={addToCartMutation.isPending}
        >
          <ShoppingCart size={20} />
          cart
        </Button>
      </div>
    </div>
  );
}
