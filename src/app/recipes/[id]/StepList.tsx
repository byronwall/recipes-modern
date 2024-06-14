"use client";

import { Ban, Edit } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { H3, H4 } from "~/components/ui/typography";
import { type Recipe } from "./RecipeClient";
import { StepListEditMode } from "./StepListEditMode";

export type StepListProps = {
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

  const cancelBtn = (
    <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
      <Ban />
      Cancel
    </Button>
  );

  return (
    <>
      <div className="flex gap-4">
        <H3>instructions</H3>
        {!isEditing && (
          <Button onClick={() => setIsEditing(!isEditing)}>
            <Edit />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <StepListEditMode
          recipe={recipe}
          cancelButton={cancelBtn}
          onDoneEditing={() => setIsEditing(false)}
        />
      ) : (
        mainComp
      )}
    </>
  );
}
