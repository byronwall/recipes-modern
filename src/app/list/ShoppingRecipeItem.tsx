"use client";

import { Button } from "~/components/ui/button";
import { useShoppingListActions } from "../useShoppingListActions";

export function ShoppingRecipeItem(props: { id: string; name: string }) {
  const { id, name } = props;

  const { handleDeleteRecipe } = useShoppingListActions();

  return (
    <div key={id}>
      <p>
        <strong>{name}</strong>

        <Button
          onClick={async () => {
            await handleDeleteRecipe(Number(id));
          }}
        >
          Delete
        </Button>
      </p>
    </div>
  );
}
