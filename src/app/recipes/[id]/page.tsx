import { useEnforceAuth } from "~/app/useEnforceAuth";
import { helpers } from "~/trpc/server";

export default async function Recipe({ params }: { params: { id: string } }) {
  console.log("Recipe page", params);

  await useEnforceAuth();

  await helpers.recipe.getRecipe.prefetch({ id: +params.id });

  // return <RecipeClient id={+params.id} />;
  return <div>Recipe page</div>;
}
