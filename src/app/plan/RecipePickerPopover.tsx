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
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  ListPanel,
  ListPanelEmpty,
  ListPanelItem,
} from "~/components/ui/list-panel";
import { useIsMobile } from "~/hooks/use-mobile";
import { format } from "date-fns";

export function RecipePickerPopover(props: {
  day: Date;
  onRecipeSelected: (recipeId: number) => void;
  iconOnly?: boolean;
}) {
  const isMobile = useIsMobile();
  const { data, isError, error } = api.recipe.getRecipes.useQuery();
  const recipes = Array.isArray(data) ? data : [];
  const [isOpen, setIsOpen] = useState(false);

  const [search, setSearch] = useState("");

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(search.toLowerCase()),
  );
  const targetDateLabel = format(props.day, "EEE, MMM d");

  const trigger = (
    <span className="inline-flex">
      <TooltipButton content="Add meal">
        {props.iconOnly ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Add meal on ${targetDateLabel}`}
            className="h-7 w-7 text-muted-foreground/70 hover:bg-primary/10 hover:text-primary"
          >
            <Plus className="h-4 w-4 shrink-0" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 shrink-0" />
            <span className="ml-1">Add meal</span>
          </Button>
        )}
      </TooltipButton>
    </span>
  );

  const pickerContent = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <H3 className="text-lg">Add recipe</H3>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {targetDateLabel}
          </p>
        </div>
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
            onClick={() => {
              props.onRecipeSelected(recipe.id);
              setIsOpen(false);
            }}
          >
            <span className="line-clamp-2">{recipe.name}</span>
            <span className="text-xs text-muted-foreground">Add</span>
          </ListPanelItem>
        ))}
        {!isError && filteredRecipes.length === 0 && (
          <ListPanelEmpty>No recipes match that search.</ListPanelEmpty>
        )}
        {isError && (
          <ListPanelEmpty>
            Couldn&apos;t load recipes: {error.message}
          </ListPanelEmpty>
        )}
      </ListPanel>
    </div>
  );

  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className="left-0 top-0 h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none p-4 sm:rounded-none"
        >
          <DialogTitle className="sr-only">
            Add recipe for {targetDateLabel}
          </DialogTitle>
          {pickerContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={12}
          collisionPadding={12}
          className="max-h-[420px] w-80 overflow-y-auto p-4"
        >
          {pickerContent}
        </PopoverContent>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      </Popover>
    </div>
  );
}
