"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { handleDelete } = useRecipeActions();

  return (
    <Card key={recipe.name} className="h-40">
      <CardTitle className="p-2">
        <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>

        <Button
          onClick={async () => {
            await handleDelete(recipe.id);
          }}
          className="ml-2"
        >
          Delete
        </Button>
      </CardTitle>
    </Card>
  );
}
interface Recipe {
  id: number;
  name: string;
}

function useRecipeActions() {
  const deleteRecipe = api.recipe.deleteRecipe.useMutation();

  const utils = api.useUtils();

  const handleDelete = async (id: number) => {
    const shouldDelete = confirm(
      "Are you sure you want to delete this recipe?",
    );
    if (!shouldDelete) {
      return;
    }

    await deleteRecipe.mutateAsync({ id });

    await utils.invalidate();
  };

  return { handleDelete };
}
