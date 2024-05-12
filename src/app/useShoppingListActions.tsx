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

  const addRecipe = api.shoppingList.addRecipeToShoppingList.useMutation();

  const handleAddRecipe = async (recipeId: number) => {
    await addRecipe.mutateAsync({ recipeId });
  };

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

  return {
    handleAddLooseItem,
    handleAddRecipe,
    handleDeleteItem,
    handleDeleteAll,
    handleDeleteBought,
    handleDeleteRecipe,
    handleMarkAsBought,
  };
}
