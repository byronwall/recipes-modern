"use client";

import { useState } from "react";
import { RecipeType } from "@prisma/client";
import { Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Textarea } from "~/components/ui/textarea";
import { InlineTagEditor } from "~/components/recipes/InlineTagEditor";
import { api } from "~/trpc/react";
import { type Recipe } from "./recipe-types";

export function RecipeEditDialog(props: { recipe: Recipe }) {
  const { recipe } = props;
  const utils = api.useUtils();
  const updateMutation = api.recipe.updateRecipeMeta.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id: recipe.id });
      setOpen(false);
    },
  });
  const setTagsMutation = api.tag.setTagsForRecipe.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id: recipe.id });
    },
  });
  const upsertTag = api.tag.upsertByName.useMutation();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<RecipeType | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [cookMinutes, setCookMinutes] = useState<number | undefined>(undefined);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (val) {
          setName(recipe.name ?? "");
          setDescription(recipe.description ?? "");
          setType(recipe.type);
          setCookMinutes(
            typeof recipe.cookMinutes === "number"
              ? recipe.cookMinutes
              : undefined,
          );
          setTags(
            (recipe.tags ?? []).map((rt) => rt.tag.name).filter(Boolean),
          );
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Edit recipe">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit recipe</DialogTitle>
          <DialogDescription>Update recipe details.</DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-6"
          onSubmit={async (e) => {
            e.preventDefault();
            await updateMutation.mutateAsync({
              id: recipe.id,
              name: name.trim(),
              description: description ?? "",
              type,
              cookMinutes,
            });
            const tagNames = tags.map((t) => t.trim()).filter(Boolean);
            for (const name of tagNames) {
              await upsertTag.mutateAsync({ name });
            }
            const slugs = tagNames.map((n) =>
              n.toLowerCase().replace(/\s+/g, "-"),
            );
            await setTagsMutation.mutateAsync({
              recipeId: recipe.id,
              tagSlugs: slugs,
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="recipe-name">Name</Label>
              <Input
                id="recipe-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="recipe-description">Description</Label>
              <Textarea
                id="recipe-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoResize
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <RadioGroup
                className="flex flex-wrap gap-2"
                value={type}
                onValueChange={(v) => setType(v as RecipeType)}
              >
                {Object.values(RecipeType).map((t) => {
                  const selected = type === t;
                  return (
                    <label
                      key={t}
                      htmlFor={`edit-type-${t}`}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm capitalize transition ${
                        selected
                          ? "bg-muted"
                          : "bg-background hover:bg-muted/60"
                      }`}
                    >
                      <RadioGroupItem
                        value={t}
                        id={`edit-type-${t}`}
                        className="sr-only"
                      />
                      <span>{t.toLowerCase()}</span>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipe-cook-minutes">
                Cooking time (minutes)
              </Label>
              <Input
                id="recipe-cook-minutes"
                type="number"
                min={0}
                placeholder="e.g. 30"
                value={cookMinutes ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setCookMinutes(val ? Number(val) : undefined);
                }}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Tags</Label>
              <InlineTagEditor values={tags} onChange={setTags} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
