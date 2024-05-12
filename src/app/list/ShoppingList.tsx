"use client";

import { H2 } from "~/components/ui/typography";

import { ShoppingListCard } from "./ShoppingListCard";
import { api } from "~/trpc/react";
import { ShoppingRecipeItem } from "./ShoppingRecipeItem";

export function ShoppingList() {
  const { data: shoppingList = [] } =
    api.shoppingList.getShoppingList.useQuery();

  // group by recipe name + ID
  const recipesIncluded = shoppingList.filter((item) => item.Recipe);

  // create a Record of recipe ID to name
  const recipeNameById: Record<number, string> = {};
  for (const item of recipesIncluded) {
    if (item.Recipe) {
      recipeNameById[item.Recipe.id] = item.Recipe.name;
    }
  }

  return (
    <>
      <H2>Recipes included</H2>
      <div>
        {Object.entries(recipeNameById).map(([id, name]) => (
          <ShoppingRecipeItem key={id} id={id} name={name} />
        ))}
      </div>

      <H2>List</H2>
      <div>
        {shoppingList.map((item) => (
          <ShoppingListCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}
