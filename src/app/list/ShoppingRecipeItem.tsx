"use client";

import { Button } from "~/components/ui/button";
import { useShoppingListActions } from "../useShoppingListActions";
import { Trash } from "lucide-react";

export function ShoppingRecipeItem(props: { id: string; name: string }) {
  const { id, name } = props;

  const { handleDeleteRecipe } = useShoppingListActions();

  return (
    <div key={id} className="flex items-center gap-2">
      <Button
        onClick={async () => {
          await handleDeleteRecipe(Number(id));
        }}
        variant="destructive-outline"
        size="sm"
      >
        <Trash />
      </Button>
      <span className="break-words text-lg font-semibold">{name}</span>
    </div>
  );
}
