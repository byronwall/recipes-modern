"use client";

import { Button } from "~/components/ui/button";
import { useRecipeActions } from "~/app/useRecipeActions";
import { AddToMealPlanPopover } from "~/app/AddToMealPlanPopover";

export function RecipeActions(props: { recipeId: number }) {
  const { recipeId } = props;

  const { handleDelete } = useRecipeActions();
  return (
    <>
      <Button
        onClick={async () => {
          await handleDelete(props.recipeId);
        }}
      >
        Delete
      </Button>

      <AddToMealPlanPopover recipeId={recipeId} />
    </>
  );
}
