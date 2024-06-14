"use client";

import { api } from "~/trpc/react";

export function useShoppingListActions() {
  const addLooseItem =
    api.shoppingList.addLooseItemToShoppingList.useMutation();

  const handleAddLooseItem = async () => {
    const ingredient = prompt("Enter ingredient name");
    if (!ingredient) {
      return;
    }

    await addLooseItem.mutateAsync({ ingredient });
  };

  const addRecipeMutation =
    api.shoppingList.addRecipeToShoppingList.useMutation();

  // delete item, delete all, delete all bought
  const deleteItem = api.shoppingList.deleteItemFromShoppingList.useMutation();
  const handleDeleteItem = async (id: number) => {
    await deleteItem.mutateAsync({ id });
  };

  const deleteAll =
    api.shoppingList.deleteAllItemsFromShoppingList.useMutation();
  const handleDeleteAll = async () => {
    await deleteAll.mutateAsync();
  };

  const deleteBought =
    api.shoppingList.deleteAllBoughtItemsFromShoppingList.useMutation();

  const handleDeleteBought = async () => {
    await deleteBought.mutateAsync();
  };

  // delete recipe
  const deleteRecipe =
    api.shoppingList.deleteRecipeFromShoppingList.useMutation();
  const handleDeleteRecipe = async (recipeId: number) => {
    await deleteRecipe.mutateAsync({ recipeId });
  };

  const markAsBought = api.shoppingList.markItemAsBought.useMutation();

  const handleMarkAsBought = async (id: number) => {
    await markAsBought.mutateAsync({ id });
  };

  const updateIngredientAisle = api.recipe.updateIngredientAisle.useMutation();

  const handleUpdateIngredientAisle = async (input: {
    id?: number;
    aisle?: string | null;
  }) => {
    if (!input.id) {
      return;
    }

    const aisle = prompt("Enter new aisle", input.aisle ?? "");
    if (!aisle) {
      return;
    }

    await updateIngredientAisle.mutateAsync({ aisle, id: input.id });
  };

  return {
    addRecipeMutation,

    handleAddLooseItem,
    handleDeleteItem,
    handleDeleteAll,
    handleDeleteBought,
    handleDeleteRecipe,
    handleMarkAsBought,
    handleUpdateIngredientAisle,
  };
}
