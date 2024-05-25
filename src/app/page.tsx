import Link from "next/link";

import { helpers } from "~/trpc/helpers";
import { MigrateButtons } from "./MigrateButtons";
import { RecipeList } from "./RecipeList";
import { useEnforceAuth } from "./useEnforceAuth";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";

export default async function Home() {
  await useEnforceAuth();

  await (await helpers()).recipe.getRecipes.prefetch();

  return (
    <div className="flex w-full flex-col gap-4">
      <MigrateButtons />

      <Link href="/recipes/new">
        <Button>
          <Plus />
          New Recipe
        </Button>
      </Link>

      <RecipeList />
    </div>
  );
}
