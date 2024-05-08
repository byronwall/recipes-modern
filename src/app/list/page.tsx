import { H2 } from "~/components/ui/typography";
import { api } from "~/trpc/server";
import { useData } from "../recipes/[id]/useData";
import { useEnforceAuth } from "../useEnforceAuth";

export default async function ListPage() {
  await useEnforceAuth();

  const { shoppingList } = await api.recipe.getRecipes();

  console.log("shoppingList", shoppingList);

  const { ingredientsById } = await useData();

  return (
    <div>
      <H2>List</H2>
      <ul>
        {shoppingList.map((item) => (
          <li key={item.id}>
            {ingredientsById[item.ingredientAmount.ingredientId]?.name}{" "}
          </li>
        ))}
      </ul>
    </div>
  );
}
