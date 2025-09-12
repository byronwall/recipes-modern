"use client";

import { Button } from "~/components/ui/button";
import { SimpleAlertDialog } from "~/components/SimpleAlertDialog";
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

      <SimpleAlertDialog
        trigger={<Button variant="destructive-outline">Delete all</Button>}
        title={"Are you sure you want to delete all?"}
        description={
          "This will remove all items from your shopping list. This cannot be undone."
        }
        confirmText={"Delete all"}
        cancelText={"Cancel"}
        onConfirm={async () => {
          await handleDeleteAll();
        }}
      />

      <SimpleAlertDialog
        trigger={<Button variant="destructive-outline">Delete bought</Button>}
        title={"Are you sure you want to delete bought items?"}
        description={
          "This will remove all items marked as bought from your shopping list."
        }
        confirmText={"Delete bought"}
        cancelText={"Cancel"}
        onConfirm={async () => {
          await handleDeleteBought();
        }}
      />
    </div>
  );
}
