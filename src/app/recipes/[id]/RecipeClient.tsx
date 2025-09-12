"use client";

import { H2 } from "~/components/ui/typography";
import { api, type RouterOutputs } from "~/trpc/react";
import { IngredientList } from "./IngredientList";
import { RecipeActions } from "./RecipeActions";
import { StepList } from "./StepList";
import { CookingModeOverlay } from "./CookingModeOverlay";

export type Recipe = NonNullable<RouterOutputs["recipe"]["getRecipe"]>;

export function RecipeClient(props: { id: number }) {
  const { id } = props;

  const { data: recipe } = api.recipe.getRecipe.useQuery({
    id,
  });

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  return (
    <div className="relative w-full space-y-2">
      <H2>{recipe.name}</H2>
      {recipe.description &&
      recipe.description.trim().toLowerCase() !== "desc" ? (
        <p className="max-w-prose text-muted-foreground">
          {recipe.description}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <RecipeActions recipeId={recipe.id} />
      </div>

      <IngredientList recipe={recipe} />

      <StepList recipe={recipe} />

      <CookingModeOverlay recipe={recipe} />
    </div>
  );
}
