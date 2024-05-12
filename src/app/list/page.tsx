import { H2 } from "~/components/ui/typography";
import { helpers } from "~/trpc/server";
import { useEnforceAuth } from "../useEnforceAuth";
import { ShoppingListActions } from "./ShoppingAddLoose";
import { ShoppingRecipeItem } from "./ShoppingRecipeItem";
import { HydrationBoundary } from "@tanstack/react-query";
import { ShoppingList } from "./ShoppingList";

export default async function ListPage() {
  await useEnforceAuth();

  const shoppingList = await helpers.shoppingList.getShoppingList.fetch();

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
    <HydrationBoundary state={helpers.dehydrate().json}>
      <div>
        <H2>Actions</H2>
        <div className="flex gap-2">
          <ShoppingListActions />
        </div>

        <H2>Recipes included</H2>
        <div>
          {Object.entries(recipeNameById).map(([id, name]) => (
            <ShoppingRecipeItem key={id} id={id} name={name} />
          ))}
        </div>

        <ShoppingList />
      </div>
    </HydrationBoundary>
  );
}
