"use client";

import { api } from "~/trpc/react";
import { IngredientList } from "./IngredientList";
import { StepList } from "./StepList";
import { CookingModeOverlay } from "./CookingModeOverlay";
import { RecipeHeader } from "./RecipeHeader";
import { RecipeImagesSection } from "./RecipeImagesSection";

export function RecipeClient(props: { id: number }) {
  const { id } = props;

  const { data: recipe } = api.recipe.getRecipe.useQuery({
    id,
  });

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  return (
    <div className="relative w-full space-y-6">
      <RecipeHeader recipe={recipe} />

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <section className="rounded-2xl border bg-card/70 p-6 shadow-sm">
          <IngredientList recipe={recipe} />
        </section>
        <section className="rounded-2xl border bg-card/70 p-6 shadow-sm">
          <StepList recipe={recipe} />
        </section>
      </div>

      <CookingModeOverlay recipe={recipe} />

      <RecipeImagesSection recipe={recipe} />
    </div>
  );
}
