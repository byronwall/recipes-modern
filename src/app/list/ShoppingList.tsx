"use client";

import type { ReactNode } from "react";

import { ShoppingListCard } from "./ShoppingListCard";
import { api } from "~/trpc/react";
import { ShoppingRecipeItem } from "./ShoppingRecipeItem";
import { useMemo, useState } from "react";
import { Label } from "~/components/ui/label";
import { useRadioList } from "./useRadioList";
import { IconTextButton } from "~/components/ui/icon-text-button";
import { Check, ClipboardCopy } from "lucide-react";
import { getIngredientLabel } from "./getIngredientLabel";
import { normalizeAisleName } from "~/lib/titleCase";
import { urlStateCodecs, useUrlState } from "~/hooks/use-url-state";

export const groupModes = ["recipe", "aisle"] as const;
const groupModeCodec = urlStateCodecs.enum(groupModes, "recipe");

export function ShoppingList(props: { actions?: ReactNode }) {
  const { actions } = props;
  const { data: _shoppingList } = api.shoppingList.getShoppingList.useQuery();
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
          : "Loose Items";
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
    {} as Record<string, typeof shoppingList>,
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

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border bg-card/70 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs uppercase text-muted-foreground">
            Recipes included
          </Label>
          <span className="text-xs text-muted-foreground">
            {recipeNames.length} recipes
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {recipeNames.length > 0 ? (
            recipeNames.map(([id, name]) => (
              <ShoppingRecipeItem key={id} id={id} name={name} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No recipes added yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-card/70 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">
              Actions
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              {actions}
              <IconTextButton
                type="button"
                variant="outline"
                disabled={!appleNotesListText}
                onClick={async () => {
                  await navigator.clipboard.writeText(appleNotesListText);
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
                label={copiedAppleNotesList ? "Copied" : "Copy for Notes"}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">
              Group mode
            </Label>
            {radioGroupComp}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card/70 p-3 shadow-sm">
        <div className="flex flex-col gap-3">
          {groupedKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items added yet.</p>
          ) : (
            groupedKeys.map((key) => {
              const items = groupedShoppingList[key]!;
              const isVisible = !hiddenKeys.includes(key);

              return (
                <div
                  key={key}
                  className="rounded-2xl border bg-background/70 p-2 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setHiddenKeys((keys) => {
                        if (keys.includes(key)) {
                          return keys.filter((k) => k !== key);
                        }
                        return [...keys, key];
                      })
                    }
                    className="-mx-1 flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left hover:bg-accent/40"
                  >
                    <span className="text-base font-semibold">{key}</span>
                    <span className="text-xs text-muted-foreground">
                      {items.length} items
                    </span>
                  </button>
                  {isVisible ? (
                    <div className="mt-2 flex flex-col gap-1.5">
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
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
