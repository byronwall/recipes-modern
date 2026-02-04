"use client";

import { RecipeActions } from "./RecipeActions";

export function RecipeActionsPanel(props: { recipeId: number }) {
  const { recipeId } = props;

  return (
    <div className="w-full max-w-xs border-l border-muted/60 pl-6 lg:ml-auto lg:self-start">
      <div className="text-xs uppercase text-muted-foreground">Actions</div>
      <div className="mt-3">
        <RecipeActions recipeId={recipeId} variant="full" />
      </div>
    </div>
  );
}
