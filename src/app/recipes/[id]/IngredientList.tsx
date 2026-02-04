"use client";

import { Ban, Edit } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { H3, H4 } from "~/components/ui/typography";
import { IngredientListEditMode } from "./IngredientListEditMode";
import { type Recipe } from "./recipe-types";

export interface IngredientListProps {
  recipe: Recipe;
}
export function IngredientList({ recipe }: IngredientListProps) {
  const [isEditing, setIsEditing] = useState(false);

  const mainComp = (
    <ul>
      {recipe.ingredientGroups.map((ingredient, idx) => (
        <div key={ingredient.id ?? idx} className="space-y-1">
          <H4>{ingredient.title}</H4>
          {ingredient.ingredients.map((i) => (
            <div key={i.id ?? `${ingredient.id ?? idx}-${i.ingredient}`} className="flex items-center gap-2">
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
    </ul>
  );

  const cancelBtn = (
    <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
      <Ban />
      Cancel
    </Button>
  );
  return (
    <>
      <div className="flex items-center gap-4">
        <H3>ingredients</H3>
        {!isEditing && (
          <Button onClick={() => setIsEditing(!isEditing)}>
            <Edit />
            Edit
          </Button>
        )}
      </div>
      {isEditing ? (
        <IngredientListEditMode
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
