"use client";

import { Button } from "~/components/ui/button";
import { type RouterOutputs } from "~/trpc/react";
import { useShoppingListActions } from "../useShoppingListActions";
import { KrogerSearchPopup } from "./KrogerSearchPopup";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { Trash } from "lucide-react";
import { getIngredientLabel } from "./getIngredientLabel";
import { SimpleAlertDialog } from "~/components/SimpleAlertDialog";
import { AislePickerDialog } from "./AislePickerDialog";
import { TooltipButton } from "~/components/ui/tooltip-button";
import { IngredientPurchaseHistory } from "~/components/ingredients/IngredientPurchaseHistory";

export type ShoppingListItem =
  RouterOutputs["shoppingList"]["getShoppingList"][0];
type RecentPurchase =
  RouterOutputs["purchases"]["recentByIngredientIds"]["ingredientPurchases"][number]["purchases"][number];

export function ShoppingListCard(props: {
  item: ShoppingListItem;
  displayMode: "recipe" | "aisle";
  recentPurchases: RecentPurchase[];
}) {
  const { item, recentPurchases } = props;

  const { handleDeleteItem, handleMarkAsBought } = useShoppingListActions();

  const ingredientLabel = getIngredientLabel(item);
  const isBought = item.isBought ?? false;
  // if display mode is aisle, show the recipe; flip if display mode is recipe
  const extraLabel =
    props.displayMode === "aisle" ? item.Recipe?.name : item.ingredient?.aisle;

  return (
    <div className="rounded-2xl bg-background/60 px-2 py-1.5 transition-colors hover:bg-accent/30">
      <div className="flex w-full flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-2">
          <Checkbox
            checked={isBought}
            onCheckedChange={async () => {
              await handleMarkAsBought(item.id);
            }}
            id={`checkbox-${item.id}`}
            className="mt-0.5 h-5 w-5"
          />
          <div className="min-w-0">
            <Label
              htmlFor={`checkbox-${item.id}`}
              className={cn(
                "cursor-pointer break-words text-base font-semibold leading-snug hover:bg-accent/40",
                {
                  "text-muted-foreground line-through": isBought,
                },
              )}
            >
              {ingredientLabel}
            </Label>
            {extraLabel && !isBought ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {extraLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            isBought && "invisible",
          )}
        >
          {item.ingredient && recentPurchases.length > 0 ? (
            <IngredientPurchaseHistory
              purchases={recentPurchases}
              currentRecipeId={item.Recipe?.id}
              ingredientId={item.ingredient.id}
              listItemId={item.id}
              compact
              hideEmpty
            />
          ) : null}
          <KrogerSearchPopup
            originalListItemId={item.id}
            ingredient={item.ingredient?.ingredient}
          />
          {item.ingredient && (
            <AislePickerDialog
              ingredientId={item.ingredient.id}
              currentAisle={item.ingredient.aisle}
            />
          )}
          <TooltipButton content="Remove item">
            <span className="inline-flex">
              <SimpleAlertDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove item"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </Button>
                }
                title={"Are you sure you want to delete?"}
                description={
                  "This will remove the item from your shopping list."
                }
                confirmText={"Delete"}
                cancelText={"Cancel"}
                onConfirm={async () => {
                  await handleDeleteItem(item.id);
                }}
              />
            </span>
          </TooltipButton>
        </div>
      </div>
    </div>
  );
}
