"use client";

import { H3, H4 } from "~/components/ui/typography";
import { type Recipe } from "./recipe-types";

export type StepListProps = {
  recipe: Recipe;
};
export function StepList({ recipe }: StepListProps) {
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
      <H3 className="text-xl font-medium text-muted-foreground">instructions</H3>
      {mainComp}
    </>
  );
}
