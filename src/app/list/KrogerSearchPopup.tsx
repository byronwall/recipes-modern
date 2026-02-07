"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  MAX_KROGER_SEARCH_TERMS,
  getKrogerSearchTerms,
  normalizeKrogerSearchTerm,
} from "../kroger/searchQuery";
import { KrogerItemDisplay } from "./KrogerItemDisplay";
import { Search } from "lucide-react";
import { Switch } from "~/components/ui/switch";
import { IconTextButton } from "~/components/ui/icon-text-button";

type Props = {
  ingredient?: string;
  originalListItemId?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

export function KrogerSearchPopup({
  ingredient,
  originalListItemId,
  open,
  onOpenChange,
  hideTrigger = false,
}: Props) {
  const [searchIngredient, setSearchIngredient] = useState<string>(
    ingredient ?? "",
  );

  // this will determine if the original item is marked as bought
  const [shouldMarkAsBought, setShouldMarkAsBought] = useState(true);

  const [searchResults, setSearchResults] = useState<KrogerProduct[]>([]);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const lastAutoSearchKeyRef = useRef<string | null>(null);
  const previousModalOpenRef = useRef(false);
  const searchTerms = getKrogerSearchTerms(searchIngredient);
  const isSearchTruncated = searchTerms.length > MAX_KROGER_SEARCH_TERMS;
  const truncatedSearchIngredient = normalizeKrogerSearchTerm(searchIngredient);

  const searchMutation = api.kroger.searchProducts.useMutation();

  const searchKroger = useCallback(
    async (queryOverride?: string) => {
      const query = (queryOverride ?? searchIngredient).trim();
      if (!query) {
        return;
      }
      setLastSearchedQuery(query);

      // clear results
      setSearchResults([]);
      try {
        const results = await searchMutation.mutateAsync({
          query,
        });
        setSearchResults(results);
      } catch (_err) {
        // Error will be reflected in searchMutation.error and rendered below
      }
    },
    [searchIngredient, searchMutation],
  );

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === "boolean";
  const isModalOpen = isControlled ? open : internalOpen;

  const setModalOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  useEffect(() => {
    const wasModalOpen = previousModalOpenRef.current;

    if (!isModalOpen) {
      if (wasModalOpen) {
        setSearchIngredient(ingredient ?? "");
        setSearchResults([]);
        setLastSearchedQuery("");
        searchMutation.reset();
      }
      lastAutoSearchKeyRef.current = null;
      previousModalOpenRef.current = false;
      return;
    }

    if (!wasModalOpen) {
      setSearchIngredient(ingredient ?? "");
    }
    previousModalOpenRef.current = true;

    const query = ingredient?.trim();
    if (!query) return;

    const autoSearchKey = `${query.toLowerCase()}::${isControlled ? "controlled" : "internal"}`;
    if (lastAutoSearchKeyRef.current === autoSearchKey) return;

    lastAutoSearchKeyRef.current = autoSearchKey;
    void searchKroger(query);
  }, [ingredient, isControlled, isModalOpen, searchKroger, searchMutation]);

  return (
    <Dialog
      onOpenChange={async (isOpen) => {
        setModalOpen(isOpen);
      }}
      open={isModalOpen}
    >
      {!hideTrigger ? (
        <DialogTrigger asChild>
          <IconTextButton
            onClick={() => setModalOpen(true)}
            size="sm"
            variant="secondary"
            icon={<Search className="h-4 w-4 shrink-0" />}
            label="Search Kroger"
          />
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[85vh] max-w-5xl shrink-0 overflow-y-auto p-0">
        <div className="flex flex-col gap-4 p-5">
          <DialogHeader>
            <DialogTitle className="sr-only">Kroger search</DialogTitle>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void searchKroger();
                }}
                className="w-full md:max-w-3xl"
              >
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative w-full">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchIngredient}
                      onChange={(e) => setSearchIngredient(e.target.value)}
                      placeholder="Search Kroger for..."
                      className="h-14 rounded-2xl pl-12 text-2xl font-semibold"
                    />
                  </div>
                  <IconTextButton
                    onClick={() => void searchKroger()}
                    disabled={searchMutation.isPending}
                    variant="secondary"
                    icon={<Search className="h-5 w-5 shrink-0" />}
                    label="Search"
                    className="h-12 w-full rounded-xl px-4 text-base sm:w-auto"
                  />
                </div>
                {isSearchTruncated && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Warning: Kroger allows up to {MAX_KROGER_SEARCH_TERMS} words
                    per search. It will be truncated to{" "}
                    <span aria-hidden>&quot;</span>
                    <span className="font-medium text-foreground">
                      {truncatedSearchIngredient}
                    </span>
                    <span aria-hidden>&quot;</span>.
                  </p>
                )}
              </form>
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
            </div>
          </DialogHeader>

          {searchMutation.isPending && (
            <p className="text-sm text-muted-foreground">Searching...</p>
          )}

          {searchMutation.error && (
            <p className="text-sm text-destructive">
              Error searching: {searchMutation.error.message}
            </p>
          )}

          {searchMutation.isSuccess && searchResults.length === 0 && (
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm">
              <p className="font-medium">No Kroger results found</p>
              <p className="mt-1 text-muted-foreground">
                {lastSearchedQuery
                  ? `No matches for "${lastSearchedQuery}". Try another term.`
                  : "Try another search term."}
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {searchResults.map((result) => (
              <KrogerItemDisplay
                key={result.productId}
                result={result}
                originalListItemId={
                  shouldMarkAsBought ? originalListItemId : undefined
                }
                onCloseModal={() => setModalOpen(false)}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
