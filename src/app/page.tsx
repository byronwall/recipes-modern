import Link from "next/link";

import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { helpers } from "~/trpc/helpers";
import { RecipeList } from "./RecipeList";
import { useEnforceAuth } from "./useEnforceAuth";
import { NewRecipeDialog } from "./recipes/new/NewRecipeDialog";

export default async function Home() {
  await useEnforceAuth();

  await (await helpers()).recipe.getRecipes.prefetch();

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="self-start">
        <NewRecipeDialog />
      </div>

      <RecipeList />
    </div>
  );
}
