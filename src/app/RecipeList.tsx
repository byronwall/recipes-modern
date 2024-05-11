"use client";

import { type Recipe } from "@prisma/client";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { RecipeCard } from "./RecipeCard";

export function RecipeList(props: { recipes: Recipe[] }) {
  const { recipes } = props;

  const [search, setSearch] = useState("");

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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {filteredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </>
  );
}
