"use client";

import { Button } from "~/components/ui/button";
import { useShoppingListActions } from "../useShoppingListActions";

export function ShoppingListActions() {
  const { handleAddLooseItem, handleDeleteAll, handleDeleteBought } =
    useShoppingListActions();

  return (
    <div className="flex gap-2">
      <Button
        onClick={async () => {
          await handleAddLooseItem();
        }}
      >
        Add loose item
      </Button>

      <Button
        onClick={async () => {
          await handleDeleteAll();
        }}
      >
        Delete all
      </Button>

      <Button
        onClick={async () => {
          await handleDeleteBought();
        }}
      >
        Delete bought
      </Button>
    </div>
  );
}
