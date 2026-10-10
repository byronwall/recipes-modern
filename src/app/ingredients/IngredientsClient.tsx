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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { api } from "~/trpc/react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  urlStateCodecs,
  useReplaceUrlParams,
  useUrlState,
} from "~/hooks/use-url-state";

const ingredientSearchCodec = urlStateCodecs.string();
const ingredientRecipeCodec = urlStateCodecs.string("all");
const ingredientAisleCodec = urlStateCodecs.string("all");
const ingredientPurchaseCodec = urlStateCodecs.enum(
  ["all", "with", "without"] as const,
  "all",
);
const ingredientPageCodec = urlStateCodecs.number(1);
const ingredientPageSizeCodec = urlStateCodecs.number(24, {
  allowedValues: [12, 24, 36, 60],
});

export function IngredientsClient() {
  const { data, isLoading, error } =
    api.purchases.ingredientsCatalog.useQuery();
  const replaceUrlParams = useReplaceUrlParams();
  const [search] = useUrlState("q", ingredientSearchCodec);
  const [recipeFilter] = useUrlState("recipe", ingredientRecipeCodec);
  const [recipeFilterOpen, setRecipeFilterOpen] = useState(false);
  const [aisleFilter] = useUrlState("aisle", ingredientAisleCodec);
  const [purchaseFilter] = useUrlState("purchases", ingredientPurchaseCodec);
  const [page, setPage] = useUrlState("page", ingredientPageCodec);
  const [pageSize] = useUrlState("pageSize", ingredientPageSizeCodec);

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
  const totalPages = Math.max(
    1,
    Math.ceil(filteredIngredients.length / pageSize),
  );
  const safePage = Math.max(1, Math.min(Math.trunc(page), totalPages));
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

  if (isLoading)
    return (
      <p className="text-sm text-muted-foreground">Loading ingredients…</p>
    );
  if (error)
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load ingredients.
      </p>
    );

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-3 shadow-sm sm:p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search ingredients"
              className="pl-9"
              value={search}
              onChange={(event) =>
                replaceUrlParams({ q: event.target.value, page: null })
              }
              placeholder="Search ingredients, recipes, or aisles"
            />
          </div>
          <div>
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
              <PopoverContent
                className="w-[min(360px,calc(100vw-2rem))] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Filter recipes..." />
                  <CommandList>
                    <CommandEmpty>No recipes found.</CommandEmpty>
                    <CommandItem
                      value="All recipes"
                      className="bg-accent/40 font-medium hover:bg-accent/60 data-[selected=true]:bg-accent/70"
                      onSelect={() => {
                        replaceUrlParams({ recipe: null, page: null });
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
                          replaceUrlParams({
                            recipe: String(id),
                            page: null,
                          });
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
          <div>
            <Select
              value={aisleFilter}
              onValueChange={(value) =>
                replaceUrlParams({
                  aisle: value === "all" ? null : value,
                  page: null,
                })
              }
            >
              <SelectTrigger aria-label="Aisle" className="h-9">
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup
            type="single"
            value={purchaseFilter}
            onValueChange={(value) => {
              if (value) {
                replaceUrlParams({
                  purchases: value === "all" ? null : value,
                  page: null,
                });
              }
            }}
            size="sm"
            className="flex justify-start gap-0.5 rounded-full bg-muted p-0.5"
          >
            {(
              [
                ["all", "All"],
                ["with", "Purchased"],
                ["without", "Never purchased"],
              ] as const
            ).map(([value, label]) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="h-7 rounded-full px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <span className="text-xs text-muted-foreground">
            {filteredIngredients.length}{" "}
            {filteredIngredients.length === 1 ? "ingredient" : "ingredients"}
          </span>
        </div>
      </section>

      <CardGrid className="gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {pagedIngredients.map((ingredient) => {
          const aisle = ingredient.aisle?.trim();
          return (
            <section
              key={ingredient.id}
              className="flex flex-col gap-2 rounded-2xl border bg-card/70 p-3.5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 font-semibold leading-snug">
                  {ingredient.ingredient}
                </p>
                {aisle ? (
                  <span className="shrink-0 rounded-full bg-accent/60 px-2 py-0.5 text-xs">
                    {aisle}
                  </span>
                ) : null}
              </div>

              {ingredient.recentPurchases.length > 0 ? (
                <div className="flex items-center gap-2">
                  <IngredientPurchaseHistory
                    purchases={ingredient.recentPurchases}
                    compact
                    hideEmpty
                  />
                  <span className="text-xs text-muted-foreground">
                    {ingredient.purchaseCount}{" "}
                    {ingredient.purchaseCount === 1 ? "purchase" : "purchases"}
                  </span>
                </div>
              ) : null}

              {ingredient.recipes.length > 0 ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  <span className="mr-1">Used in</span>
                  {ingredient.recipes.map((recipe, index) => (
                    <span key={recipe.id}>
                      {index > 0 ? ", " : null}
                      <Link
                        href={`/recipes/${recipe.id}`}
                        className="font-medium text-foreground hover:text-primary hover:no-underline"
                      >
                        {recipe.name}
                      </Link>
                    </span>
                  ))}
                </p>
              ) : null}
            </section>
          );
        })}
      </CardGrid>

      {pagedIngredients.length === 0 ? (
        <section className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No ingredients match your filters.
        </section>
      ) : null}
      {filteredIngredients.length > 0 ? (
        <section className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card/70 px-4 py-3 text-sm shadow-sm">
          <span className="text-muted-foreground">
            {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredIngredients.length)} of{" "}
            {filteredIngredients.length}
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                replaceUrlParams({
                  pageSize:
                    Number(value) === ingredientPageSizeCodec.defaultValue
                      ? null
                      : value,
                  page: null,
                });
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
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 1}
              onClick={() => setPage(Math.max(1, safePage - 1))}
            >
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === totalPages}
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
            >
              Next
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
