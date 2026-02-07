"use client";

import { Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { useRecipeActions } from "~/app/useRecipeActions";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { IngredientList } from "./IngredientList";
import { StepList } from "./StepList";
import { CookingModeOverlay } from "./CookingModeOverlay";
import { RecipeHeader } from "./RecipeHeader";
import { RecipeImagesSection } from "./RecipeImagesSection";
import { CardGrid } from "~/components/layout/CardGrid";
import { IngredientListEditMode } from "./IngredientListEditMode";
import { StepListEditMode } from "./StepListEditMode";
import { type Recipe } from "./recipe-types";
import { EditModeActionButtons } from "./EditModeActionButtons";
import { DiscardChangesDialog } from "./DiscardChangesDialog";

export function RecipeClient(props: { id: number }) {
  const { id } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [ingredientGroupsDraft, setIngredientGroupsDraft] = useState<
    Recipe["ingredientGroups"]
  >([]);
  const [stepGroupsDraft, setStepGroupsDraft] = useState<Recipe["stepGroups"]>(
    [],
  );
  const { updateIngredientGroups, updateStepGroups } = useRecipeActions();
  const utils = api.useUtils();

  const { data: recipe } = api.recipe.getRecipe.useQuery({
    id,
  });

  const hasIngredientChanges = recipe
    ? JSON.stringify(ingredientGroupsDraft) !==
      JSON.stringify(recipe.ingredientGroups)
    : false;
  const hasStepChanges = recipe
    ? JSON.stringify(stepGroupsDraft) !== JSON.stringify(recipe.stepGroups)
    : false;
  const hasAnyChanges = hasIngredientChanges || hasStepChanges;

  useEffect(() => {
    if (!isEditing || !recipe) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();

        if (isCancelConfirmOpen) {
          return;
        }

        if (hasAnyChanges) {
          setIsCancelConfirmOpen(true);
          return;
        }

        setIsEditing(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [hasAnyChanges, isCancelConfirmOpen, isEditing, recipe]);

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  function beginEditing() {
    setIngredientGroupsDraft(recipe.ingredientGroups);
    setStepGroupsDraft(recipe.stepGroups);
    setIsEditing(true);
  }

  function handleCancelRequest() {
    if (!hasAnyChanges) {
      setIsEditing(false);
      return;
    }

    setIsCancelConfirmOpen(true);
  }

  async function handleSaveAll() {
    if (!hasAnyChanges) {
      setIsEditing(false);
      return;
    }

    await Promise.all([
      updateIngredientGroups.mutateAsync({
        recipeId: recipe.id,
        ingredientGroups: ingredientGroupsDraft,
      }),
      updateStepGroups.mutateAsync({
        recipeId: recipe.id,
        stepGroups: stepGroupsDraft,
      }),
    ]);
    await utils.recipe.getRecipe.invalidate({ id: recipe.id });

    setIsEditing(false);
  }

  return (
    <div className="relative w-full space-y-6">
      <RecipeHeader recipe={recipe} />

      {isEditing ? (
        <section className="space-y-4 rounded-xl border bg-card/70 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Editing mode
              </p>
              <p className="text-sm text-muted-foreground">
                Editing ingredients and instructions together. Press Save to
                apply all changes.
              </p>
            </div>

            <EditModeActionButtons
              onSave={handleSaveAll}
              onCancel={handleCancelRequest}
              isSaving={
                updateIngredientGroups.isPending || updateStepGroups.isPending
              }
              className="flex items-center gap-3"
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-3xl font-bold tracking-tight">ingredients</h3>
              <p className="text-sm text-muted-foreground">
                Ingredients are organized in editable groups.
              </p>
              <IngredientListEditMode
                ingredientGroups={ingredientGroupsDraft}
                originalIngredientGroups={recipe.ingredientGroups}
                onIngredientGroupsChange={setIngredientGroupsDraft}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-3xl font-bold tracking-tight">
                instructions
              </h3>
              <p className="text-sm text-muted-foreground">
                Steps are organized in editable groups.
              </p>
              <StepListEditMode
                stepGroups={stepGroupsDraft}
                originalStepGroups={recipe.stepGroups}
                onStepGroupsChange={setStepGroupsDraft}
              />
            </div>
          </div>

          <EditModeActionButtons
            onSave={handleSaveAll}
            onCancel={handleCancelRequest}
            isSaving={
              updateIngredientGroups.isPending || updateStepGroups.isPending
            }
            className="flex justify-end gap-3 pt-2"
          />

          <DiscardChangesDialog
            open={isCancelConfirmOpen}
            onOpenChange={setIsCancelConfirmOpen}
            onConfirmDiscard={() => {
              setIsCancelConfirmOpen(false);
              setIsEditing(false);
            }}
          />
        </section>
      ) : (
        <>
          <div className="flex justify-end">
            <Button onClick={beginEditing} className="rounded-md">
              <Edit className="shrink-0" />
              Edit Recipe Content
            </Button>
          </div>
          <CardGrid className="lg:grid-cols-[2fr_3fr]">
            <section className="rounded-xl border bg-card/70 p-6 shadow-sm">
              <IngredientList recipe={recipe} />
            </section>
            <section className="rounded-xl border bg-card/70 p-6 shadow-sm">
              <StepList recipe={recipe} />
            </section>
          </CardGrid>
        </>
      )}

      <CookingModeOverlay recipe={recipe} />

      <RecipeImagesSection recipe={recipe} />
    </div>
  );
}
