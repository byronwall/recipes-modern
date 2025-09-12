"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { H2 } from "~/components/ui/typography";
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
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { api, type RouterOutputs } from "~/trpc/react";
import { IngredientList } from "./IngredientList";
import { RecipeActions } from "./RecipeActions";
import { StepList } from "./StepList";
import { CookingModeOverlay } from "./CookingModeOverlay";

export type Recipe = NonNullable<RouterOutputs["recipe"]["getRecipe"]>;

export function RecipeClient(props: { id: number }) {
  const { id } = props;

  const { data: recipe } = api.recipe.getRecipe.useQuery({
    id,
  });

  const utils = api.useUtils();
  const updateMutation = api.recipe.updateRecipeMeta.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id });
      setOpen(false);
    },
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  return (
    <div className="relative w-full space-y-2">
      <H2 className="flex items-center gap-2">
        <span>{recipe.name}</span>
        <Dialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val);
            if (val) {
              setName(recipe.name ?? "");
              setDescription(recipe.description ?? "");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Edit recipe">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit recipe</DialogTitle>
              <DialogDescription>
                Update the name and description for this recipe.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                await updateMutation.mutateAsync({
                  id,
                  name: name.trim(),
                  description: description ?? "",
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="recipe-name">Name</Label>
                <Input
                  id="recipe-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipe-description">Description</Label>
                <Textarea
                  id="recipe-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  autoResize
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={updateMutation.isPending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </H2>
      {recipe.description &&
      recipe.description.trim().toLowerCase() !== "desc" ? (
        <p className="max-w-prose text-muted-foreground">
          {recipe.description}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <RecipeActions recipeId={recipe.id} />
      </div>

      <IngredientList recipe={recipe} />

      <StepList recipe={recipe} />

      <CookingModeOverlay recipe={recipe} />
    </div>
  );
}
