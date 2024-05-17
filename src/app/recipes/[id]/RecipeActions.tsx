"use client";

import { Button } from "~/components/ui/button";
import { useRecipeActions } from "~/app/useRecipeActions";
import { AddRecipeToShoppingList } from "~/app/AddRecipeToShoppingList";
import { AddToMealPlanPopover } from "~/app/AddToMealPlanPopover";
import { useCookingMode } from "./useCookingMode";

export function RecipeActions(props: { recipeId: number }) {
  const { recipeId } = props;

  const { handleDelete } = useRecipeActions();

  const { cookingMode, toggleCookingMode, reset } = useCookingMode();

  return (
    <>
      {!cookingMode && (
        <>
          <Button
            onClick={async () => {
              await handleDelete(props.recipeId);
            }}
          >
            Delete
          </Button>

          <AddToMealPlanPopover recipeId={recipeId} />

          <AddRecipeToShoppingList recipeId={recipeId} />
        </>
      )}

      <Button onClick={toggleCookingMode}>
        {cookingMode ? "Exit cooking mode" : "Enter cooking mode"}
      </Button>

      {cookingMode && <Button onClick={reset}>Reset cooking mode</Button>}
    </>
  );
}
