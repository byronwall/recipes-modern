"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { Button } from "~/components/ui/button";
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

const defaultIngredients = `[Main Ingredients]
1 cup of flour
`;

const defaultSteps = `[Main Steps]
1. Mix flour with water
`;

export function NewRecipeForm() {
  const { register, handleSubmit } = useForm<NewRecipe>();

  const createRecipeMutation =
    api.recipe.createRecipeFromTextInput.useMutation();

  const onSubmit: SubmitHandler<NewRecipe> = async (data) => {
    await createRecipeMutation.mutateAsync(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-[600px] flex-col gap-2"
    >
      <H3>Title</H3>
      <Input defaultValue="My Recipe" {...register("title")} />

      <H3>Description</H3>
      <Textarea
        autoResize
        placeholder="A short description of the recipe"
        {...register("description")}
      />

      <H3>Ingredients</H3>

      <Textarea
        autoResize
        defaultValue={defaultIngredients}
        {...register("ingredients")}
      />

      <H3>Steps</H3>
      <p className="mb-2 text-sm text-muted-foreground">
        Step numbers automatically created for new lines.
      </p>

      <Textarea defaultValue={defaultSteps} {...register("steps")} />

      <Button type="submit">Create Recipe!</Button>
    </form>
  );
}
