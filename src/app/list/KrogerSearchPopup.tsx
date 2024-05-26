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
import { KrogerItemDisplay } from "./KrogerItemDisplay";
import { Search } from "lucide-react";

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

    // clear results
    setSearchResults([]);

    const results = await searchMutation.mutateAsync({
      query: searchIngredient,
    });

    setSearchResults(results);
  };

  async function searchOnOpen(isOpen: boolean) {
    if (!isOpen) return;

    if (ingredient) {
      await searchKroger();
    }
  }

  return (
    <Dialog onOpenChange={(isOpen) => searchOnOpen(isOpen)}>
      <DialogTrigger asChild>
        <Button>
          <Search />
          Search Kroger
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh]  max-w-4xl shrink-0  overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Kroger Search for <span className="underline">{ingredient}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="flex gap-2">
            <Input
              value={searchIngredient}
              onChange={(e) => setSearchIngredient(e.target.value)}
              placeholder="Search Kroger for..."
              className="text-xl"
            />
            <Button onClick={searchKroger} disabled={searchMutation.isPending}>
              <Search size={24} />
              Search
            </Button>
          </div>
        </form>

        {searchMutation.isPending && <p>Searching...</p>}

        {searchMutation.error && (
          <p>Error searching: {searchMutation.error.message}</p>
        )}

        {searchMutation.isSuccess && searchResults.length === 0 && (
          <p>No results found</p>
        )}

        <div className="grid-cols-auto-fit-260 grid gap-2">
          {searchResults.map((result) => (
            <KrogerItemDisplay key={result.productId} result={result} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
