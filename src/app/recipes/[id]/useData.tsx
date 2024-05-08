import { api } from "~/trpc/server";

export async function useData() {
  const allData = await api.recipe.getRecipes();

  // create a lookup for ingredients by id
  const ingredientsById = allData.ingredients.reduce(
    (acc, ingredient) => {
      acc[ingredient.id] = ingredient;
      return acc;
    },
    {} as Record<number, (typeof allData.ingredients)[0]>,
  );

  const recipesById = allData.recipes.reduce(
    (acc, recipe) => {
      acc[recipe.id] = recipe;
      return acc;
    },
    {} as Record<number, (typeof allData.recipes)[0]>,
  );

  return { ingredientsById, allData, recipesById };
}
