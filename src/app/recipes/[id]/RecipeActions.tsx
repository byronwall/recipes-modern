"use client";

import { Button } from "~/components/ui/button";
import { useRecipeActions } from "~/app/useRecipeActions";

export function RecipeActions(props: { recipeId: number }) {
  const { handleDelete } = useRecipeActions();
  return (
    <Button
      onClick={async () => {
        await handleDelete(props.recipeId);
      }}
    >
      Delete
    </Button>
  );
}
