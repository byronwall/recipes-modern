"use client";

import { Button } from "~/components/ui/button";
import { useShoppingListActions } from "../useShoppingListActions";
import { Trash } from "lucide-react";
import { SimpleAlertDialog } from "~/components/SimpleAlertDialog";
import { TooltipButton } from "~/components/ui/tooltip-button";

export function ShoppingRecipeItem(props: { id: string; name: string }) {
  const { id, name } = props;

  const { handleDeleteRecipe } = useShoppingListActions();

  return (
    <div key={id} className="flex items-center gap-3">
      <TooltipButton content="Remove recipe">
        <span className="inline-flex">
          <SimpleAlertDialog
            trigger={
              <Button
                variant="destructive-outline"
                size="icon"
                aria-label="Remove recipe"
              >
                <Trash className="h-4 w-4 shrink-0" aria-hidden="true" />
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
        </span>
      </TooltipButton>
      <span className="break-words text-base font-semibold">{name}</span>
    </div>
  );
}
