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
import { TooltipButton } from "~/components/ui/tooltip-button";
import {
  ListPanel,
  ListPanelEmpty,
  ListPanelItem,
} from "~/components/ui/list-panel";

export function RecipePickerPopover(props: {
  onRecipeSelected: (recipeId: number) => void;
  iconOnly?: boolean;
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
            <ListPanel>
              {filteredRecipes.map((recipe) => (
                <ListPanelItem
                  key={recipe.id}
                  onClick={() => props.onRecipeSelected(recipe.id)}
                >
                  <span className="line-clamp-2">{recipe.name}</span>
                  <span className="text-xs text-muted-foreground">Add</span>
                </ListPanelItem>
              ))}
              {filteredRecipes.length === 0 && (
                <ListPanelEmpty>No recipes match that search.</ListPanelEmpty>
              )}
            </ListPanel>
          </div>
        </PopoverContent>
        <PopoverTrigger asChild>
          <span className="inline-flex">
            <TooltipButton content="Add meal">
              {props.iconOnly ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Add meal"
                  className="text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                </Button>
              ) : (
                <Button variant="outline" className="h-10 rounded-full">
                  <Plus className="h-4 w-4 shrink-0" />
                  Add meal
                </Button>
              )}
            </TooltipButton>
          </span>
        </PopoverTrigger>
      </Popover>
    </div>
  );
}
