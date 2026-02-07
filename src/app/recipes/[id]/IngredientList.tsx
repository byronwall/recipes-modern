"use client";

import { useMemo } from "react";
import { H3, H4 } from "~/components/ui/typography";
import { type Recipe } from "./recipe-types";
import { IngredientPurchaseHistory } from "~/components/ingredients/IngredientPurchaseHistory";
import { api, type RouterOutputs } from "~/trpc/react";

type RecentPurchase =
  RouterOutputs["purchases"]["recentByIngredientIds"]["ingredientPurchases"][number]["purchases"][number];

export interface IngredientListProps {
  recipe: Recipe;
}
export function IngredientList({ recipe }: IngredientListProps) {
  const { data: ingredientsCatalog } = api.purchases.ingredientsCatalog.useQuery();

  const purchasesByIngredientName = useMemo(() => {
    const m = new Map<string, RecentPurchase[]>();
    for (const ingredient of ingredientsCatalog ?? []) {
      m.set(ingredient.ingredient.trim().toLowerCase(), ingredient.recentPurchases);
    }
    return m;
  }, [ingredientsCatalog]);

  const mainComp = (
    <ul>
      {recipe.ingredientGroups.map((ingredient, idx) => (
        <div key={ingredient.id ?? idx} className="space-y-1">
          <H4>{ingredient.title}</H4>
          {ingredient.ingredients.map((i) => {
            const purchaseHistory =
              purchasesByIngredientName.get(i.ingredient.trim().toLowerCase()) ??
              [];

            return (
              <div
                key={i.id ?? `${ingredient.id ?? idx}-${i.ingredient}`}
                className="flex items-center justify-between gap-3"
              >
                <label
                  className="flex min-w-0 flex-1 gap-1 break-words text-lg"
                  htmlFor={`ingredient-${i.id}`}
                >
                  {[i.amount, i.unit, i.ingredient, i.modifier]
                    .filter(Boolean)
                    .join(" ")}
                </label>
                <IngredientPurchaseHistory
                  purchases={purchaseHistory}
                  compact
                  hideEmpty
                  currentRecipeId={recipe.id}
                  ingredientId={i.id}
                  className="shrink-0"
                />
              </div>
            );
          })}
        </div>
      ))}
    </ul>
  );

  return (
    <>
      <H3 className="text-xl font-medium text-muted-foreground">ingredients</H3>
      {mainComp}
    </>
  );
}
