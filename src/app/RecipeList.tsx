"use client";

import { RecipeType, type Recipe } from "@prisma/client";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
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

const defaultRecipes: Recipe[] = [];

type RecipeWithTags = Recipe & {
  tags?: { tag: { id: string; name: string; slug: string } }[];
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

  const deferredSearch = useDeferredValue(search);
  // prevent undefined?
  const filteredRecipes = useMemo(
    () =>
      recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(deferredSearch.toLowerCase()),
      ),
    [recipes, deferredSearch],
  );

  return (
    <>
      {/* Global Add Tag Dialog is mounted in layout */}

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name"
          className="max-w-xs"
        />

        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">Type</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="flex flex-wrap "
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
        </div>
      </div>

      {/* Tags row: popular buttons first, then dropdown for the rest */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Label className="whitespace-nowrap">Tags</Label>
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
            const picked = (allTagsData ?? []).find((t) => t.slug === slug);
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
                (t) => !(popularData ?? []).some((p) => p.slug === t.slug),
              )
              .filter((t) => !tags.some((x) => x.slug === t.slug))
              .map((t) => (
                <SelectItem key={t.slug} value={t.slug}>
                  {t.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {tags.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTags([])}
            className="text-muted-foreground"
          >
            Clear
          </Button>
        )}

        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t.slug} className="rounded bg-muted px-2 py-1 text-xs">
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
      </div>
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
                  <div className="flex flex-col">
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="self-start hover:underline"
                    >
                      <span className="whitespace-nowrap font-medium">
                        {recipe.name}
                      </span>
                    </Link>
                    {recipe.description &&
                    recipe.description.trim().toLowerCase() !== "desc" ? (
                      <span className="line-clamp-2 max-w-[48ch] text-muted-foreground">
                        {recipe.description}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {/* Category dropdown chip */}
                    <Select
                      value={recipe.type}
                      onValueChange={(v) =>
                        updateType.mutate({
                          id: recipe.id,
                          type: v as RecipeType,
                        })
                      }
                    >
                      <SelectTrigger className="h-6 w-auto rounded border px-2 py-0 text-xs">
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

                    {/* Existing tags with remove option */}
                    {recipe.tags?.map((rt) => (
                      <span
                        key={rt.tag.id}
                        className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs"
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

                    {/* Add tag via + dropdown */}
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
                        // reset selection so user can click + again
                        setAddSelectValues((prev) => ({
                          ...prev,
                          [recipe.id]: "",
                        }));
                      }}
                    >
                      <SelectTrigger className="h-6 w-auto rounded bg-muted px-2 py-0 text-xs text-muted-foreground hover:bg-muted/80">
                        +
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
