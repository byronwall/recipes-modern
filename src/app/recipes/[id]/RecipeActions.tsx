"use client";

import { ChefHat, Trash } from "lucide-react";
import { usePathname } from "next/navigation";
import { AddRecipeToShoppingList } from "~/app/AddRecipeToShoppingList";
import { AddToMealPlanPopover } from "~/app/AddToMealPlanPopover";
import { useRecipeActions } from "~/app/useRecipeActions";
import { Button } from "~/components/ui/button";
import { SimpleAlertDialog } from "~/components/SimpleAlertDialog";
import { useCookingMode } from "./useCookingMode";

export function RecipeActions(props: { recipeId: number }) {
  const { recipeId } = props;

  const { handleDelete } = useRecipeActions();

  const { cookingMode, toggleCookingMode } = useCookingMode();

  // show if url has /recipes
  const shouldShowCookingMode = usePathname().includes("/recipes");

  return (
    <>
      {!cookingMode && (
        <>
          <AddToMealPlanPopover recipeId={recipeId} />

          <AddRecipeToShoppingList recipeId={recipeId} />

          <SimpleAlertDialog
            trigger={
              <Button variant={"destructive-outline"} size={"icon"}>
                <Trash />
              </Button>
            }
            title={"Delete recipe?"}
            description={
              "This action cannot be undone. This will permanently delete the recipe."
            }
            confirmText={"Delete"}
            cancelText={"Cancel"}
            confirmVariant="destructive"
            onConfirm={async () => {
              await handleDelete(props.recipeId);
            }}
          />
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
        </>
      )}
    </>
  );
}
