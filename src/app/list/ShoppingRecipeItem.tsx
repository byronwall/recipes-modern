"use client";

import { Button } from "~/components/ui/button";
import { useShoppingListActions } from "../useShoppingListActions";
import { Trash } from "lucide-react";
import { SimpleAlertDialog } from "~/components/SimpleAlertDialog";

export function ShoppingRecipeItem(props: { id: string; name: string }) {
  const { id, name } = props;

  const { handleDeleteRecipe } = useShoppingListActions();

  return (
    <div key={id} className="flex items-center gap-2">
      <SimpleAlertDialog
        trigger={
          <Button variant="destructive-outline" size="sm">
            <Trash />
          </Button>
        }
        title={"Are you sure you want to delete?"}
        description={
          "This will remove all items for this recipe from your shopping list."
        }
        confirmText={"Delete"}
        cancelText={"Cancel"}
        onConfirm={async () => {
          await handleDeleteRecipe(Number(id));
        }}
      />
      <span className="break-words text-lg font-semibold">{name}</span>
    </div>
  );
}
