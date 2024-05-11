import Link from "next/link";

import { Input } from "~/components/ui/input";
import { api } from "~/trpc/server";
import { useEnforceAuth } from "./useEnforceAuth";
import { MigrateButtons } from "./MigrateButtons";
import { Recipe } from "@prisma/client";
import { RecipeList } from "./RecipeList";

export default async function Home() {
  const recipes = await api.recipe.getRecipes();

  await useEnforceAuth();

  return (
    <div className="flex flex-col gap-4">
      <MigrateButtons />

      <Link href="/recipes/new">New Recipe</Link>

      <RecipeList recipes={recipes} />
    </div>
  );
}
