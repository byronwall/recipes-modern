"use client";

import * as React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { RecipeType } from "@prisma/client";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { H3 } from "~/components/ui/typography";
import { api } from "~/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Plus } from "lucide-react";

type NewRecipe = {
  title: string;
  description: string;
  ingredients: string;
  steps: string;
  type?: RecipeType;
  tagSlugs?: string[];
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
    useForm<NewRecipe>();

  const router = useRouter();

  const createRecipeMutation =
    api.recipe.createRecipeFromTextInput.useMutation();
  const upsertTag = api.tag.upsertByName.useMutation();

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
      className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex items-center gap-4">
          <H3 className="w-36 text-xl">Title</H3>
          <Input
            defaultValue="My Recipe"
            {...register("title")}
            placeholder="Title of the recipe"
            className="w-full text-base font-semibold"
          />
        </div>

        <div className="flex items-center gap-4">
          <H3 className="w-36 text-xl">Type</H3>
          <RadioGroup
            className="flex flex-wrap gap-2"
            onValueChange={(v) => setValue("type", v as RecipeType)}
          >
            {Object.values(RecipeType).map((t) => (
              <div key={t} className="flex items-center gap-2">
                <RadioGroupItem value={t} id={`type-${t}`} />
                <Label htmlFor={`type-${t}`}>{t}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex items-start gap-4">
          <H3 className="w-36 text-xl">Description</H3>
          <Textarea
            autoResize
            placeholder="A short description of the recipe"
            className="text-base"
            {...register("description")}
          />
        </div>

        <div className="flex items-center gap-4">
          <H3 className="w-36 text-xl">Tags</H3>
          <TagSelector
            values={watch("tagSlugs") ?? []}
            onChange={(vals) => setValue("tagSlugs", vals)}
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 md:auto-rows-[1fr] md:grid-cols-2">
        <div className="flex min-h-0 items-start gap-4 self-stretch">
          <H3 className="w-36 text-xl">Ingredients</H3>
          <div className="min-h-0 w-full flex-1 self-stretch">
            <Textarea
              defaultValue={defaultIngredients}
              className="h-full min-h-[200px] text-base md:min-h-0"
              {...register("ingredients")}
            />
          </div>
        </div>

        <div className="flex min-h-0  items-start gap-4">
          <H3 className="w-36 text-xl">Steps</H3>
          <div className="flex min-h-0 w-full flex-grow flex-col self-stretch">
            <p className="mb-2 shrink-0 text-xs text-muted-foreground">
              Step numbers automatically created for new lines.
            </p>
            <div className="min-h-0 flex-grow">
              <Textarea
                defaultValue={defaultSteps}
                {...register("steps")}
                className="h-full min-h-[200px] text-base md:min-h-0"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" isLoading={createRecipeMutation.isPending}>
          Create Recipe
        </Button>
      </div>
    </form>
  );
}

function TagSelector(props: {
  values: string[];
  onChange: (vals: string[]) => void;
}) {
  const { values, onChange } = props;
  const [input, setInput] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [newTagName, setNewTagName] = React.useState("");

  const { data } = api.tag.search.useQuery({ q: input, limit: 10 });

  function addTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = values.some(
      (v) => v.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) return;
    onChange([...values, trimmed]);
    setInput("");
  }

  function removeTag(name: string) {
    onChange(values.filter((v) => v !== name));
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <span key={v} className="rounded bg-muted px-2 py-1 text-xs">
              {v}
              <button
                className="ml-1"
                onClick={() => removeTag(v)}
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Add tag">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a tag</DialogTitle>
              <DialogDescription>
                Create a new tag and add it to this recipe.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="new-tag-name">Tag name</Label>
              <Input
                id="new-tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. Vegetarian"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const name = newTagName.trim();
                  if (!name) return;
                  const exists = values.some(
                    (v) => v.toLowerCase() === name.toLowerCase(),
                  );
                  if (!exists) onChange([...values, name]);
                  setAddOpen(false);
                  setNewTagName("");
                }}
              >
                Add tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search or create tag"
          />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <div className="max-h-60 overflow-auto py-1">
            {data?.length ? (
              data.map((t) => (
                <button
                  key={t.id}
                  className="block w-full px-3 py-2 text-left hover:bg-muted"
                  onClick={() => addTag(t.name)}
                >
                  {t.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No tags
              </div>
            )}
            {input.trim() && (
              <button
                className="block w-full px-3 py-2 text-left hover:bg-muted"
                onClick={() => addTag(input)}
              >
                Create: {input}
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
