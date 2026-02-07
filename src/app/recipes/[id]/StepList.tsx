"use client";

import { Edit } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TooltipButton } from "~/components/ui/tooltip-button";
import { H3, H4 } from "~/components/ui/typography";
import { type Recipe } from "./recipe-types";

export type StepListProps = {
  recipe: Recipe;
  onStartEditing: () => void;
};
export function StepList({ recipe, onStartEditing }: StepListProps) {
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
                  <label
                    htmlFor={`step-${id}`}
                    className="flex gap-1 break-words text-lg"
                  >
                    <li className="m-1 list-inside list-decimal rounded-sm  p-1">
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
      <div className="flex items-center justify-between gap-2">
        <H3 className="text-xl font-medium text-muted-foreground">instructions</H3>
        <TooltipButton content="Edit recipe content">
          <Button
            onClick={onStartEditing}
            variant="ghost"
            size="icon"
            className="rounded-md text-primary/70 hover:bg-primary/10 hover:text-primary"
          >
            <Edit className="size-5 shrink-0" />
          </Button>
        </TooltipButton>
      </div>
      {mainComp}
    </>
  );
}
