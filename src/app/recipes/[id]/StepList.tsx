"use client";

import { type Recipe } from "./recipe-types";
import { EmptySectionState, SectionHeading } from "./SectionHeading";

export type StepListProps = {
  recipe: Recipe;
  onStartEditing: () => void;
};
export function StepList({ recipe, onStartEditing }: StepListProps) {
  if (!recipe) {
    return null;
  }

  const stepCount = recipe.stepGroups.reduce(
    (sum, group) => sum + group.steps.length,
    0,
  );

  const mainComp =
    stepCount === 0 ? (
      <EmptySectionState
        message="No instructions yet."
        actionLabel="Add steps"
        onAction={onStartEditing}
      />
    ) : (
      <div className="space-y-5">
        {recipe.stepGroups.map((group) =>
          group.steps.length === 0 ? null : (
            <div key={group.id}>
              {group.title ? (
                <h4 className="mb-2 text-sm font-semibold">{group.title}</h4>
              ) : null}
              <ol className="space-y-3">
                {group.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {idx + 1}
                    </span>
                    <p className="min-w-0 flex-1 break-words leading-relaxed">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ),
        )}
      </div>
    );

  return (
    <>
      <SectionHeading
        title="Instructions"
        count={stepCount}
        onEdit={onStartEditing}
      />
      {mainComp}
    </>
  );
}
