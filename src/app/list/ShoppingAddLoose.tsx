"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { SimpleAlertDialog } from "~/components/SimpleAlertDialog";
import { api } from "~/trpc/react";
import { useShoppingListActions } from "../useShoppingListActions";

/** Inline "add an item" field for loose (non-recipe) shopping list items. */
export function ShoppingAddLooseForm() {
  const [value, setValue] = useState("");
  const utils = api.useUtils();
  const addLooseItem = api.shoppingList.addLooseItemToShoppingList.useMutation({
    onSuccess: async () => {
      await utils.shoppingList.getShoppingList.invalidate();
    },
  });

  return (
    <form
      className="flex w-full items-center gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const ingredient = value.trim();
        if (!ingredient) return;
        await addLooseItem.mutateAsync({ ingredient });
        setValue("");
      }}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add an item, e.g. paper towels"
        aria-label="Add an item to the shopping list"
        className="flex-1"
      />
      <Button
        type="submit"
        disabled={!value.trim()}
        isLoading={addLooseItem.isPending}
        className="shrink-0"
      >
        {!addLooseItem.isPending && <Plus className="h-4 w-4 shrink-0" />}
        <span className="ml-1">Add</span>
      </Button>
    </form>
  );
}

export function ShoppingListActions(props: { hasBought: boolean }) {
  const { hasBought } = props;
  const { handleDeleteAll, handleDeleteBought } = useShoppingListActions();

  return (
    <>
      <SimpleAlertDialog
        trigger={
          <Button variant="ghost" size="sm" disabled={!hasBought}>
            Clear bought
          </Button>
        }
        title={"Clear bought items?"}
        description={
          "This will remove all items marked as bought from your shopping list."
        }
        confirmText={"Clear bought"}
        cancelText={"Cancel"}
        onConfirm={async () => {
          await handleDeleteBought();
        }}
      />

      <SimpleAlertDialog
        trigger={
          <Button variant="ghost-destructive" size="sm">
            Clear all
          </Button>
        }
        title={"Clear the whole list?"}
        description={
          "This will remove all items from your shopping list. This cannot be undone."
        }
        confirmText={"Clear all"}
        cancelText={"Cancel"}
        confirmVariant="destructive"
        onConfirm={async () => {
          await handleDeleteAll();
        }}
      />
    </>
  );
}
