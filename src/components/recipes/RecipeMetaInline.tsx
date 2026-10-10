"use client";

import { RecipeType } from "@prisma/client";
import { Clock } from "lucide-react";
import { formatMinutes } from "~/lib/formatMinutes";
import { formatRecipeType } from "~/lib/recipeType";
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
        <span className="inline-flex h-7 items-center gap-1 rounded-full bg-muted px-3 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {formatMinutes(recipe.cookMinutes)}
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
        <SelectTrigger
          aria-label="Recipe type"
          className="h-7 w-auto gap-1 rounded-full border px-3 py-0 text-xs"
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
