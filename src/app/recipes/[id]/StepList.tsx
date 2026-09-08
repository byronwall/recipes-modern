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
        <div key={group.id}>
          <H4>{group.title}</H4>
          <ol className="list-decimal pl-7 text-lg">
            {group.steps.map((step, idx) => (
              <li key={idx} className="my-1 break-words pl-1">
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
      <div className="flex items-center justify-between gap-2">
        <H3 className="text-xl font-medium text-muted-foreground">
          instructions
        </H3>
        <TooltipButton content="Edit recipe content">
          <Button
            aria-label="Edit recipe content"
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
