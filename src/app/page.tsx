import Link from "next/link";

import { helpers } from "~/trpc/helpers";
import { RecipeList } from "./RecipeList";
import { useEnforceAuth } from "./useEnforceAuth";

export default async function Home() {
  await useEnforceAuth();

  await (await helpers()).recipe.getRecipes.prefetch();

  return (
    <div className="flex w-full flex-col gap-4">
      <RecipeList />
    </div>
  );
}
