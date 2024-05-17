"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { H3, H4 } from "~/components/ui/typography";
import { type Recipe } from "./RecipeClient";
import { IngredientListEditMode } from "./IngredientListEditMode";
import { useCookingMode } from "./useCookingMode";
import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/lib/utils";

export interface IngredientListProps {
  recipe: Recipe;
}
export function IngredientList({ recipe }: IngredientListProps) {
  const [isEditing, setIsEditing] = useState(false);

  const { toggleIngredientStatus, ingredients, cookingMode } = useCookingMode();

  const mainComp = (
    <ul>
      {recipe.ingredientGroups.map((ingredient, idx) => (
        <div key={idx} className="space-y-1">
          <H4>{ingredient.title}</H4>
          {ingredient.ingredients.map((i) => (
            <div key={idx} className="flex items-center gap-2">
              {cookingMode && (
                <Checkbox
                  checked={ingredients[i.id] ?? false}
                  onCheckedChange={() => toggleIngredientStatus(i.id)}
                  id={`ingredient-${i.id}`}
                  className="h-8 w-8"
                />
              )}
              <label
                className={cn("flex gap-1 break-words text-lg", {
                  "text-xl": cookingMode,
                })}
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
    </ul>
  );

  return (
    <>
      <H3>ingredients</H3>
      {!cookingMode && (
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Done" : "Edit"}
        </Button>
      )}
      {isEditing ? <IngredientListEditMode recipe={recipe} /> : mainComp}
    </>
  );
}
