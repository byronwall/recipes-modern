"use client";

import { useState } from "react";
import { RecipeType } from "@prisma/client";
import { H2 } from "~/components/ui/typography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import { openAddTagDialog } from "~/hooks/use-add-tag-dialog";
import { RecipeActionsPanel } from "./RecipeActionsPanel";
import { RecipeEditDialog } from "./RecipeEditDialog";
import { type Recipe } from "./recipe-types";

export function RecipeHeader(props: { recipe: Recipe }) {
  const { recipe } = props;
  const utils = api.useUtils();
  const updateType = api.recipe.updateRecipeType.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id: recipe.id });
    },
  });
  const addTagToRecipe = api.tag.addTagToRecipe.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id: recipe.id });
    },
  });
  const removeTagFromRecipe = api.tag.removeTagFromRecipe.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id: recipe.id });
    },
  });
  const { data: allTagsData } = api.tag.all.useQuery();

  const [addSelectValues, setAddSelectValues] = useState<
    Record<number, string | undefined>
  >({});

  return (
    <section className="rounded-2xl border bg-card/70 p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <H2 className="flex items-center gap-2 border-b-0 pb-0">
              <span>{recipe.name}</span>
            </H2>
            <RecipeEditDialog recipe={recipe} />
          </div>

          {recipe.description &&
          recipe.description.trim().toLowerCase() !== "desc" ? (
            <p className="max-w-prose text-muted-foreground">
              {recipe.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {typeof recipe.cookMinutes === "number" && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {recipe.cookMinutes} min
              </span>
            )}

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

            {(recipe.tags ?? []).map((rt) => (
              <span
                key={rt.tag.id}
                className="flex items-center gap-1 rounded-full bg-accent/60 px-3 py-0.5 text-xs"
              >
                {rt.tag.name}
                <button
                  aria-label={`Remove ${rt.tag.name}`}
                  className="-mr-1 ml-1 rounded px-1 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                  onClick={async () => {
                    await removeTagFromRecipe.mutateAsync({
                      recipeId: recipe.id,
                      tagSlug: rt.tag.slug,
                    });
                  }}
                >
                  ×
                </button>
              </span>
            ))}

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

        <RecipeActionsPanel recipeId={recipe.id} />
      </div>
    </section>
  );
}
