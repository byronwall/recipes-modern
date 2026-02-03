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
import { H3 } from "~/components/ui/typography";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

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
        <PopoverContent
          side="left"
          align="start"
          sideOffset={12}
          className="max-h-[420px] w-80 overflow-y-auto p-4"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <H3 className="text-lg">Add recipe</H3>
              <span className="text-xs text-muted-foreground">
                {filteredRecipes.length} results
              </span>
            </div>
            <Input
              placeholder="Search recipes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-base"
            />
            <div className="flex flex-col gap-1">
              {filteredRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => props.onRecipeSelected(recipe.id)}
                  className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition hover:border-foreground/20 hover:bg-muted"
                >
                  <span className="line-clamp-2">{recipe.name}</span>
                  <span className="text-xs text-muted-foreground">Add</span>
                </button>
              ))}
              {filteredRecipes.length === 0 && (
                <div className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  No recipes match that search.
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
        <PopoverTrigger asChild>
          <span className="inline-flex">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="h-10 rounded-full">
                    <Plus className="h-4 w-4" />
                    Add meal
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add meal</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
        </PopoverTrigger>
      </Popover>
    </div>
  );
}
