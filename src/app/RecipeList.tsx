"use client";

import { type Recipe } from "@prisma/client";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { RecipeCard } from "./RecipeCard";
import { api } from "~/trpc/react";

const defaultRecipes: Recipe[] = [];

export function RecipeList() {
  const { data: _recipes } = api.recipe.getRecipes.useQuery();

  const [search, setSearch] = useState("");

  const recipes = _recipes ?? defaultRecipes;

  console.log("recipes", recipes);

  // prevent undefined?
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search"
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2">
        {filteredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </>
  );
}
