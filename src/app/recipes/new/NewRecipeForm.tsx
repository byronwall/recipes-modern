"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Label } from "~/components/ui/label";
import { RecipeType } from "@prisma/client";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import { InlineTagEditor } from "~/components/recipes/InlineTagEditor";

type NewRecipe = {
  title: string;
  description: string;
  ingredients: string;
  steps: string;
  type?: RecipeType;
  tagSlugs?: string[];
  cookMinutes?: number;
};

type NewRecipeFormProps = {
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

const defaultIngredients = `[Main Ingredients]
1 cup of flour

`;

const defaultSteps = `[Main Steps]
Mix flour with water

`;

export function NewRecipeForm({
  formId,
  onSubmittingChange,
}: NewRecipeFormProps) {
  const { register, handleSubmit, formState, setValue, watch } =
    useForm<NewRecipe>({
      defaultValues: {
        title: "My Recipe",
        description: "",
        ingredients: defaultIngredients,
        steps: defaultSteps,
        type: undefined,
        tagSlugs: [],
        cookMinutes: undefined,
      },
    });

  const router = useRouter();

  const createRecipeMutation =
    api.recipe.createRecipeFromTextInput.useMutation();
  const upsertTag = api.tag.upsertByName.useMutation();
  const selectedType = watch("type");
  const cookMinutes = watch("cookMinutes");
  const tagValues = watch("tagSlugs") ?? [];

  useEffect(() => {
    onSubmittingChange?.(formState.isSubmitting);
  }, [formState.isSubmitting, onSubmittingChange]);

  const onSubmit: SubmitHandler<NewRecipe> = async (data) => {
    // ensure tags exist by upserting any typed names
    const tags = (data.tagSlugs ?? []).map((t) => t.trim()).filter(Boolean);
    for (const name of tags) {
      await upsertTag.mutateAsync({ name });
    }
    const slugs = tags.map((name) => name.toLowerCase().replace(/\s+/g, "-"));
    const res = await createRecipeMutation.mutateAsync({
      ...data,
      tagSlugs: slugs,
    });

    router.push(`/recipes/${res.id}`);
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="min-h-0 overflow-y-auto pr-1"
    >
      <div className="grid gap-4 pb-2 md:gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:grid-cols-[7.5rem_minmax(0,1fr)] md:items-center md:gap-1.5">
            <Label htmlFor="new-recipe-title">Name</Label>
            <Input
              id="new-recipe-title"
              {...register("title")}
              placeholder="Title of the recipe"
              className="h-12 text-base"
              autoFocus
            />
          </div>

          <div className="grid gap-2 md:grid-cols-[7.5rem_minmax(0,1fr)] md:items-center md:gap-1.5">
            <Label htmlFor="new-recipe-cook-minutes">
              Cooking time (minutes)
            </Label>
            <Input
              id="new-recipe-cook-minutes"
              type="number"
              min={0}
              placeholder="e.g. 30"
              value={cookMinutes ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setValue("cookMinutes", val ? Number(val) : undefined);
              }}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:grid-cols-[7.5rem_minmax(0,1fr)] md:items-start md:gap-1.5">
            <Label htmlFor="new-recipe-description" className="md:pt-2">
              Description
            </Label>
            <Textarea
              id="new-recipe-description"
              autoResize
              placeholder="A short description of the recipe"
              className="min-h-[72px] text-base"
              {...register("description")}
            />
          </div>

          <div className="grid gap-2 md:grid-cols-[7.5rem_minmax(0,1fr)] md:items-center md:gap-1.5">
            <Label>Type</Label>
            <Select
              value={selectedType ?? "__none__"}
              onValueChange={(v) =>
                setValue(
                  "type",
                  v === "__none__" ? undefined : (v as RecipeType),
                )
              }
            >
              <SelectTrigger className="h-8 w-fit min-w-[160px] rounded-full border px-3 py-0 text-xs capitalize">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No type</SelectItem>
                {Object.values(RecipeType).map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:grid-cols-[7.5rem_minmax(0,1fr)] md:items-start md:gap-1.5">
            <Label className="md:pt-2">Tags</Label>
            <InlineTagEditor
              values={tagValues}
              onChange={(vals) => setValue("tagSlugs", vals)}
              controlsLayout="stacked"
              addButtonClassName="md:-ml-[8rem]"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:grid-cols-[7.5rem_minmax(0,1fr)] md:items-start md:gap-1.5">
            <Label htmlFor="new-recipe-ingredients" className="md:pt-2">
              Ingredients
            </Label>
            <Textarea
              id="new-recipe-ingredients"
              className="min-h-[220px] text-base md:min-h-[200px]"
              {...register("ingredients")}
            />
          </div>

          <div className="grid gap-2 md:grid-cols-[7.5rem_minmax(0,1fr)] md:items-start md:gap-1.5">
            <Label htmlFor="new-recipe-steps" className="md:pt-2">
              Steps
            </Label>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Step numbers automatically created for new lines.
              </p>
              <Textarea
                id="new-recipe-steps"
                {...register("steps")}
                className="min-h-[220px] text-base md:min-h-[200px]"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
