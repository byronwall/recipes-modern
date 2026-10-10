"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRecipeActions } from "~/app/useRecipeActions";
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
  const [pendingScrollTarget, setPendingScrollTarget] = useState<
    "ingredients" | "instructions" | null
  >(null);
  const [ingredientGroupsDraft, setIngredientGroupsDraft] = useState<
    Recipe["ingredientGroups"]
  >([]);
  const [stepGroupsDraft, setStepGroupsDraft] = useState<Recipe["stepGroups"]>(
    [],
  );
  const { updateRecipeContent } = useRecipeActions();
  const utils = api.useUtils();
  const [ingredientsSectionEl, setIngredientsSectionEl] =
    useState<HTMLDivElement | null>(null);
  const [instructionsSectionEl, setInstructionsSectionEl] =
    useState<HTMLDivElement | null>(null);

  const {
    data: recipe,
    isLoading,
    error,
  } = api.recipe.getRecipe.useQuery({
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
      if (event.key === "Escape" && !updateRecipeContent.isPending) {
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
  }, [
    hasAnyChanges,
    isCancelConfirmOpen,
    isEditing,
    recipe,
    updateRecipeContent.isPending,
  ]);

  useEffect(() => {
    if (!isEditing || !pendingScrollTarget) {
      return;
    }

    const targetEl =
      pendingScrollTarget === "instructions"
        ? instructionsSectionEl
        : ingredientsSectionEl;

    if (!targetEl) {
      return;
    }

    requestAnimationFrame(() => {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      setPendingScrollTarget(null);
    });
  }, [
    ingredientsSectionEl,
    instructionsSectionEl,
    isEditing,
    pendingScrollTarget,
  ]);

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading recipe…</p>;
  if (error)
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load recipe: {error.message}
      </p>
    );
  if (!recipe) {
    return (
      <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
        <p className="font-medium">Recipe not found</p>
        <Link href="/" className="text-sm text-primary">
          Back to recipes
        </Link>
      </div>
    );
  }
  const recipeData = recipe;

  function beginEditing(target: "ingredients" | "instructions") {
    setIngredientGroupsDraft(recipeData.ingredientGroups);
    setStepGroupsDraft(recipeData.stepGroups);
    setPendingScrollTarget(target);
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

    try {
      await updateRecipeContent.mutateAsync({
        recipeId: recipeData.id,
        ingredientGroups: ingredientGroupsDraft,
        stepGroups: stepGroupsDraft,
      });
    } catch {
      return; // Keep the draft open; the mutation error appears in a toast.
    }
    await utils.recipe.getRecipe.invalidate({ id: recipeData.id });

    setIsEditing(false);
  }

  return (
    <div className="relative w-full space-y-6">
      <RecipeHeader recipe={recipe} />

      {isEditing ? (
        <section className="space-y-4 rounded-2xl border bg-card/70 p-5 shadow-sm sm:p-6">
          <div className="sticky top-14 z-10 -mx-5 -mt-5 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b bg-background/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Editing recipe</p>
              <p className="text-xs text-muted-foreground">
                {hasAnyChanges
                  ? "You have unsaved changes."
                  : "Ingredients and instructions save together."}
              </p>
            </div>

            <EditModeActionButtons
              onSave={handleSaveAll}
              onCancel={handleCancelRequest}
              isSaving={updateRecipeContent.isPending}
              className="flex items-center gap-3"
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-3" ref={setIngredientsSectionEl}>
              <h3 className="text-xl font-semibold tracking-tight">
                Ingredients
              </h3>
              <p className="text-sm text-muted-foreground">
                Ingredients are organized in editable groups.
              </p>
              <IngredientListEditMode
                ingredientGroups={ingredientGroupsDraft}
                originalIngredientGroups={recipe.ingredientGroups}
                onIngredientGroupsChange={setIngredientGroupsDraft}
              />
            </div>

            <div className="space-y-3" ref={setInstructionsSectionEl}>
              <h3 className="text-xl font-semibold tracking-tight">
                Instructions
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
            isSaving={updateRecipeContent.isPending}
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
          <CardGrid className="items-start lg:grid-cols-[2fr_3fr]">
            <section className="rounded-2xl border bg-card/70 p-5 shadow-sm sm:p-6">
              <IngredientList
                recipe={recipeData}
                onStartEditing={() => beginEditing("ingredients")}
              />
            </section>
            <section className="rounded-2xl border bg-card/70 p-5 shadow-sm sm:p-6">
              <StepList
                recipe={recipeData}
                onStartEditing={() => beginEditing("instructions")}
              />
            </section>
          </CardGrid>
        </>
      )}

      <CookingModeOverlay recipe={recipeData} />

      <RecipeImagesSection recipe={recipeData} />
    </div>
  );
}
