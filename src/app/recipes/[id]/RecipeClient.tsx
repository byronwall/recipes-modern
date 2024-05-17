"use client";

import { H2 } from "~/components/ui/typography";
import { RecipeActions } from "./RecipeActions";
import { type RouterOutputs, api } from "~/trpc/react";
import { IngredientList } from "./IngredientList";
import { StepList } from "./StepList";
import { TimerZone } from "./TimerZone";

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
    <div className="relative">
      <H2>{recipe.name}</H2>

      <div className="flex flex-wrap gap-2">
        <RecipeActions recipeId={recipe.id} />
      </div>

      <IngredientList recipe={recipe} />

      <StepList recipe={recipe} />

      <TimerZone />
    </div>
  );
}
