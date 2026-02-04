"use client";

import { Button } from "~/components/ui/button";
import { SimpleAlertDialog } from "~/components/SimpleAlertDialog";
import { useShoppingListActions } from "../useShoppingListActions";
import { Plus } from "lucide-react";
import { IconTextButton } from "~/components/ui/icon-text-button";
import { cn } from "~/lib/utils";

export function ShoppingListActions(props: {
  className?: string;
  layout?: "row" | "column";
}) {
  const { className, layout = "row" } = props;
  const { handleAddLooseItem, handleDeleteAll, handleDeleteBought } =
    useShoppingListActions();
  const isColumn = layout === "column";

  return (
    <div
      className={cn(
        "flex gap-2",
        isColumn ? "flex-col items-stretch" : "flex-wrap",
        className,
      )}
    >
      <IconTextButton
        onClick={async () => {
          await handleAddLooseItem();
        }}
        icon={<Plus className="h-4 w-4 shrink-0" />}
        label="Add loose item"
        className={cn(isColumn && "w-full justify-start")}
      />

      <SimpleAlertDialog
        trigger={
          <Button
            variant="destructive-outline"
            className={cn(isColumn && "w-full justify-start")}
          >
            Delete all
          </Button>
        }
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
        trigger={
          <Button
            variant="destructive-outline"
            className={cn(isColumn && "w-full justify-start")}
          >
            Delete bought
          </Button>
        }
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
