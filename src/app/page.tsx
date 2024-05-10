import Link from "next/link";

import { Card, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/server";
import { useEnforceAuth } from "./useEnforceAuth";
import { MigrateButtons } from "./MigrateButtons";

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
          <Card key={recipe.name} className="h-40">
            <CardTitle className="p-2">
              <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>
            </CardTitle>
          </Card>
        ))}
      </div>
    </div>
  );
}
