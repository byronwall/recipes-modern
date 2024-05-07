import { useParams } from "next/navigation";
import { H1, H2, H3 } from "~/components/ui/typography";
import { api } from "~/trpc/server";

export default async function Recipe({ params }) {
  // get id
  const { id } = params;

  console.log("parmas", params);

  const recipe = await api.post.getRecipe({ id });

  const allData = await api.post.getRecipes();

  // create a lookup for ingredients by id
  const ingredientsById = allData.ingredients.reduce(
    (acc, ingredient) => {
      acc[ingredient.id] = ingredient;
      return acc;
    },
    {} as Record<number, (typeof allData.ingredients)[0]>,
  );

  return (
    <div>
      <H2>{recipe.name}</H2>

      <H3>ingredients</H3>
      <ul>
        {recipe?.ingredientGroups.map((ingredient, idx) => (
          <li key={idx}>
            {ingredient.ingredients.map((i) => (
              <div key={i.ingredientId}>
                {/* this is awful - need to get the ingredient separately */}
                {i.amount} {i.unit} {i.name}{" "}
                {ingredientsById[i.ingredientId]?.name}
              </div>
            ))}
          </li>
        ))}
      </ul>

      <H3>instructions</H3>
      <p>
        {recipe?.stepGroups.map((group) => (
          <div key={group.title}>
            <H3>{group.name}</H3>
            <ol>
              {group.steps.map((step) => (
                <li key={step}>{step.description}</li>
              ))}
            </ol>
          </div>
        ))}
      </p>
    </div>
  );
}
