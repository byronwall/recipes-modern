import Link from "next/link";

import { HydrationBoundary } from "@tanstack/react-query";
import { helpers } from "~/trpc/server";
import { MigrateButtons } from "./MigrateButtons";
import { RecipeList } from "./RecipeList";
import { useEnforceAuth } from "./useEnforceAuth";

export default async function Home() {
  await useEnforceAuth();

  await helpers.recipe.getRecipes.prefetch();

  return (
    <HydrationBoundary state={helpers.dehydrate().json}>
      <div className="flex flex-col gap-4">
        <MigrateButtons />

        <Link href="/recipes/new">New Recipe</Link>

        <RecipeList />
      </div>
    </HydrationBoundary>
  );
}
