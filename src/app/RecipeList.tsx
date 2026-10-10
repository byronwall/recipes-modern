"use client";

import { ImageRole, RecipeType, type Recipe } from "@prisma/client";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Clock, Search, X } from "lucide-react";
import { Input } from "~/components/ui/input";

import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import { RecipeActions } from "./recipes/[id]/RecipeActions";
import { RecipeTagEditor } from "~/components/recipes/RecipeTagEditor";
import ImageLightbox from "~/components/ImageLightbox";
import { buildLightboxImages, getImageUrl } from "~/lib/media";
import { NewRecipeDialog } from "./recipes/new/NewRecipeDialog";
import { CardGrid } from "~/components/layout/CardGrid";
import { PageHeaderCard } from "~/components/layout/PageHeaderCard";
import { PageHeader } from "~/components/layout/PageHeader";
import { cn } from "~/lib/utils";
import { formatMinutes } from "~/lib/formatMinutes";
import { formatRecipeType } from "~/lib/recipeType";
import {
  urlStateCodecs,
  useReplaceUrlParams,
  useUrlState,
} from "~/hooks/use-url-state";

const defaultRecipes: Recipe[] = [];
const recipeSearchCodec = urlStateCodecs.string();
const recipeTypeCodec = urlStateCodecs.optionalEnum(Object.values(RecipeType));
const recipeTagsCodec = urlStateCodecs.csv();

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
  const [search, setSearch] = useUrlState("q", recipeSearchCodec);
  const [type, setType] = useUrlState("type", recipeTypeCodec);
  const [tagSlugs, setTagSlugs] = useUrlState("tags", recipeTagsCodec);
  const replaceUrlParams = useReplaceUrlParams();
  // global add tag dialog handles creation

  const { data: _recipes } = api.recipe.list.useQuery({
    type,
    includeTags: tagSlugs,
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
  const filteredRecipes = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return recipes;
    return recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        (recipe.tags ?? []).some((rt) =>
          rt.tag.name.toLowerCase().includes(query),
        ),
    );
  }, [recipes, deferredSearch]);

  const selectedTags = useMemo(() => {
    const tagsBySlug = new Map(
      [...(popularData ?? []), ...(allTagsData ?? [])].map((tag) => [
        tag.slug,
        tag.name,
      ]),
    );

    return tagSlugs.map((slug) => ({
      slug,
      name: tagsBySlug.get(slug) ?? slug,
    }));
  }, [allTagsData, popularData, tagSlugs]);

  const hasFilters =
    search.trim().length > 0 || Boolean(type) || tagSlugs.length > 0;
  const showDevActions = process.env.NODE_ENV === "development";

  const typeOptions = ["ALL", ...Object.values(RecipeType)] as const;
  const moreTags = (allTagsData ?? [])
    .filter((t) => !(popularData ?? []).some((p) => p.slug === t.slug))
    .filter((t) => !tagSlugs.includes(t.slug));
  const extraSelectedTags = selectedTags.filter(
    (t) => !(popularData ?? []).some((p) => p.slug === t.slug),
  );
  const toggleTag = (slug: string) => {
    setTagSlugs(
      tagSlugs.includes(slug)
        ? tagSlugs.filter((s) => s !== slug)
        : [...tagSlugs, slug],
    );
  };

  return (
    <>
      {/* Global Add Tag Dialog is mounted in layout */}

      <PageHeader
        title="Recipes"
        description={
          _recipes
            ? hasFilters
              ? `${filteredRecipes.length} of ${recipes.length} recipes`
              : `${recipes.length} recipes`
            : undefined
        }
        actions={
          <>
            {showDevActions && (
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                isLoading={seedRecipes.isPending}
                onClick={() => seedRecipes.mutate({ count: 10 })}
              >
                Seed 10 (dev)
              </Button>
            )}
            <NewRecipeDialog />
          </>
        }
      />

      <PageHeaderCard className="flex flex-col gap-3 p-3 sm:p-4">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, description, or tag"
            aria-label="Search recipes"
            className="pl-9"
          />
        </div>

        <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {typeOptions.map((t) => {
            const isActive = (type ?? "ALL") === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  setType(t === "ALL" ? undefined : (t as RecipeType))
                }
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t === "ALL" ? "All types" : formatRecipeType(t)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tags
          </span>
          {(popularData ?? []).map((t) => {
            const selected = tagSlugs.includes(t.slug);
            return (
              <button
                key={t.slug}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleTag(t.slug)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-transparent bg-accent/60 hover:bg-accent",
                )}
              >
                {t.name}
              </button>
            );
          })}
          {extraSelectedTags.map((t) => (
            <button
              key={t.slug}
              type="button"
              aria-pressed
              aria-label={`Remove ${t.name} filter`}
              onClick={() => toggleTag(t.slug)}
              className="flex items-center gap-1 rounded-full border border-primary bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground"
            >
              {t.name}
              <X className="h-3 w-3 shrink-0" />
            </button>
          ))}

          {moreTags.length > 0 && (
            <Select
              value=""
              onValueChange={(slug) => {
                if (!tagSlugs.includes(slug)) setTagSlugs([...tagSlugs, slug]);
              }}
            >
              <SelectTrigger className="h-6 w-auto gap-1 rounded-full border-dashed px-2.5 py-0 text-xs text-muted-foreground">
                <SelectValue placeholder="More tags" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {moreTags.map((t) => (
                  <SelectItem key={t.slug} value={t.slug}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                replaceUrlParams({ q: null, type: null, tags: null });
              }}
              className="ml-auto h-6 px-2 text-xs text-muted-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>
      </PageHeaderCard>

      {_recipes && filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-12 text-center">
          <p className="font-medium">
            {hasFilters ? "No recipes match these filters" : "No recipes yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? search.trim()
                ? `Nothing found for “${search.trim()}”.`
                : "Try a different type or tag."
              : "Create your first recipe to get started."}
          </p>
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                replaceUrlParams({ q: null, type: null, tags: null })
              }
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : null}

      <CardGrid className="sm:grid-cols-2 lg:grid-cols-3">
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
          return (
            <div
              key={recipe.id}
              className="group flex h-full flex-col rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3 p-4 pb-3">
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

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="text-base font-semibold leading-snug hover:text-primary hover:no-underline"
                  >
                    {recipe.name}
                  </Link>
                  {recipe.description &&
                  recipe.description.trim().toLowerCase() !== "desc" ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {recipe.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 px-4 pb-4">
                {recipe.cookMinutes ? (
                  <span className="inline-flex h-6 items-center gap-1 rounded-full bg-muted px-2.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    {formatMinutes(recipe.cookMinutes)}
                  </span>
                ) : null}
                <Select
                  value={recipe.type}
                  onValueChange={(v) =>
                    updateType.mutate({
                      id: recipe.id,
                      type: v as RecipeType,
                    })
                  }
                >
                  <SelectTrigger
                    aria-label="Recipe type"
                    className="h-6 w-auto gap-1 rounded-full border px-2.5 py-0 text-xs"
                  >
                    <SelectValue>{formatRecipeType(recipe.type)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(RecipeType).map((t) => (
                      <SelectItem key={t} value={t}>
                        {formatRecipeType(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <RecipeTagEditor
                  recipeId={recipe.id}
                  tags={tagList.map((rt) => rt.tag)}
                  allTags={allTagsData ?? []}
                  displayLimit={2}
                  confirmRemove
                  onAddTag={async (slug) => {
                    await addTagToRecipe.mutateAsync({
                      recipeId: recipe.id,
                      tagSlug: slug,
                    });
                  }}
                  onRemoveTag={async (slug) => {
                    await removeTagFromRecipe.mutateAsync({
                      recipeId: recipe.id,
                      tagSlug: slug,
                    });
                  }}
                />
              </div>

              <div className="mt-auto border-t px-3 py-2">
                <RecipeActions recipeId={recipe.id} variant="compact" />
              </div>
            </div>
          );
        })}
      </CardGrid>

      <ImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={lightboxImages}
        initialIndex={lightboxIndex}
      />
    </>
  );
}
