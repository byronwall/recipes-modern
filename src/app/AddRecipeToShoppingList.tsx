"use client";
import { Button } from "~/components/ui/button";
import { useShoppingListActions } from "./useShoppingListActions";
import { ShoppingBasket } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export function AddRecipeToShoppingList(props: {
  recipeId: number;
  display?: "icon" | "text";
  className?: string;
}) {
  const { recipeId, display = "icon", className } = props;

  const { addRecipeMutation } = useShoppingListActions();
  return display === "icon" ? (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
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
        </TooltipTrigger>
        <TooltipContent>Add to list</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <Button
      onClick={async () => {
        await addRecipeMutation.mutateAsync({ recipeId });
      }}
      isLoading={addRecipeMutation.isPending}
      variant="outline"
      className={className}
    >
      <ShoppingBasket className="h-4 w-4 shrink-0" />
      <span className="ml-1">List</span>
    </Button>
  );
}
