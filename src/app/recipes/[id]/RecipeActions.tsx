"use client";

import { ChefHat, Sparkles, Trash } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AddRecipeToShoppingList } from "~/app/AddRecipeToShoppingList";
import { AddToMealPlanPopover } from "~/app/AddToMealPlanPopover";
import { useRecipeActions } from "~/app/useRecipeActions";
import { Button } from "~/components/ui/button";
import { SimpleAlertDialog } from "~/components/SimpleAlertDialog";
import { useCookingMode } from "./useCookingMode";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export function RecipeActions(props: { recipeId: number }) {
  const { recipeId } = props;

  const { handleDelete } = useRecipeActions();

  const { cookingMode, toggleCookingMode } = useCookingMode();

  // show if url has /recipes
  const shouldShowCookingMode = usePathname().includes("/recipes");

  return (
    <>
      {!cookingMode && (
        <TooltipProvider delayDuration={100}>
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <AddToMealPlanPopover recipeId={recipeId} />

              <AddRecipeToShoppingList recipeId={recipeId} />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/recipes/${recipeId}/touch-up`}>
                    <Button
                      variant={"secondary"}
                      size="icon"
                      aria-label="Touch up with AI"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Touch up with AI</TooltipContent>
              </Tooltip>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SimpleAlertDialog
                    trigger={
                      <Button
                        variant={"destructive-outline"}
                        size={"icon"}
                        aria-label="Delete recipe"
                      >
                        <Trash className="h-4 w-4" />
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
                </div>
              </TooltipTrigger>
              <TooltipContent>Delete recipe</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )}

      {shouldShowCookingMode && (
        <>
          {!cookingMode && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={toggleCookingMode}
                    size="icon"
                    aria-label="Enter cooking mode"
                  >
                    <ChefHat className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Enter cooking mode</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </>
      )}
    </>
  );
}
