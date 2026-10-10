"use client";

import { useMemo } from "react";
import { formatAmount } from "~/lib/formatAmount";
import { EmptySectionState, SectionHeading } from "./SectionHeading";
import { type Recipe } from "./recipe-types";
import { IngredientPurchaseHistory } from "~/components/ingredients/IngredientPurchaseHistory";
import { api, type RouterOutputs } from "~/trpc/react";

type RecentPurchase =
  RouterOutputs["purchases"]["recentByIngredientIds"]["ingredientPurchases"][number]["purchases"][number];

export interface IngredientListProps {
  recipe: Recipe;
  onStartEditing: () => void;
}
export function IngredientList({
  recipe,
  onStartEditing,
}: IngredientListProps) {
  const { data: ingredientsCatalog } =
    api.purchases.ingredientsCatalog.useQuery();

  const purchasesByIngredientName = useMemo(() => {
    const m = new Map<string, RecentPurchase[]>();
    for (const ingredient of ingredientsCatalog ?? []) {
      m.set(
        ingredient.ingredient.trim().toLowerCase(),
        ingredient.recentPurchases,
      );
    }
    return m;
  }, [ingredientsCatalog]);

  const ingredientCount = recipe.ingredientGroups.reduce(
    (sum, group) => sum + group.ingredients.length,
    0,
  );

  const mainComp =
    ingredientCount === 0 ? (
      <EmptySectionState
        message="No ingredients yet."
        actionLabel="Add ingredients"
        onAction={onStartEditing}
      />
    ) : (
      <div className="space-y-4">
        {recipe.ingredientGroups.map((group, idx) =>
          group.ingredients.length === 0 ? null : (
            <div key={group.id ?? idx}>
              {group.title ? (
                <h4 className="mb-1 text-sm font-semibold">{group.title}</h4>
              ) : null}
              <ul className="divide-y divide-border/60">
                {group.ingredients.map((i) => {
                  const purchaseHistory =
                    purchasesByIngredientName.get(
                      i.ingredient.trim().toLowerCase(),
                    ) ?? [];
                  const quantity = [formatAmount(i.amount), i.unit]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <li
                      key={i.id ?? `${group.id ?? idx}-${i.ingredient}`}
                      className="flex items-center justify-between gap-3 py-1.5"
                    >
                      <span className="min-w-0 flex-1 break-words leading-snug">
                        {quantity ? (
                          <span className="font-semibold tabular-nums">
                            {quantity}{" "}
                          </span>
                        ) : null}
                        {i.ingredient}
                        {i.modifier ? (
                          <span className="text-muted-foreground">
                            , {i.modifier}
                          </span>
                        ) : null}
                      </span>
                      <IngredientPurchaseHistory
                        purchases={purchaseHistory}
                        compact
                        hideEmpty
                        currentRecipeId={recipe.id}
                        ingredientId={i.id}
                        className="shrink-0"
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ),
        )}
      </div>
    );

  return (
    <>
      <SectionHeading
        title="Ingredients"
        count={ingredientCount}
        onEdit={onStartEditing}
      />
      {mainComp}
    </>
  );
}
