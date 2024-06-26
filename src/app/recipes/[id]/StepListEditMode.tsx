"use client";

import { type StepGroup } from "@prisma/client";
import { produce } from "immer";
import { ListPlus, ListX, Plus, Save, Trash } from "lucide-react";
import { useState } from "react";
import { useRecipeActions } from "~/app/useRecipeActions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { type StepListProps } from "./StepList";

type AddlProps = {
  cancelButton: React.ReactNode;
  onDoneEditing: () => void;
};

export function StepListEditMode({
  recipe,
  cancelButton,
  onDoneEditing,
}: StepListProps & AddlProps) {
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

    onDoneEditing();
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
    <div className="w-full">
      <div className="flex gap-1">
        <Button onClick={handleSave}>
          <Save />
          Save
        </Button>
        {cancelButton}
      </div>
      {stepGroups.map((group, groupIdx) => {
        const isDeleted = group.id < 0;
        const isNew = group.id === 0;
        return (
          <div
            key={groupIdx}
            className={cn(
              { "bg-red-100 opacity-80": isDeleted },
              { "bg-green-100 opacity-80": isNew },
              "rounded-lg p-2",
            )}
          >
            <div className="flex flex-col gap-1 md:flex-row">
              <Input
                value={group.title}
                className="text-lg font-bold"
                onChange={(e) => handleTitleChange(groupIdx, e.target.value)}
                placeholder="Group Title"
              />
              <Button
                onClick={() => handleToggleDeleteGroup(groupIdx)}
                variant="destructive-outline"
              >
                <ListX />
                Delete Group
              </Button>
            </div>
            <ul className="flex list-inside list-decimal flex-col gap-2 p-2">
              {group.steps.map((step, stepIdx) => (
                <li
                  key={stepIdx}
                  className="ml-4 flex flex-col items-center gap-1 border-l-2 bg-gray-50 p-1 pl-4 md:flex-row"
                >
                  <Textarea
                    value={step}
                    onChange={(e) =>
                      handleStepChange(groupIdx, stepIdx, e.target.value)
                    }
                    autoResize
                    className="w-full text-lg"
                  />
                  <Button
                    onClick={() => handleDeleteStep(groupIdx, stepIdx)}
                    variant="destructive-outline"
                  >
                    <Trash />
                  </Button>
                </li>
              ))}

              <Button
                className="ml-4 self-start"
                onClick={() => handleAddStep(groupIdx)}
              >
                <Plus />
                Add step
              </Button>
            </ul>

            <Button onClick={handleAddNewGroup}>
              <ListPlus />
              Add New Group
            </Button>
          </div>
        );
      })}
    </div>
  );
}
