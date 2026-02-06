"use client";

import { IngredientPurchaseHistory } from "~/components/ingredients/IngredientPurchaseHistory";
import { Label } from "~/components/ui/label";
import { type Recipe } from "./recipe-types";
import { api } from "~/trpc/react";

function ingredientLabel(ingredient: {
  amount: string;
  unit: string;
  ingredient: string;
  modifier: string;
}) {
  return [
    ingredient.amount,
    ingredient.unit,
    ingredient.ingredient,
    ingredient.modifier,
  ]
    .filter(Boolean)
    .join(" ");
}

export function RecipeRecentPurchasesSection(props: { recipe: Recipe }) {
  const { recipe } = props;
  const ingredients = recipe.ingredientGroups.flatMap((group) =>
    group.ingredients.map((ingredient) => ({
      id: ingredient.id,
      label: ingredientLabel(ingredient),
    })),
  );
  const ingredientIds = ingredients.map((ingredient) => ingredient.id);

  const { data: recentByIngredient } = api.purchases.recentByIngredientIds.useQuery(
    { ingredientIds, limit: 3 },
    { enabled: ingredientIds.length > 0 },
  );

  const purchasesByIngredient = new Map(
    (recentByIngredient?.ingredientPurchases ?? []).map((entry) => [
      entry.ingredientId,
      entry.purchases,
    ]),
  );

  const ingredientsWithHistory = ingredients.filter((ingredient) => {
    const purchases = purchasesByIngredient.get(ingredient.id) ?? [];
    return purchases.length > 0;
  });

  return (
    <section className="rounded-2xl border bg-card/70 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs uppercase text-muted-foreground">
          Recent purchases
        </Label>
        <span className="text-xs text-muted-foreground">
          {ingredientsWithHistory.length} ingredients with history
        </span>
      </div>

      {ingredientsWithHistory.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No purchases yet for this recipe.
        </p>
      ) : (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {ingredientsWithHistory.map((ingredient) => (
            <div
              key={ingredient.id}
              className="rounded-xl border bg-background/70 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{ingredient.label}</p>
                <IngredientPurchaseHistory
                  purchases={purchasesByIngredient.get(ingredient.id) ?? []}
                  currentRecipeId={recipe.id}
                  ingredientId={ingredient.id}
                  compact
                  hideEmpty
                  className="shrink-0"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
