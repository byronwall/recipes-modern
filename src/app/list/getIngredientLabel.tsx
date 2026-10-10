"use client";
import { formatAmount } from "~/lib/formatAmount";
import { type ShoppingListItem } from "./ShoppingListCard";

export function getIngredientLabel(item: ShoppingListItem) {
  // build the full string from ingredient, unit, amount, and modifier
  if (item.ingredient) {
    const { ingredient, unit, amount, modifier } = item.ingredient;
    const base = [formatAmount(amount), unit, ingredient]
      .filter(Boolean)
      .join(" ");
    return modifier ? `${base}, ${modifier}` : base;
  }

  return item.looseItem ?? "";
}
