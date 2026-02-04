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

export type ShoppingListItem =
  RouterOutputs["shoppingList"]["getShoppingList"][0];

export function ShoppingListCard(props: {
  item: ShoppingListItem;
  displayMode: "recipe" | "aisle";
}) {
  const { item } = props;

  const { handleDeleteItem, handleMarkAsBought } = useShoppingListActions();

  const ingredientLabel = getIngredientLabel(item);
  // if display mode is aisle, show the recipe; flip if display mode is recipe
  const extraLabel =
    props.displayMode === "aisle" ? item.Recipe?.name : item.ingredient?.aisle;

  return (
    <div className="rounded-2xl border bg-background/80 p-3">
      <div className="flex w-full flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <Checkbox
            checked={item.isBought ?? false}
            onCheckedChange={async () => {
              await handleMarkAsBought(item.id);
            }}
            id={`checkbox-${item.id}`}
            className="mt-1 h-5 w-5"
          />
          <div className="min-w-0">
            <Label
              htmlFor={`checkbox-${item.id}`}
              className={cn(
                "cursor-pointer break-words text-base font-semibold leading-snug hover:bg-accent/40",
                {
                  "text-sm font-normal text-muted-foreground line-through":
                    item.isBought ?? false,
                },
              )}
            >
              {ingredientLabel}
            </Label>
            {extraLabel ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {extraLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
                    variant="destructive-outline"
                    size="icon"
                    aria-label="Remove item"
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
