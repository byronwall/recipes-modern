"use client";

import { Button } from "~/components/ui/button";
import { type RouterOutputs } from "~/trpc/react";
import { useShoppingListActions } from "../useShoppingListActions";
import { KrogerSearchPopup } from "./KrogerSearchPopup";

type ShoppingListItem = RouterOutputs["shoppingList"]["getShoppingList"][0];

export function ShoppingListCard(props: { item: ShoppingListItem }) {
  const { item } = props;

  const { handleDeleteItem, handleMarkAsBought, handleUpdateIngredientAisle } =
    useShoppingListActions();

  return (
    <div className="mb-2 border p-2">
      <p>loose item: {item.looseItem}</p>
      <p>recipe: {item.Recipe?.name}</p>
      <p>ingredient: {item.ingredient?.ingredient}</p>
      <p>is bought: {item.isBought ? "yes" : "no"}</p>

      <div>
        <Button
          onClick={async () => {
            await handleMarkAsBought(item.id);
          }}
        >
          {item.isBought ? "mark as not bought" : "mark as bought"}
        </Button>
        <Button
          onClick={async () => {
            await handleDeleteItem(item.id);
          }}
        >
          Delete
        </Button>

        {item.ingredient && (
          <Button
            onClick={async () => {
              await handleUpdateIngredientAisle({
                id: item.ingredient?.id,
                aisle: item.ingredient?.aisle,
              });
            }}
          >
            Update Aisle
          </Button>
        )}
        <KrogerSearchPopup ingredient={item.ingredient?.ingredient} />
      </div>
    </div>
  );
}
