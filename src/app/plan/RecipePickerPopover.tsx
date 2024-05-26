"use client";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Plus } from "lucide-react";

export function RecipePickerPopover(props: {
  onRecipeSelected: (recipeId: number) => void;
}) {
  const { data: recipes = [] } = api.recipe.getRecipes.useQuery();

  const [search, setSearch] = useState("");

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <Popover>
        <PopoverContent className="max-h-[300px] w-72 overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {filteredRecipes.map((recipe) => (
              <Button
                key={recipe.id}
                onClick={() => props.onRecipeSelected(recipe.id)}
                className="flex-1 text-wrap break-words py-1"
                variant="outline"
              >
                {recipe.name}
              </Button>
            ))}
          </div>
        </PopoverContent>
        <PopoverTrigger asChild>
          <Button>
            <Plus />
            Add
          </Button>
        </PopoverTrigger>
      </Popover>
    </div>
  );
}
