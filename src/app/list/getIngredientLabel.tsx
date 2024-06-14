"use client";
import { type ShoppingListItem } from "./ShoppingListCard";

export function getIngredientLabel(item: ShoppingListItem) {
  // build the full string from ingredient, unit, amount, and modifier
  if (item.ingredient) {
    const { ingredient, unit, amount, modifier } = item.ingredient;
    return [amount, unit, ingredient, modifier].filter(Boolean).join(" ");
  }

  return item.looseItem;
}
