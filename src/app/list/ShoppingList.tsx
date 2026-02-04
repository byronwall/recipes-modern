"use client";

import type { ReactNode } from "react";

import { ShoppingListCard } from "./ShoppingListCard";
import { api } from "~/trpc/react";
import { ShoppingRecipeItem } from "./ShoppingRecipeItem";
import { useState } from "react";
import { Label } from "~/components/ui/label";
import { useRadioList } from "./useRadioList";

export const groupModes = ["recipe", "aisle"] as const;

export function ShoppingList(props: { actions?: ReactNode }) {
  const { actions } = props;
  const { data: _shoppingList } = api.shoppingList.getShoppingList.useQuery();

  const shoppingList = _shoppingList ?? [];

  // group by recipe name + ID
  const recipesIncluded = shoppingList.filter((item) => item.Recipe);

  // create a Record of recipe ID to name
  const recipeNameById: Record<number, string> = {};
  for (const item of recipesIncluded) {
    if (item.Recipe) {
      recipeNameById[item.Recipe.id] = item.Recipe.name;
    }
  }

  const { groupMode, radioGroupComp } = useRadioList(groupModes, "recipe");

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
        const key = aisleRaw ? aisleRaw.toLowerCase() : "Unknown Aisle";
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
            <p className="text-sm text-muted-foreground">
              No items added yet.
            </p>
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
