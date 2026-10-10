"use client";

import { RecipeActions } from "./RecipeActions";

export function RecipeActionsPanel(props: { recipeId: number }) {
  const { recipeId } = props;

  return (
    <div className="w-full border-t border-muted pt-4 lg:w-72 lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
      <RecipeActions recipeId={recipeId} variant="full" />
    </div>
  );
}
