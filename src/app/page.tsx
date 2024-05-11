import Link from "next/link";

import { Input } from "~/components/ui/input";
import { api } from "~/trpc/server";
import { useEnforceAuth } from "./useEnforceAuth";
import { MigrateButtons } from "./MigrateButtons";
import { RecipeCard } from "./RecipeCard";

export default async function Home() {
  const recipes = await api.recipe.getRecipes();

  await useEnforceAuth();

  return (
    <div className="flex flex-col gap-4">
      <MigrateButtons />
      <Input placeholder="Search" />

      <Link href="/recipes/new">New Recipe</Link>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
