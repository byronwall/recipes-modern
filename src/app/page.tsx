import Link from "next/link";

import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { helpers } from "~/trpc/helpers";
import { RecipeList } from "./RecipeList";
import { useEnforceAuth } from "./useEnforceAuth";

export default async function Home() {
  await useEnforceAuth();

  await (await helpers()).recipe.getRecipes.prefetch();

  return (
    <div className="flex w-full flex-col gap-4">
      <Link href="/recipes/new" className="self-start">
        <Button>
          <Plus />
          New Recipe
        </Button>
      </Link>

      <RecipeList />
    </div>
  );
}
