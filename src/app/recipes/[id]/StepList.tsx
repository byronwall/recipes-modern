"use client";
import { H3, H4 } from "~/components/ui/typography";
import { type Recipe } from "./RecipeClient";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { produce } from "immer";
import { Textarea } from "~/components/ui/textarea";
import { useRecipeActions } from "~/app/useRecipeActions";
import { cn } from "~/lib/utils";
import { type StepGroup } from "@prisma/client";
import { useCookingMode } from "./useCookingMode";
import { Checkbox } from "~/components/ui/checkbox";

type StepListProps = {
  recipe: Recipe;
};
export function StepList({ recipe }: StepListProps) {
  const [isEditing, setIsEditing] = useState(false);

  const { cookingMode, toggleStepStatus, steps } = useCookingMode();

  if (!recipe) {
    return null;
  }

  const mainComp = (
    <div>
      {recipe.stepGroups.map((group) => (
        <div key={group.title}>
          <H4>{group.title}</H4>
          <ol>
            {group.steps.map((step, idx) => {
              const id = `${group.id}-${idx}`;
              return (
                <div key={step} className="flex items-center gap-2">
                  {cookingMode && (
                    <Checkbox
                      checked={steps[id] ?? false}
                      onCheckedChange={() =>
                        toggleStepStatus(`${group.id}-${idx}`)
                      }
                      className="h-8 w-8"
                      id={`step-${id}`}
                    />
                  )}
                  <label
                    htmlFor={`step-${id}`}
                    className={cn("flex gap-1 break-words text-lg", {
                      "text-xl": cookingMode,
                    })}
                  >
                    <li className="m-1 list-inside list-decimal rounded-sm bg-gray-100 p-1">
                      {step}
                    </li>
                  </label>
                </div>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <H3>instructions</H3>
      {!cookingMode && (
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Done" : "Edit"}
        </Button>
      )}
      {isEditing ? <StepListEditMode recipe={recipe} /> : mainComp}
    </>
  );
}

function StepListEditMode({ recipe }: StepListProps) {
  const [stepGroups, setStepGroups] = useState(recipe.stepGroups);

  const { updateStepGroups } = useRecipeActions();

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

  function handleTitleChange(groupIdx: number, value: string) {
    setStepGroups(
      produce((draft) => {
        const group = draft[groupIdx];
        if (!group) {
          return;
        }
        group.title = value;
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

  function handleToggleDeleteGroup(groupIdx: number) {
    setStepGroups(
      produce((draft) => {
        // set the ID to negative to indicate that it should be deleted

        const group = draft[groupIdx];

        if (!group) {
          return;
        }

        // if it's a new group, just remove it
        if (group.id === 0) {
          draft.splice(groupIdx, 1);
          return;
        }

        group.id = -group.id;
      }),
    );
  }

  function handleAddNewGroup() {
    setStepGroups(
      produce((draft) => {
        const newGroup: StepGroup = {
          id: 0,
          title: "New group",
          steps: ["New step"],
          order: draft.length,
          recipeId: -1,
        };

        draft.push(newGroup as any);
      }),
    );
  }

  return (
    <div>
      <Button onClick={handleSave}>Save</Button>
      <Button onClick={handleAddNewGroup}>Add group</Button>
      {stepGroups.map((group, groupIdx) => {
        const isDeleted = group.id < 0;
        const isNew = group.id === 0;
        return (
          <div
            key={groupIdx}
            className={cn(
              { "bg-red-100 opacity-80": isDeleted },
              { "bg-green-100 opacity-80": isNew },
              "m-2 rounded-lg p-2",
            )}
          >
            <Input
              value={group.title}
              className="text-lg font-bold"
              onChange={(e) => handleTitleChange(groupIdx, e.target.value)}
            />
            <Button
              onClick={() => handleToggleDeleteGroup(groupIdx)}
              className="text-red-500"
            >
              delete group
            </Button>
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
                <Button onClick={() => handleAddStep(groupIdx)}>
                  Add step
                </Button>
              </li>
            </ul>
          </div>
        );
      })}
    </div>
  );
}
