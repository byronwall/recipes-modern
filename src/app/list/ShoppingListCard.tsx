"use client";

import { Button } from "~/components/ui/button";
import { type RouterOutputs } from "~/trpc/react";
import { useShoppingListActions } from "../useShoppingListActions";
import { KrogerSearchPopup } from "./KrogerSearchPopup";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { Trash } from "lucide-react";

type ShoppingListItem = RouterOutputs["shoppingList"]["getShoppingList"][0];

export function ShoppingListCard(props: {
  item: ShoppingListItem;
  displayMode: "recipe" | "aisle";
}) {
  const { item } = props;

  const { handleDeleteItem, handleMarkAsBought, handleUpdateIngredientAisle } =
    useShoppingListActions();

  const ingredientLabel = item.ingredient?.ingredient ?? item.looseItem;
  // if display mode is aisle, show the recipe; flip if display mode is recipe
  const extraLabel =
    props.displayMode === "aisle" ? item.Recipe?.name : item.ingredient?.aisle;

  return (
    <div className="mb-2 border p-2">
      <div className="flex w-full flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 ">
          <Checkbox
            checked={item.isBought ?? false}
            onCheckedChange={async () => {
              await handleMarkAsBought(item.id);
            }}
            id={`checkbox-${item.id}`}
            className="h-6 w-6"
          />
          <Label
            htmlFor={`checkbox-${item.id}`}
            className={cn(
              "cursor-pointer break-words text-xl font-semibold hover:bg-gray-100",
              {
                "text-lg font-normal text-gray-400 line-through":
                  item.isBought ?? false,
              },
            )}
          >
            {ingredientLabel}
          </Label>
          <p className="hidden truncate text-sm text-gray-500 sm:inline">
            {extraLabel}
          </p>
        </div>

        <div className="flex gap-2">
          <KrogerSearchPopup ingredient={item.ingredient?.ingredient} />
          {item.ingredient && (
            <Button
              onClick={async () => {
                await handleUpdateIngredientAisle({
                  id: item.ingredient?.id,
                  aisle: item.ingredient?.aisle,
                });
              }}
              variant="secondary"
            >
              Update Aisle
            </Button>
          )}
          <Button
            onClick={async () => {
              await handleDeleteItem(item.id);
            }}
            variant="destructive-outline"
          >
            <Trash />
          </Button>
        </div>
      </div>
    </div>
  );
}
