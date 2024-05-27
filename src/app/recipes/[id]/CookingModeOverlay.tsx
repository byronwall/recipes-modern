"use client";

import { Checkbox } from "~/components/ui/checkbox";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { H4 } from "~/components/ui/typography";
import { cn } from "~/lib/utils";
import { type Recipe } from "./RecipeClient";
import { useCookingMode } from "./useCookingMode";

type Props = {
  recipe: Recipe;
};

export function CookingModeOverlay({ recipe }: Props) {
  const {
    toggleIngredientStatus,
    toggleCookingMode,
    toggleStepStatus,
    ingredients,
    cookingMode,
    steps,
  } = useCookingMode();

  return (
    <Dialog open={cookingMode} onOpenChange={toggleCookingMode}>
      <DialogContent className="flex h-screen w-screen flex-col bg-white">
        <p
          className={cn(
            "truncate text-center text-3xl font-bold",
            "border-b border-gray-200",
          )}
        >
          {recipe.name}
        </p>
        <ResizablePanelGroup
          direction="vertical"
          className="min-h-[200px] max-w-md flex-1 rounded-lg border"
        >
          <ResizablePanel defaultSize={80}>
            <div className="h-full items-center justify-center overflow-y-auto p-2">
              <div>ingredients</div>
              {recipe.ingredientGroups.map((ingredient, idx) => (
                <div key={idx} className="space-y-1">
                  <h4>{ingredient.title}</h4>
                  {ingredient.ingredients.map((i) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Checkbox
                        checked={ingredients[i.id] ?? false}
                        onCheckedChange={() => toggleIngredientStatus(i.id)}
                        id={`ingredient-${i.id}`}
                        className="h-8 w-8"
                      />
                      <label
                        className="flex gap-1 break-words text-lg"
                        htmlFor={`ingredient-${i.id}`}
                      >
                        {[i.amount, i.unit, i.ingredient, i.modifier]
                          .filter(Boolean)
                          .join(" ")}
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={75}>
            <div className=" h-full items-center justify-center overflow-y-auto p-2">
              <div>
                <p>steps</p>
                {recipe.stepGroups.map((group) => (
                  <div key={group.title}>
                    <H4>{group.title}</H4>
                    <ol>
                      {group.steps.map((step, idx) => {
                        const id = `${group.id}-${idx}`;
                        return (
                          <div key={step} className="flex items-center gap-2">
                            <Checkbox
                              checked={steps[id] ?? false}
                              onCheckedChange={() =>
                                toggleStepStatus(`${group.id}-${idx}`)
                              }
                              className="h-8 w-8"
                              id={`step-${id}`}
                            />

                            <label
                              htmlFor={`step-${id}`}
                              className={cn("flex gap-1 break-words text-lg", {
                                "text-xl": cookingMode,
                              })}
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
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </DialogContent>
    </Dialog>
  );
}
