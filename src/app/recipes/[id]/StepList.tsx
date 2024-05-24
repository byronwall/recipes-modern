"use client";
import { H3, H4 } from "~/components/ui/typography";
import { type Recipe } from "./RecipeClient";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useCookingMode } from "./useCookingMode";
import { Checkbox } from "~/components/ui/checkbox";
import { StepListEditMode } from "./StepListEditMode";

export type StepListProps = {
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
          {isEditing ? "Discard Edits" : "Edit"}
        </Button>
      )}
      {isEditing ? <StepListEditMode recipe={recipe} /> : mainComp}
    </>
  );
}