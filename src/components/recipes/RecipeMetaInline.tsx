"use client";

import { RecipeType } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { RecipeTagEditor } from "~/components/recipes/RecipeTagEditor";
import { api } from "~/trpc/react";
import { type Recipe } from "~/app/recipes/[id]/recipe-types";

export function RecipeMetaInline(props: { recipe: Recipe }) {
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

  return (
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

      <RecipeTagEditor
        recipeId={recipe.id}
        tags={(recipe.tags ?? []).map((rt) => rt.tag)}
        allTags={allTagsData ?? []}
        chipClassName="bg-accent/60"
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
  );
}
