"use client";
import { Button } from "~/components/ui/button";
import { useShoppingListActions } from "./useShoppingListActions";

export function AddRecipeToShoppingList(props: { recipeId: number }) {
  const { recipeId } = props;

  const { handleAddRecipe } = useShoppingListActions();
  return (
    <Button
      onClick={async () => {
        await handleAddRecipe(recipeId);
      }}
    >
      Add to shopping list
    </Button>
  );
}
