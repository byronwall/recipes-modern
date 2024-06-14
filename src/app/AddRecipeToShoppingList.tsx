"use client";
import { Button } from "~/components/ui/button";
import { useShoppingListActions } from "./useShoppingListActions";
import { ShoppingBasket } from "lucide-react";

export function AddRecipeToShoppingList(props: { recipeId: number }) {
  const { recipeId } = props;

  const { addRecipeMutation } = useShoppingListActions();
  return (
    <Button
      onClick={async () => {
        await addRecipeMutation.mutateAsync({ recipeId });
      }}
      isLoading={addRecipeMutation.isPending}
      iconComponent={<ShoppingBasket />}
    >
      List
    </Button>
  );
}
