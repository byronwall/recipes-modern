"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { H3 } from "~/components/ui/typography";
import { api } from "~/trpc/react";

type NewRecipe = {
  title: string;
  description: string;
  ingredients: string;
  steps: string;
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
  const { register, handleSubmit, formState } = useForm<NewRecipe>();

  const router = useRouter();

  const createRecipeMutation =
    api.recipe.createRecipeFromTextInput.useMutation();

  useEffect(() => {
    onSubmittingChange?.(formState.isSubmitting);
  }, [formState.isSubmitting, onSubmittingChange]);

  const onSubmit: SubmitHandler<NewRecipe> = async (data) => {
    const res = await createRecipeMutation.mutateAsync(data);

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

        <div className="flex items-start gap-4">
          <H3 className="w-36 text-xl">Description</H3>
          <Textarea
            autoResize
            placeholder="A short description of the recipe"
            className="text-base"
            {...register("description")}
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
    </form>
  );
}
