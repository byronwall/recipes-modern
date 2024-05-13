"use client";
import { api } from "~/trpc/react";

export function useRecipeActions() {
  const utils = api.useUtils();

  const deleteRecipe = api.recipe.deleteRecipe.useMutation();

  const handleDelete = async (id: number) => {
    const shouldDelete = confirm(
      "Are you sure you want to delete this recipe?",
    );
    if (!shouldDelete) {
      return;
    }

    await deleteRecipe.mutateAsync({ id });
  };

  const addToMealPlan = api.recipe.addRecipeToMealPlan.useMutation();

  const handleAddToMealPlan = async (recipeId: number, date: Date) => {
    await addToMealPlan.mutateAsync({ recipeId, date });
  };

  const deleteFromMealPlan = api.recipe.deleteMealPlan.useMutation();

  const handleDeleteFromMealPlan = async (id: number) => {
    const shouldDelete = confirm(
      "Are you sure you want to delete this recipe from the meal plan?",
    );

    if (!shouldDelete) {
      return;
    }

    await deleteFromMealPlan.mutateAsync({ id });
  };

  return { handleDelete, handleAddToMealPlan, handleDeleteFromMealPlan };
}
