"use client";

import { ChefHat, Sparkles, Trash } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AddRecipeToShoppingList } from "~/app/AddRecipeToShoppingList";
import { AddToMealPlanPopover } from "~/app/AddToMealPlanPopover";
import { useRecipeActions } from "~/app/useRecipeActions";
import { Button } from "~/components/ui/button";
import { IconTextButton } from "~/components/ui/icon-text-button";
import { TooltipButton } from "~/components/ui/tooltip-button";
import { SimpleAlertDialog } from "~/components/SimpleAlertDialog";
import { useCookingMode } from "./useCookingMode";

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

  if (isCompact) {
    return (
      <RecipeActionsCompact
        recipeId={recipeId}
        cookingMode={cookingMode}
        shouldShowCookingMode={shouldShowCookingMode}
        toggleCookingMode={toggleCookingMode}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <RecipeActionsFull
      recipeId={recipeId}
      cookingMode={cookingMode}
      toggleCookingMode={toggleCookingMode}
      onDelete={handleDelete}
    />
  );
}

function RecipeActionsCompact(props: {
  recipeId: number;
  cookingMode: boolean;
  shouldShowCookingMode: boolean;
  toggleCookingMode: () => void;
  onDelete: (recipeId: number) => Promise<void>;
}) {
  const { recipeId, cookingMode, shouldShowCookingMode, toggleCookingMode, onDelete } =
    props;

  return (
    <>
      {!cookingMode && (
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <AddToMealPlanPopover recipeId={recipeId} display="icon" />

            <AddRecipeToShoppingList recipeId={recipeId} display="icon" />
          </div>

          <TooltipButton content="Delete recipe">
            <span className="inline-flex">
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
                  await onDelete(recipeId);
                }}
              />
            </span>
          </TooltipButton>
        </div>
      )}

      {shouldShowCookingMode && !cookingMode && (
        <TooltipButton content="Enter cooking mode">
          <Button
            onClick={toggleCookingMode}
            size="icon"
            aria-label="Enter cooking mode"
          >
            <ChefHat className="h-4 w-4" />
          </Button>
        </TooltipButton>
      )}
    </>
  );
}

function RecipeActionsFull(props: {
  recipeId: number;
  cookingMode: boolean;
  toggleCookingMode: () => void;
  onDelete: (recipeId: number) => Promise<void>;
}) {
  const { recipeId, cookingMode, toggleCookingMode, onDelete } = props;

  return (
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
          <IconTextButton
            variant={"secondary"}
            className="w-full justify-start"
            icon={<Sparkles className="h-4 w-4" />}
            label="Touch up"
          />
        </Link>

        {!cookingMode && (
          <IconTextButton
            onClick={toggleCookingMode}
            variant="outline"
            className="w-full justify-start"
            icon={<ChefHat className="h-4 w-4" />}
            label="Cook it"
          />
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
          await onDelete(recipeId);
        }}
      />
    </div>
  );
}
