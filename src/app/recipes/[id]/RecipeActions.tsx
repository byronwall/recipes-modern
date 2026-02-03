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

export function RecipeActions(props: {
  recipeId: number;
  variant?: "compact" | "full";
}) {
  const { recipeId, variant = "compact" } = props;

  const { handleDelete } = useRecipeActions();

  const { cookingMode, toggleCookingMode } = useCookingMode();

  // show if url has /recipes
  const shouldShowCookingMode = usePathname().includes("/recipes");
  const isCompact = variant === "compact";

  return (
    <>
      {!cookingMode &&
        (isCompact ? (
          <TooltipProvider delayDuration={100}>
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <AddToMealPlanPopover recipeId={recipeId} display="icon" />

                <AddRecipeToShoppingList recipeId={recipeId} display="icon" />

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
        ) : (
          <div className="flex w-full items-start justify-between gap-3">
            <div className="grid grid-cols-2 gap-2">
              <AddToMealPlanPopover
                recipeId={recipeId}
                display="text"
                className="w-full justify-start"
              />

              <AddRecipeToShoppingList
                recipeId={recipeId}
                display="text"
                className="w-full justify-start"
              />

              <Link href={`/recipes/${recipeId}/touch-up`}>
                <Button variant={"secondary"} className="w-full justify-start">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span className="ml-1">Touch up</span>
                </Button>
              </Link>

              {!cookingMode && (
                <Button
                  onClick={toggleCookingMode}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <ChefHat className="h-4 w-4 shrink-0" />
                  <span className="ml-1">Cook it</span>
                </Button>
              )}
            </div>

            <SimpleAlertDialog
              trigger={
                <Button
                  variant={"destructive-outline"}
                  size="icon"
                  className="shrink-0"
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
        ))}

      {shouldShowCookingMode && isCompact && !cookingMode && (
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
  );
}
