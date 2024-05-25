"use client";

import { usePathname } from "next/navigation";
import { AddRecipeToShoppingList } from "~/app/AddRecipeToShoppingList";
import { AddToMealPlanPopover } from "~/app/AddToMealPlanPopover";
import { useRecipeActions } from "~/app/useRecipeActions";
import { Button } from "~/components/ui/button";
import { useCookingMode } from "./useCookingMode";
import { Trash } from "lucide-react";

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
          <Button
            onClick={async () => {
              await handleDelete(props.recipeId);
            }}
            variant={"destructive"}
          >
            <Trash />
          </Button>

          <AddToMealPlanPopover recipeId={recipeId} />

          <AddRecipeToShoppingList recipeId={recipeId} />
        </>
      )}

      {shouldShowCookingMode && (
        <>
          <Button onClick={toggleCookingMode}>
            {cookingMode ? "Exit cooking mode" : "Enter cooking mode"}
          </Button>

          {cookingMode && <Button onClick={reset}>Reset cooking mode</Button>}
        </>
      )}
    </>
  );
}
