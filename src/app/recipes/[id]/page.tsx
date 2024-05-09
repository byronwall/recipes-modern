import { H2, H3, H4 } from "~/components/ui/typography";
import { api } from "~/trpc/server";
import { useData } from "./useData";

export default async function Recipe({ params }) {
  // get id
  const { id } = params;

  const recipe = await api.recipe.getRecipe({ id });
  console.log("parmas", params, recipe);

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  return (
    <div>
      <H2>{recipe.name}</H2>

      <H3>ingredients</H3>
      <ul>
        {recipe?.ingredientGroups.map((ingredient, idx) => (
          <li key={idx}>
            {ingredient.ingredients.map((i) => (
              <div key={i.id}>
                {i.amount} {i.unit} {i.ingredient}
              </div>
            ))}
          </li>
        ))}
      </ul>

      <H3>instructions</H3>
      <p>
        {recipe?.stepGroups.map((group) => (
          <div key={group.title}>
            <H4>{group.title}</H4>
            <ol>
              {group.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </p>
    </div>
  );
}
