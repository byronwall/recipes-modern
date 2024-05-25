"use client";
import { Button } from "~/components/ui/button";
import { useShoppingListActions } from "./useShoppingListActions";
import { ShoppingBasket } from "lucide-react";

export function AddRecipeToShoppingList(props: { recipeId: number }) {
  const { recipeId } = props;

  const { handleAddRecipe } = useShoppingListActions();
  return (
    <Button
      onClick={async () => {
        await handleAddRecipe(recipeId);
      }}
    >
      <ShoppingBasket />
      List
    </Button>
  );
}
