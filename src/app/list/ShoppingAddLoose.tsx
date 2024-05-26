"use client";

import { Button } from "~/components/ui/button";
import { useShoppingListActions } from "../useShoppingListActions";
import { Plus } from "lucide-react";

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
        <Plus />
        Add loose item
      </Button>

      <Button
        onClick={async () => {
          await handleDeleteAll();
        }}
        variant="destructive-outline"
      >
        Delete all
      </Button>

      <Button
        onClick={async () => {
          await handleDeleteBought();
        }}
        variant="destructive-outline"
      >
        Delete bought
      </Button>
    </div>
  );
}
