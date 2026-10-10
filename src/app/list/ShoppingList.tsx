"use client";

import { ShoppingListCard } from "./ShoppingListCard";
import { api } from "~/trpc/react";
import { ShoppingRecipeItem } from "./ShoppingRecipeItem";
import { useMemo, useState } from "react";
import { useRadioList } from "./useRadioList";
import { IconTextButton } from "~/components/ui/icon-text-button";
import { toast } from "sonner";
import { Check, ChevronDown, ClipboardCopy } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader";
import { cn } from "~/lib/utils";
import { ShoppingAddLooseForm, ShoppingListActions } from "./ShoppingAddLoose";
import { getIngredientLabel } from "./getIngredientLabel";
import { normalizeAisleName } from "~/lib/titleCase";
import { urlStateCodecs, useUrlState } from "~/hooks/use-url-state";

export const groupModes = ["recipe", "aisle"] as const;
const groupModeCodec = urlStateCodecs.enum(groupModes, "recipe");

export function ShoppingList() {
  const {
    data: _shoppingList,
    isLoading,
    error,
  } = api.shoppingList.getShoppingList.useQuery();
  const shoppingList = useMemo(() => _shoppingList ?? [], [_shoppingList]);
  const ingredientIds = useMemo(
    () =>
      Array.from(
        new Set(
          shoppingList
            .map((item) => item.ingredient?.id)
            .filter((id): id is number => typeof id === "number"),
        ),
      ),
    [shoppingList],
  );
  const { data: recentByIngredient } =
    api.purchases.recentByIngredientIds.useQuery(
      { ingredientIds, limit: 3 },
      { enabled: ingredientIds.length > 0 },
    );
  const purchasesByIngredient = useMemo(
    () =>
      new Map(
        (recentByIngredient?.ingredientPurchases ?? []).map((entry) => [
          entry.ingredientId,
          entry.purchases,
        ]),
      ),
    [recentByIngredient],
  );

  // group by recipe name + ID
  const recipesIncluded = shoppingList.filter((item) => item.Recipe);

  // create a Record of recipe ID to name
  const recipeNameById: Record<number, string> = {};
  for (const item of recipesIncluded) {
    if (item.Recipe) {
      recipeNameById[item.Recipe.id] = item.Recipe.name;
    }
  }

  const [groupMode, setGroupMode] = useUrlState("group", groupModeCodec);
  const { radioGroupComp } = useRadioList(
    groupModes,
    "recipe",
    groupMode,
    setGroupMode,
  );

  const groupedShoppingList = shoppingList.reduce(
    (acc, item) => {
      if (groupMode === "recipe") {
        const key = item.Recipe
          ? recipeNameById[item.Recipe.id]!
          : "Other items";
        if (acc[key] === undefined) {
          acc[key] = [];
        }
        acc[key]!.push(item);
      } else if (groupMode === "aisle") {
        const aisleRaw = item.ingredient?.aisle;
        const key = normalizeAisleName(aisleRaw) ?? "Unknown Aisle";
        if (acc[key] === undefined) {
          acc[key] = [];
        }
        acc[key]!.push(item);
      }
      return acc;
    },
    Object.create(null) as Record<string, typeof shoppingList>,
  );

  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);
  const [copiedAppleNotesList, setCopiedAppleNotesList] = useState(false);

  const groupedKeys = Object.keys(groupedShoppingList);
  groupedKeys.sort();

  const recipeNames = Object.entries(recipeNameById);

  // sort those names by the max of ingredient id
  recipeNames.sort((a, b) => {
    const aMax = shoppingList
      .filter((item) => item.Recipe?.id === +a[0])
      .reduce((acc, item) => Math.max(acc, item.id), 0);

    const bMax = shoppingList
      .filter((item) => item.Recipe?.id === +b[0])
      .reduce((acc, item) => Math.max(acc, item.id), 0);

    return aMax - bMax;
  });

  const appleNotesListText = useMemo(() => {
    const sortedItems = shoppingList
      .filter((item) => !item.isBought)
      .sort((a, b) => {
        const aAisle = a.ingredient?.aisle?.trim().toLowerCase();
        const bAisle = b.ingredient?.aisle?.trim().toLowerCase();
        const aAisleSort = aAisle ? aAisle : "zzzz";
        const bAisleSort = bAisle ? bAisle : "zzzz";
        const aisleCompare = aAisleSort.localeCompare(bAisleSort);
        if (aisleCompare !== 0) return aisleCompare;

        return getIngredientLabel(a).localeCompare(getIngredientLabel(b));
      });

    return sortedItems.map((item) => getIngredientLabel(item)).join("\n");
  }, [shoppingList]);

  const totalCount = shoppingList.length;
  const boughtCount = shoppingList.filter((item) => item.isBought).length;
  const remainingCount = totalCount - boughtCount;

  const copyButton = (
    <IconTextButton
      type="button"
      variant="outline"
      size="sm"
      disabled={!appleNotesListText}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(appleNotesListText);
        } catch {
          toast.error(
            "Could not copy the list. Check clipboard access and try again.",
          );
          return;
        }
        setCopiedAppleNotesList(true);
        window.setTimeout(() => setCopiedAppleNotesList(false), 1800);
      }}
      icon={
        copiedAppleNotesList ? (
          <Check className="h-4 w-4 shrink-0" />
        ) : (
          <ClipboardCopy className="h-4 w-4 shrink-0" />
        )
      }
      label={copiedAppleNotesList ? "Copied" : "Copy list"}
    />
  );

  if (isLoading)
    return (
      <p className="text-sm text-muted-foreground">Loading shopping list…</p>
    );
  if (error)
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load shopping list: {error.message}
      </p>
    );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Shopping list"
        description={
          totalCount === 0
            ? "Nothing on the list."
            : `${remainingCount} to buy${
                boughtCount ? ` · ${boughtCount} in cart` : ""
              }`
        }
        actions={
          <>
            {copyButton}
            {totalCount > 0 && (
              <ShoppingListActions hasBought={boughtCount > 0} />
            )}
          </>
        }
      />

      <section className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-3 shadow-sm sm:p-4">
        <ShoppingAddLooseForm />
        {recipeNames.length > 0 || totalCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-3">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                From recipes
              </span>
              {recipeNames.length > 0 ? (
                recipeNames.map(([id, name]) => (
                  <ShoppingRecipeItem key={id} id={id} name={name} />
                ))
              ) : (
                <span className="text-xs text-muted-foreground">None</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Group by
              </span>
              {radioGroupComp}
            </div>
          </div>
        ) : null}
      </section>

      {groupedKeys.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed px-6 py-12 text-center">
          <p className="font-medium">Your list is empty</p>
          <p className="text-sm text-muted-foreground">
            Add items above, or use “Add to list” on any recipe.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groupedKeys.map((key) => {
            const items = [...groupedShoppingList[key]!].sort(
              (a, b) =>
                Number(a.isBought ?? false) - Number(b.isBought ?? false),
            );
            const groupBought = items.filter((item) => item.isBought).length;
            const isVisible = !hiddenKeys.includes(key);

            return (
              <section
                key={key}
                className="rounded-2xl border bg-card/70 p-2 shadow-sm"
              >
                <button
                  type="button"
                  aria-expanded={isVisible}
                  onClick={() =>
                    setHiddenKeys((keys) => {
                      if (keys.includes(key)) {
                        return keys.filter((k) => k !== key);
                      }
                      return [...keys, key];
                    })
                  }
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-accent/40"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        !isVisible && "-rotate-90",
                      )}
                    />
                    <span className="truncate text-sm font-semibold">
                      {key}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {groupBought}/{items.length}
                  </span>
                </button>
                {isVisible ? (
                  <div className="mt-1 flex flex-col">
                    {items.map((item) => (
                      <ShoppingListCard
                        key={item.id}
                        item={item}
                        displayMode={
                          groupMode === "recipe" ? "recipe" : "aisle"
                        }
                        recentPurchases={
                          item.ingredient?.id
                            ? purchasesByIngredient.get(item.ingredient.id) ??
                              []
                            : []
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
