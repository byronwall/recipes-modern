"use client";
import { H3, H4 } from "~/components/ui/typography";
import { type Recipe } from "./RecipeClient";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { produce } from "immer";
import { Textarea } from "~/components/ui/textarea";
import { useRecipeActions } from "~/app/useRecipeActions";

type StepListProps = {
  recipe: Recipe;
};
export function StepList({ recipe }: StepListProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!recipe) {
    return null;
  }

  const mainComp = (
    <div>
      {recipe.stepGroups.map((group) => (
        <div key={group.title}>
          <H4>{group.title}</H4>
          <ol>
            {group.steps.map((step) => (
              <li
                key={step}
                className="m-1 list-inside list-decimal rounded-sm bg-yellow-100 p-1"
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <H3>instructions</H3>
      <Button onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? "Done" : "Edit"}
      </Button>
      {isEditing ? <StepListEditMode recipe={recipe} /> : mainComp}
    </>
  );
}

function StepListEditMode({ recipe }: StepListProps) {
  type StepGroup = (typeof recipe)["stepGroups"][0];
  type StepList = StepGroup["steps"][0];

  const [stepGroups, setStepGroups] = useState(recipe.stepGroups);

  const { updateStepGroups } = useRecipeActions();

  // render as a list of text areas with auto sizing
  // button to add new step
  // button to delete step
  // input to rename step group title

  function handleStepChange(groupIdx: number, stepIdx: number, value: string) {
    setStepGroups(
      produce((draft) => {
        const group = draft[groupIdx];
        if (!group) {
          return;
        }
        group.steps[stepIdx] = value;
      }),
    );
  }

  function handleAddStep(groupIdx: number) {
    setStepGroups(
      produce((draft) => {
        const group = draft[groupIdx];
        if (!group) {
          return;
        }
        group.steps.push("New step");
      }),
    );
  }

  function handleDeleteStep(groupIdx: number, stepIdx: number) {
    setStepGroups(
      produce((draft) => {
        const group = draft[groupIdx];
        if (!group) {
          return;
        }
        group.steps.splice(stepIdx, 1);
      }),
    );
  }

  async function handleSave() {
    const shouldSave = confirm("Are you sure you want to save these changes?");

    if (!shouldSave) {
      return;
    }

    await updateStepGroups.mutateAsync({
      recipeId: recipe.id,
      stepGroups,
    });
  }

  return (
    <div>
      <Button onClick={handleSave}>Save</Button>
      {stepGroups.map((group, groupIdx) => (
        <div key={groupIdx}>
          <Input value={group.title} className="text-lg font-bold" />
          <ul>
            {group.steps.map((step, stepIdx) => (
              <li key={stepIdx} className="flex gap-1">
                <Textarea
                  value={step}
                  onChange={(e) =>
                    handleStepChange(groupIdx, stepIdx, e.target.value)
                  }
                  autoResize
                />
                <Button onClick={() => handleDeleteStep(groupIdx, stepIdx)}>
                  Delete
                </Button>
              </li>
            ))}

            <li>
              <Button onClick={() => handleAddStep(groupIdx)}>Add step</Button>
            </li>
          </ul>
        </div>
      ))}
    </div>
  );
}
