"use client";

import { ImageRole, RecipeType, type Recipe } from "@prisma/client";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

import SimpleAlertDialog from "~/components/SimpleAlertDialog";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { openAddTagDialog } from "~/hooks/use-add-tag-dialog";
import { api } from "~/trpc/react";
import { RecipeActions } from "./recipes/[id]/RecipeActions";
import ImageLightbox from "~/components/ImageLightbox";
import { buildLightboxImages, getImageUrl } from "~/lib/media";
import { NewRecipeDialog } from "./recipes/new/NewRecipeDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

const defaultRecipes: Recipe[] = [];

type RecipeWithTags = Recipe & {
  tags?: { tag: { id: string; name: string; slug: string } }[];
  images?:
    | {
        role: ImageRole;
        order: number;
        image: {
          key: string;
          bucket: string;
          alt: string | null;
        };
      }[]
    | undefined;
};

export function RecipeList() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<RecipeType | undefined>(undefined);
  const [tags, setTags] = useState<{ slug: string; name: string }[]>([]);
  // controlled select value per recipe so we can reset after applying
  const [addSelectValues, setAddSelectValues] = useState<
    Record<number, string | undefined>
  >({});
  // global add tag dialog handles creation

  const { data: _recipes } = api.recipe.list.useQuery({
    type,
    includeTags: tags.map((t) => t.slug),
  });

  // popular and all tags for picker UI
  const { data: popularData } = api.tag.popular.useQuery({ limit: 5 });
  const { data: allTagsData } = api.tag.all.useQuery();
  const utils = api.useUtils();
  const seedRecipes = api.recipe.seedDevRecipes.useMutation({
    onSuccess: () => utils.recipe.list.invalidate(),
  });

  const updateType = api.recipe.updateRecipeType.useMutation({
    onSuccess: () => utils.recipe.list.invalidate(),
  });
  const addTagToRecipe = api.tag.addTagToRecipe.useMutation({
    onSuccess: () => utils.recipe.list.invalidate(),
  });
  const removeTagFromRecipe = api.tag.removeTagFromRecipe.useMutation({
    onSuccess: () => utils.recipe.list.invalidate(),
  });
  // creation handled in global dialog

  const recipes: RecipeWithTags[] =
    (_recipes as RecipeWithTags[] | undefined) ??
    (defaultRecipes as RecipeWithTags[]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<
    { url: string; alt?: string | null; caption?: string | null }[]
  >([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const deferredSearch = useDeferredValue(search);
  // prevent undefined?
  const filteredRecipes = useMemo(
    () =>
      recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(deferredSearch.toLowerCase()),
      ),
    [recipes, deferredSearch],
  );

  const hasFilters =
    search.trim().length > 0 || Boolean(type) || tags.length > 0;
  const showDevActions = process.env.NODE_ENV === "development";

  return (
    <>
      {/* Global Add Tag Dialog is mounted in layout */}

      <div className="mb-6 rounded-2xl border bg-card/70 p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col gap-3">
            <Label className="text-xs uppercase text-muted-foreground">
              Search
            </Label>
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipes"
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Label className="whitespace-nowrap text-xs uppercase text-muted-foreground">
                Tags
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                {(popularData ?? []).map((t) => {
                  const selected = tags.some((x) => x.slug === t.slug);
                  return (
                    <Button
                      key={t.slug}
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => {
                        if (selected) {
                          setTags(tags.filter((x) => x.slug !== t.slug));
                        } else {
                          setTags([...tags, { slug: t.slug, name: t.name }]);
                        }
                      }}
                    >
                      {t.name}
                    </Button>
                  );
                })}
              </div>

              <Select
                onValueChange={(slug) => {
                  const exists = tags.some((t) => t.slug === slug);
                  if (exists) return;
                  const picked = (allTagsData ?? []).find(
                    (t) => t.slug === slug,
                  );
                  if (picked)
                    setTags([...tags, { slug: picked.slug, name: picked.name }]);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="More tags" />
                </SelectTrigger>
                <SelectContent>
                  {(allTagsData ?? [])
                    .filter(
                      (t) =>
                        !(popularData ?? []).some((p) => p.slug === t.slug),
                    )
                    .filter((t) => !tags.some((x) => x.slug === t.slug))
                    .map((t) => (
                      <SelectItem key={t.slug} value={t.slug}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTags([]);
                    setType(undefined);
                    setSearch("");
                  }}
                  className="text-muted-foreground"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase text-muted-foreground">
              Type
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                className="flex flex-wrap gap-2"
                value={(type ?? "ALL") as string}
                onValueChange={(v) => {
                  if (!v || v === "ALL") {
                    setType(undefined);
                  } else {
                    setType(v as RecipeType);
                  }
                }}
              >
                <ToggleGroupItem value="ALL">All</ToggleGroupItem>
                {Object.values(RecipeType).map((t) => (
                  <ToggleGroupItem key={t} value={t}>
                    {t}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {showDevActions && (
                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={seedRecipes.isPending}
                  onClick={() => seedRecipes.mutate({ count: 10 })}
                >
                  Seed 10 Recipes
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t.slug}
                className="rounded-full bg-muted px-3 py-1 text-xs"
              >
                {t.name}
                <button
                  className="ml-1"
                  onClick={() => setTags(tags.filter((x) => x.slug !== t.slug))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <NewRecipeDialog />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredRecipes.map((recipe) => {
          const primaryImage =
            (recipe.images ?? []).find((ri) => ri.role === ImageRole.HERO) ??
            (recipe.images ?? [])[0];
          const imageUrl = primaryImage
            ? getImageUrl({
                bucket: primaryImage.image.bucket,
                key: primaryImage.image.key,
              })
            : undefined;
          const tagList = recipe.tags ?? [];
          const visibleTags = tagList.slice(0, 2);
          const hiddenTags = tagList.slice(2);
          return (
            <div
              key={recipe.id}
              className="flex h-full flex-col rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3 p-3">
                {imageUrl ? (
                  <button
                    type="button"
                    aria-label="Open image"
                    onClick={() => {
                      const imgs = buildLightboxImages(recipe.images ?? []);
                      const idx = Math.max(
                        0,
                        Math.min(
                          imgs.findIndex((x) => x.url === imageUrl),
                          Math.max(0, imgs.length - 1),
                        ),
                      );
                      setLightboxImages(imgs);
                      setLightboxIndex(idx < 0 ? 0 : idx);
                      setLightboxOpen(true);
                    }}
                    className="h-14 w-14 flex-none overflow-hidden rounded-xl ring-1 ring-muted"
                  >
                    <img
                      src={imageUrl}
                      alt={primaryImage?.image.alt ?? ""}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ) : null}

                <div className="flex w-full flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="text-base font-semibold leading-tight hover:underline"
                    >
                      {recipe.name}
                    </Link>
                  </div>
                  {recipe.description &&
                  recipe.description.trim().toLowerCase() !== "desc" ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {recipe.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="px-3 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={recipe.type}
                    onValueChange={(v) =>
                      updateType.mutate({
                        id: recipe.id,
                        type: v as RecipeType,
                      })
                    }
                  >
                    <SelectTrigger className="h-7 w-auto rounded-full border px-3 py-0 text-xs">
                      <SelectValue placeholder={recipe.type} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(RecipeType).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {visibleTags.map((rt) => (
                    <span
                      key={rt.tag.id}
                      className="flex items-center gap-1 rounded-full bg-muted px-3 py-0.5 text-xs"
                    >
                      {rt.tag.name}
                      <SimpleAlertDialog
                        title="Remove tag?"
                        description={`Remove “${rt.tag.name}” from this recipe?`}
                        confirmText="Remove"
                        trigger={
                          <button
                            aria-label={`Remove ${rt.tag.name}`}
                            className="-mr-1 ml-1 rounded px-1 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                          >
                            ×
                          </button>
                        }
                        onConfirm={async () => {
                          await removeTagFromRecipe.mutateAsync({
                            recipeId: recipe.id,
                            tagSlug: rt.tag.slug,
                          });
                        }}
                      />
                    </span>
                  ))}
                  {hiddenTags.length > 0 && (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground">
                            +{hiddenTags.length} more
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          {tagList.map((t) => t.tag.name).join(", ")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <Select
                    value={addSelectValues[recipe.id] ?? ""}
                    onValueChange={async (slug) => {
                      if (slug === "__new__") {
                        openAddTagDialog({
                          recipeId: recipe.id,
                          existingTagSlugs: (recipe.tags ?? []).map(
                            (rt) => rt.tag.slug,
                          ),
                          onSuccess: () =>
                            setAddSelectValues((prev) => ({
                              ...prev,
                              [recipe.id]: "",
                            })),
                        });
                        return;
                      }
                      await addTagToRecipe.mutateAsync({
                        recipeId: recipe.id,
                        tagSlug: slug,
                      });
                      setAddSelectValues((prev) => ({
                        ...prev,
                        [recipe.id]: "",
                      }));
                    }}
                  >
                    <SelectTrigger className="h-7 w-auto rounded-full bg-muted px-3 py-0 text-xs text-muted-foreground hover:bg-muted/80">
                      + Tag
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="__new__">Add new tag…</SelectItem>
                      {(allTagsData ?? [])
                        .filter(
                          (t) =>
                            !(recipe.tags ?? []).some(
                              (rt) => rt.tag.slug === t.slug,
                            ),
                        )
                        .map((t) => (
                          <SelectItem key={t.slug} value={t.slug}>
                            {t.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-auto border-t px-3 py-2">
                <div className="flex w-full">
                  <RecipeActions recipeId={recipe.id} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={lightboxImages}
        initialIndex={lightboxIndex}
      />
    </>
  );
}
