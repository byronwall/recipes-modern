"use client";

import { usePathname } from "next/navigation";
import { AddRecipeToShoppingList } from "~/app/AddRecipeToShoppingList";
import { AddToMealPlanPopover } from "~/app/AddToMealPlanPopover";
import { useRecipeActions } from "~/app/useRecipeActions";
import { Button } from "~/components/ui/button";
import { useCookingMode } from "./useCookingMode";
import { ChefHat, ListRestart, Trash, X } from "lucide-react";

export function RecipeActions(props: { recipeId: number }) {
  const { recipeId } = props;

  const { handleDelete } = useRecipeActions();

  const { cookingMode, toggleCookingMode, reset } = useCookingMode();

  // show if url has /recipes
  const shouldShowCookingMode = usePathname().includes("/recipes");

  return (
    <>
      {!cookingMode && (
        <>
          <AddToMealPlanPopover recipeId={recipeId} />

          <AddRecipeToShoppingList recipeId={recipeId} />

          <Button
            onClick={async () => {
              await handleDelete(props.recipeId);
            }}
            variant={"destructive-outline"}
          >
            <Trash />
            Delete
          </Button>
        </>
      )}

      {shouldShowCookingMode && (
        <>
          {!cookingMode && (
            <Button onClick={toggleCookingMode}>
              <ChefHat />
              Enter cooking mode
            </Button>
          )}

          {cookingMode && (
            <Button onClick={toggleCookingMode}>
              <X />
              Exit cooking mode
            </Button>
          )}

          {cookingMode && (
            <Button onClick={reset} variant="secondary">
              <ListRestart />
              Reset
            </Button>
          )}
        </>
      )}
    </>
  );
}
