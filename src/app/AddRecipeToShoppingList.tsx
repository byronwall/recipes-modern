"use client";
import { Button } from "~/components/ui/button";
import { IconTextButton } from "~/components/ui/icon-text-button";
import { TooltipButton } from "~/components/ui/tooltip-button";
import { useShoppingListActions } from "./useShoppingListActions";
import { ShoppingBasket } from "lucide-react";

export function AddRecipeToShoppingList(props: {
  recipeId: number;
  display?: "icon" | "text";
  className?: string;
}) {
  const { recipeId, display = "icon", className } = props;

  const { addRecipeMutation } = useShoppingListActions();
  return display === "icon" ? (
    <TooltipButton content="Add to list">
      <Button
        onClick={async () => {
          await addRecipeMutation.mutateAsync({ recipeId });
        }}
        isLoading={addRecipeMutation.isPending}
        variant="outline"
        size="icon"
        aria-label="Add to list"
      >
        <ShoppingBasket className="h-4 w-4" />
      </Button>
    </TooltipButton>
  ) : (
    <IconTextButton
      onClick={async () => {
        await addRecipeMutation.mutateAsync({ recipeId });
      }}
      isLoading={addRecipeMutation.isPending}
      variant="outline"
      className={className}
      icon={<ShoppingBasket className="h-4 w-4" />}
      label="List"
    />
  );
}
