"use client";

import Link from "next/link";
import { Card, CardTitle } from "~/components/ui/card";
import { type Recipe } from "@prisma/client";
import { RecipeActions } from "./recipes/[id]/RecipeActions";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Card key={recipe.name} className="h-40">
      <CardTitle className="p-2">
        <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>

        <RecipeActions recipeId={recipe.id} />
      </CardTitle>
    </Card>
  );
}
