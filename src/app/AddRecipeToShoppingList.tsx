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

export function AddRecipeToShoppingList(props: { recipeId: number }) {
  const { recipeId } = props;

  const { addRecipeMutation } = useShoppingListActions();
  return (
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
  );
}
