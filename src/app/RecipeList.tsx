"use client";

import { type Recipe } from "@prisma/client";
import { useState } from "react";
import Link from "next/link";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { RecipeActions } from "./recipes/[id]/RecipeActions";

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
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecipes.map((recipe) => (
              <tr key={recipe.id} className="border-t">
                <td className="px-3 py-2">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="hover:underline"
                  >
                    <div className="flex flex-col">
                      <span className="whitespace-nowrap font-medium">
                        {recipe.name}
                      </span>
                      {recipe.description ? (
                        <span className="line-clamp-2 max-w-[48ch] text-muted-foreground">
                          {recipe.description}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex gap-1">
                    <RecipeActions recipeId={recipe.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
