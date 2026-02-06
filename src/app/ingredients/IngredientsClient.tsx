"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IngredientPurchaseHistory } from "~/components/ingredients/IngredientPurchaseHistory";
import { CardGrid } from "~/components/layout/CardGrid";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { api } from "~/trpc/react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "~/lib/utils";

export function IngredientsClient() {
  const { data, isLoading, error } = api.purchases.ingredientsCatalog.useQuery();
  const [search, setSearch] = useState("");
  const [recipeFilter, setRecipeFilter] = useState("all");
  const [recipeFilterOpen, setRecipeFilterOpen] = useState(false);
  const [aisleFilter, setAisleFilter] = useState("all");
  const [purchaseFilter, setPurchaseFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const ingredients = useMemo(() => data ?? [], [data]);

  const recipeOptions = useMemo(() => {
    const seen = new Map<number, string>();
    for (const ingredient of ingredients) {
      for (const recipe of ingredient.recipes) {
        seen.set(recipe.id, recipe.name);
      }
    }
    return Array.from(seen.entries()).sort((a, b) =>
      a[1].localeCompare(b[1], undefined, { sensitivity: "base" }),
    );
  }, [ingredients]);

  const aisleOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const ingredient of ingredients) {
      if (ingredient.aisle?.trim()) {
        seen.add(ingredient.aisle.trim());
      }
    }
    return Array.from(seen).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [ingredients]);

  const filteredIngredients = useMemo(() => {
    const q = search.trim().toLowerCase();

    return ingredients.filter((ingredient) => {
      if (
        recipeFilter !== "all" &&
        !ingredient.recipes.some((recipe) => String(recipe.id) === recipeFilter)
      ) {
        return false;
      }

      if (aisleFilter !== "all") {
        const ingredientAisle = ingredient.aisle?.trim().toLowerCase() ?? "";
        if (ingredientAisle !== aisleFilter.toLowerCase()) {
          return false;
        }
      }

      if (purchaseFilter === "with" && ingredient.purchaseCount === 0) {
        return false;
      }

      if (purchaseFilter === "without" && ingredient.purchaseCount > 0) {
        return false;
      }

      if (!q) return true;

      return (
        ingredient.ingredient.toLowerCase().includes(q) ||
        ingredient.recipes.some((recipe) =>
          recipe.name.toLowerCase().includes(q),
        ) ||
        (ingredient.aisle ?? "").toLowerCase().includes(q)
      );
    });
  }, [ingredients, search, recipeFilter, aisleFilter, purchaseFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredIngredients.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const recipeFilterLabel =
    recipeFilter === "all"
      ? "All recipes"
      : recipeOptions.find(([id]) => String(id) === recipeFilter)?.[1] ??
        "All recipes";
  const pagedIngredients = useMemo(
    () =>
      filteredIngredients.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredIngredients, pageSize, safePage],
  );

  if (isLoading) return <p>Loading ingredients...</p>;
  if (error) return <p>Error loading ingredients.</p>;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border bg-card/70 p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="flex flex-col gap-2 lg:col-span-2">
            <Label className="text-xs uppercase text-muted-foreground">
              Search
            </Label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter ingredients, recipes, or aisles"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase text-muted-foreground">
              Recipe
            </Label>
            <Popover open={recipeFilterOpen} onOpenChange={setRecipeFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={recipeFilterOpen}
                  className="h-9 w-full justify-between font-normal"
                >
                  <span className="truncate">{recipeFilterLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Filter recipes..." />
                  <CommandList>
                    <CommandEmpty>No recipes found.</CommandEmpty>
                    <CommandItem
                      value="All recipes"
                      className="bg-accent/40 font-medium hover:bg-accent/60 data-[selected=true]:bg-accent/70"
                      onSelect={() => {
                        setRecipeFilter("all");
                        setRecipeFilterOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          recipeFilter === "all" ? "opacity-100" : "opacity-0",
                        )}
                      />
                      All recipes
                    </CommandItem>
                    {recipeOptions.map(([id, name]) => (
                      <CommandItem
                        key={id}
                        value={name}
                        onSelect={() => {
                          setRecipeFilter(String(id));
                          setRecipeFilterOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            recipeFilter === String(id)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <span className="truncate">{name}</span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase text-muted-foreground">
              Aisle
            </Label>
            <Select value={aisleFilter} onValueChange={setAisleFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All aisles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All aisles</SelectItem>
                {aisleOptions.map((aisle) => (
                  <SelectItem key={aisle} value={aisle}>
                    {aisle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup
            type="single"
            value={purchaseFilter}
            onValueChange={(value) => {
              if (value) setPurchaseFilter(value);
            }}
            variant="outline"
            size="sm"
            className="flex flex-wrap justify-start gap-2"
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="with">With purchases</ToggleGroupItem>
            <ToggleGroupItem value="without">No purchases yet</ToggleGroupItem>
          </ToggleGroup>
          <span className="text-xs text-muted-foreground">
            {filteredIngredients.length} ingredients
          </span>
        </div>
      </section>

      <CardGrid className="md:grid-cols-2 xl:grid-cols-3">
        {pagedIngredients.map((ingredient) => (
          <section
            key={ingredient.id}
            className="flex min-h-[220px] flex-col rounded-2xl border bg-card/70 p-3.5 shadow-sm"
          >
            <p className="text-base font-semibold">{ingredient.ingredient}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-background/80 px-2 py-0.5 text-muted-foreground">
                {ingredient.aisle?.trim() ?? "Unknown aisle"}
              </span>
              <span className="rounded-full bg-background/80 px-2 py-0.5 text-muted-foreground">
                {ingredient.purchaseCount} purchases
              </span>
            </div>

            <div className="mt-3 flex-1 pb-2">
              <IngredientPurchaseHistory
                purchases={ingredient.recentPurchases}
                compact
                hideEmpty
              />
            </div>

            <div className="mt-auto min-h-[96px] border-t border-border/60 pt-3.5">
              <div className="space-y-1.5">
                {ingredient.recipes.slice(0, 2).map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.id}`}
                    className="block rounded-md bg-accent/50 px-2 py-1 text-sm font-medium hover:bg-accent/70"
                    title={recipe.name}
                  >
                    <span className="block truncate">{recipe.name}</span>
                  </Link>
                ))}
                {ingredient.recipes.length > 2 ? (
                  <HoverCard openDelay={90}>
                    <HoverCardTrigger className="rounded-full bg-background/80 px-2 py-0.5 text-xs text-muted-foreground">
                      +{ingredient.recipes.length - 2} more recipes
                    </HoverCardTrigger>
                    <HoverCardContent
                      align="start"
                      className="w-64 rounded-2xl border bg-card p-3 shadow-xl"
                    >
                      <p className="mb-2 text-xs uppercase text-muted-foreground">
                        Other recipes
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {ingredient.recipes.slice(2).map((recipe) => (
                          <Link
                            key={recipe.id}
                            href={`/recipes/${recipe.id}`}
                            className="truncate rounded-md px-2 py-1 text-sm hover:bg-accent/40"
                            title={recipe.name}
                          >
                            {recipe.name}
                          </Link>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ) : null}
              </div>
            </div>
          </section>
        ))}
      </CardGrid>

      {pagedIngredients.length === 0 ? (
        <section className="rounded-2xl border bg-card/70 p-6 text-sm text-muted-foreground shadow-sm">
          No ingredients match your filters.
        </section>
      ) : null}
      {filteredIngredients.length > 0 ? (
        <section className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card/70 px-4 py-3 text-sm shadow-sm">
          <span className="text-muted-foreground">
            Showing {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredIngredients.length)} of{" "}
            {filteredIngredients.length}
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["12", "24", "36", "60"].map((size) => (
                  <SelectItem key={size} value={size}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="text-xs text-muted-foreground">
              Page {safePage} of {totalPages}
            </span>
            <button
              className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
