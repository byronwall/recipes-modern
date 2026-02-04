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
import { Label } from "~/components/ui/label";
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
          variant="secondary"
          icon={<Search className="h-4 w-4 shrink-0" />}
          label="Search Kroger"
        />
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-5xl shrink-0 overflow-y-auto p-0">
        <div className="flex flex-col gap-4 p-5">
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <Label className="text-xs uppercase text-muted-foreground">
                  Kroger search
                </Label>
                <p className="text-2xl font-semibold">
                  {ingredient ?? "Search products"}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                <Switch
                  checked={shouldMarkAsBought}
                  onCheckedChange={setShouldMarkAsBought}
                  id="shouldMarkAsBought"
                />
                <label
                  htmlFor="shouldMarkAsBought"
                  className="text-sm font-medium"
                >
                  Mark as bought after add
                </label>
              </div>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="flex max-w-3xl flex-col gap-2 rounded-2xl border bg-card/70 p-3 sm:flex-row sm:items-center">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchIngredient}
                  onChange={(e) => setSearchIngredient(e.target.value)}
                  placeholder="Search Kroger for..."
                  className="pl-9"
                />
              </div>
              <IconTextButton
                onClick={searchKroger}
                disabled={searchMutation.isPending}
                variant="secondary"
                icon={<Search className="h-4 w-4 shrink-0" />}
                label="Search"
                className="w-full sm:w-auto"
              />
            </div>
          </form>

          {searchMutation.isPending && (
            <p className="text-sm text-muted-foreground">Searching...</p>
          )}

          {searchMutation.error && (
            <p className="text-sm text-destructive">
              Error searching: {searchMutation.error.message}
            </p>
          )}

          {searchMutation.isSuccess && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground">No results found</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
