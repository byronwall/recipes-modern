"use client";

import { produce } from "immer";
import { FolderPlus, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { TooltipButton } from "~/components/ui/tooltip-button";
import { cn } from "~/lib/utils";
import { type Recipe } from "./recipe-types";
import { dirtyInputClass } from "./edit-mode-utils";

type StepGroups = Recipe["stepGroups"];

export function StepListEditMode(props: {
  stepGroups: StepGroups;
  originalStepGroups: StepGroups;
  onStepGroupsChange: (stepGroups: StepGroups) => void;
}) {
  const { stepGroups, originalStepGroups, onStepGroupsChange } = props;
  const [pendingFocus, setPendingFocus] = useState<{
    groupIdx: number;
    stepIdx: number;
  } | null>(null);
  const stepTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>(
    {},
  );

  function getOriginalGroup(group: StepGroups[number]) {
    if (group.id <= 0) {
      return undefined;
    }
    return originalStepGroups.find((original) => original.id === group.id);
  }

  function setStepGroups(recipeUpdater: (draft: StepGroups) => void) {
    onStepGroupsChange(produce(stepGroups, recipeUpdater));
  }

  useEffect(() => {
    if (!pendingFocus) {
      return;
    }

    const key = `${pendingFocus.groupIdx}-${pendingFocus.stepIdx}`;
    const target = stepTextareaRefs.current[key];

    if (target) {
      requestAnimationFrame(() => {
        target.focus();
        target.select();
      });
      setPendingFocus(null);
    }
  }, [stepGroups, pendingFocus]);

  function handleStepChange(groupIdx: number, stepIdx: number, value: string) {
    setStepGroups((draft) => {
      const group = draft[groupIdx];
      if (!group) {
        return;
      }
      group.steps[stepIdx] = value;
    });
  }

  function handleAddStep(groupIdx: number) {
    const nextStepIdx = stepGroups[groupIdx]?.steps.length ?? 0;

    setStepGroups((draft) => {
      const group = draft[groupIdx];
      if (!group) {
        return;
      }
      group.steps.push("");
    });
    setPendingFocus({ groupIdx, stepIdx: nextStepIdx });
  }

  function handleDeleteStep(groupIdx: number, stepIdx: number) {
    setStepGroups((draft) => {
      const group = draft[groupIdx];
      if (!group) {
        return;
      }
      group.steps.splice(stepIdx, 1);
    });
  }

  function handleTitleChange(groupIdx: number, value: string) {
    setStepGroups((draft) => {
      const group = draft[groupIdx];
      if (!group) {
        return;
      }
      group.title = value;
    });
  }

  function handleToggleDeleteGroup(groupIdx: number) {
    setStepGroups((draft) => {
      const group = draft[groupIdx];

      if (!group) {
        return;
      }

      if (group.id === 0) {
        draft.splice(groupIdx, 1);
        return;
      }

      group.id = -group.id;
    });
  }

  function handleAddNewGroup() {
    setStepGroups((draft) => {
      const recipeId = draft[0]?.recipeId ?? -1;
      draft.push({
        id: 0,
        title: "New group",
        steps: [""],
        order: draft.length,
        recipeId,
      });
    });
  }

  return (
    <div className="w-full space-y-4">
      {stepGroups.map((group, groupIdx) => {
        const isDeleted = group.id < 0;
        const isNew = group.id === 0;
        const originalGroup = getOriginalGroup(group);
        const isTitleDirty =
          originalGroup?.title !== undefined
            ? group.title !== originalGroup.title
            : group.title !== "New group";
        const titleWidthCh = Math.max(8, group.title.trim().length + 1);
        return (
          <div
            key={group.id || groupIdx}
            className={cn(
              "space-y-1.5 rounded-md bg-card/40",
              isDeleted && "bg-red-100/50",
              isNew && "bg-emerald-100/20",
            )}
          >
            <div className="flex items-center gap-1">
              <Input
                id={`step-group-title-${group.id || groupIdx}`}
                value={group.title}
                className={cn(
                  "h-10 w-auto max-w-[calc(100%-2.25rem)] rounded-sm bg-background/80 text-lg font-semibold",
                  dirtyInputClass(isTitleDirty),
                )}
                style={{ width: `${titleWidthCh}ch` }}
                onChange={(e) => handleTitleChange(groupIdx, e.target.value)}
                placeholder="Group title"
              />
              <TooltipButton
                content={isDeleted ? "Restore group" : "Delete group"}
              >
                <Button
                  onClick={() => handleToggleDeleteGroup(groupIdx)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4 shrink-0" />
                </Button>
              </TooltipButton>
            </div>

            <div className="ml-2 space-y-2">
              {group.steps.map((step, stepIdx) => {
                const isStepDirty =
                  originalGroup?.steps?.[stepIdx] !== undefined
                    ? step !== originalGroup.steps[stepIdx]
                    : step.trim().length > 0;

                return (
                  <div
                    key={`${group.id || groupIdx}-${stepIdx}`}
                    className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-2 rounded-sm bg-background/55 p-2"
                  >
                    <div className="flex h-9 items-center justify-center rounded-sm bg-muted/40 text-sm font-semibold text-muted-foreground">
                      {stepIdx + 1}
                    </div>
                    <Textarea
                      ref={(node) => {
                        stepTextareaRefs.current[`${groupIdx}-${stepIdx}`] =
                          node;
                      }}
                      value={step}
                      onChange={(e) =>
                        handleStepChange(groupIdx, stepIdx, e.target.value)
                      }
                      autoResize
                      rows={1}
                      className={cn(
                        "h-10 min-h-0 rounded-sm bg-background/80 text-base",
                        dirtyInputClass(isStepDirty),
                      )}
                      placeholder="Describe this step"
                    />
                    <TooltipButton content="Delete step">
                      <Button
                        onClick={() => handleDeleteStep(groupIdx, stepIdx)}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-sm text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4 shrink-0" />
                      </Button>
                    </TooltipButton>
                  </div>
                );
              })}
            </div>

            <Button
              className="ml-2 rounded-md"
              onClick={() => handleAddStep(groupIdx)}
              variant="secondary"
            >
              <Plus className="shrink-0" />
              Add step
            </Button>
          </div>
        );
      })}

      <Button onClick={handleAddNewGroup} className="rounded-md">
        <FolderPlus className="shrink-0" />
        Add New Group
      </Button>
    </div>
  );
}
