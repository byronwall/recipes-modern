"use client";
import { api } from "~/trpc/react";

export function useRecipeActions() {
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
