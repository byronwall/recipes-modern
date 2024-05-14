"use client";

import { H2, H3, H4 } from "~/components/ui/typography";
import { RecipeActions } from "./RecipeActions";
import { api } from "~/trpc/react";

export function RecipeClient(props: { id: number }) {
  // get id
  const { id } = props;

  const { data: recipe } = api.recipe.getRecipe.useQuery({
    id,
  });

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  return (
    <div>
      <H2>{recipe.name}</H2>

      <div className="flex gap-2">
        <RecipeActions recipeId={recipe.id} />
      </div>

      <H3>ingredients</H3>
      <ul>
        {recipe.ingredientGroups.map((ingredient, idx) => (
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
      <div>
        {recipe.stepGroups.map((group) => (
          <div key={group.title}>
            <H4>{group.title}</H4>
            <ol>
              {group.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
