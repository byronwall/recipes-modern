"use client";

import Link from "next/link";
import { Card, CardTitle } from "~/components/ui/card";
import { type Recipe } from "@prisma/client";
import { RecipeActions } from "./recipes/[id]/RecipeActions";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Card key={recipe.name} className="min-h-40">
      <CardTitle className="p-2">
        <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>

        <div className="flex flex-wrap gap-2">
          <RecipeActions recipeId={recipe.id} />
        </div>
      </CardTitle>
    </Card>
  );
}
