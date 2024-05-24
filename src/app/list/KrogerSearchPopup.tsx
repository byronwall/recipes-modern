"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { type KrogerProduct } from "../kroger/model";

type Props = {
  ingredient?: string;
};

export function KrogerSearchPopup({ ingredient }: Props) {
  const [searchIngredient, setSearchIngredient] = useState<string>(
    ingredient ?? "",
  );

  const [searchResults, setSearchResults] = useState<KrogerProduct[]>([]);

  useEffect(() => {
    setSearchIngredient(ingredient ?? "");
  }, [ingredient]);

  const searchMutation = api.kroger.searchProducts.useMutation();

  const searchKroger = async () => {
    if (!searchIngredient) {
      return;
    }

    const results = await searchMutation.mutateAsync({
      query: searchIngredient,
    });

    setSearchResults(results);
  };

  const addToCartMutation = api.kroger.addToCart.useMutation();

  const handleAddToCart = async (upc: string) => {
    await addToCartMutation.mutateAsync({
      items: [
        {
          upc,
          quantity: 1,
        },
      ],
    });
  };

  async function searchOnOpen(isOpen: boolean) {
    if (!isOpen) return;

    if (ingredient) {
      await searchKroger();
    }
  }

  return (
    <div>
      <Dialog onOpenChange={(isOpen) => searchOnOpen(isOpen)}>
        <DialogContent className="max-h-[80vh] w-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kroger Search for {ingredient}</DialogTitle>
          </DialogHeader>
          <h1>Kroger Search Popup</h1>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="flex gap-2">
              <Input
                value={searchIngredient}
                onChange={(e) => setSearchIngredient(e.target.value)}
              />
              <Button onClick={searchKroger}>Search</Button>
            </div>
          </form>
          <div className="grid grid-cols-4 gap-2">
            {searchResults.map((result) => (
              <div key={result.productId} className="border p-2">
                <p>{result.description}</p>
                <img
                  src={result.images[0]?.sizes[0]?.url}
                  alt={result.description}
                  className="w-24"
                />

                <Button onClick={() => handleAddToCart(result.upc)}>
                  cart
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogTrigger asChild>
          <Button>Search Kroger</Button>
        </DialogTrigger>
      </Dialog>
    </div>
  );
}
