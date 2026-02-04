"use client";

import { useEffect, useState } from "react";
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
import { Switch } from "~/components/ui/switch";
import { IconTextButton } from "~/components/ui/icon-text-button";

type Props = {
  ingredient?: string;
  originalListItemId?: number;
};

export function KrogerSearchPopup({ ingredient, originalListItemId }: Props) {
  const [searchIngredient, setSearchIngredient] = useState<string>(
    ingredient ?? "",
  );

  // this will determine if the original item is marked as bought
  const [shouldMarkAsBought, setShouldMarkAsBought] = useState(true);

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
    try {
      const results = await searchMutation.mutateAsync({
        query: searchIngredient,
      });
      setSearchResults(results);
    } catch (_err) {
      // Error will be reflected in searchMutation.error and rendered below
    }
  };

  async function searchOnOpen(isOpen: boolean) {
    if (!isOpen) return;

    if (ingredient) {
      await searchKroger();
    }
  }

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Dialog
      onOpenChange={async (isOpen) => {
        setIsModalOpen(isOpen);
        await searchOnOpen(isOpen);
      }}
      open={isModalOpen}
    >
      <DialogTrigger asChild>
        <IconTextButton
          onClick={() => setIsModalOpen(true)}
          size="sm"
          icon={<Search className="h-4 w-4 shrink-0" />}
          label="Search Kroger"
        />
      </DialogTrigger>
      <DialogContent className="max-h-[80vh]  max-w-4xl shrink-0  overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-2xl">
            <p>
              Kroger Search for <span className="underline">{ingredient}</span>
            </p>
            <div className="flex items-center gap-2 text-lg">
              <Switch
                checked={shouldMarkAsBought}
                onCheckedChange={setShouldMarkAsBought}
                id="shouldMarkAsBought"
              />
              <label htmlFor="shouldMarkAsBought">
                Mark as bought after add
              </label>
            </div>
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
            <IconTextButton
              onClick={searchKroger}
              disabled={searchMutation.isPending}
              icon={<Search className="h-4 w-4 shrink-0" />}
              label="Search"
            />
          </div>
        </form>

        {searchMutation.isPending && <p>Searching...</p>}

        {searchMutation.error && (
          <p>Error searching: {searchMutation.error.message}</p>
        )}

        {searchMutation.isSuccess && searchResults.length === 0 && (
          <p>No results found</p>
        )}

        <div className="grid grid-cols-auto-fit-260 gap-2">
          {searchResults.map((result) => (
            <KrogerItemDisplay
              key={result.productId}
              result={result}
              originalListItemId={
                shouldMarkAsBought ? originalListItemId : undefined
              }
              onCloseModal={() => setIsModalOpen(false)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
