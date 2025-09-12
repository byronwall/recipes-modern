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
      className="flex  flex-col gap-8"
    >
      <div className="flex items-center gap-4">
        <H3 className="w-36">Title</H3>
        <Input
          defaultValue="My Recipe"
          {...register("title")}
          placeholder="Title of the recipe"
          className="w-full text-lg font-bold"
        />
      </div>

      <div className="flex items-center gap-4">
        <H3 className="w-36">Description</H3>
        <Textarea
          autoResize
          placeholder="A short description of the recipe"
          className="text-lg"
          {...register("description")}
        />
      </div>

      <div className="flex items-center gap-4">
        <H3 className="w-36">Ingredients</H3>
        <Textarea
          autoResize
          defaultValue={defaultIngredients}
          className="text-lg"
          {...register("ingredients")}
        />
      </div>

      <div className="flex items-center gap-4">
        <H3 className="w-36">Steps</H3>
        <div className="w-full">
          <p className="mb-2 text-sm text-muted-foreground">
            Step numbers automatically created for new lines.
          </p>
          <Textarea
            defaultValue={defaultSteps}
            {...register("steps")}
            className="text-lg"
            autoResize
          />
        </div>
      </div>
    </form>
  );
}
