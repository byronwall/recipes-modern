import { useEnforceAuth } from "~/app/useEnforceAuth";
import { helpers } from "~/trpc/helpers";
import { RecipeClient } from "./RecipeClient";

export default async function Recipe({ params }: { params: { id: string } }) {
  await useEnforceAuth();

  await (await helpers())?.recipe.getRecipe.prefetch({ id: +params.id });

  return <RecipeClient id={+params.id} />;
}
