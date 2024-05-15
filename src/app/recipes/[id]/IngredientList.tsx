"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { H3, H4 } from "~/components/ui/typography";
import { type Recipe } from "./RecipeClient";
import { IngredientListEditMode } from "./IngredientListEditMode";

export interface IngredientListProps {
  recipe: Recipe;
}
export function IngredientList({ recipe }: IngredientListProps) {
  const [isEditing, setIsEditing] = useState(false);

  const mainComp = (
    <ul>
      {recipe.ingredientGroups.map((ingredient, idx) => (
        <div key={idx}>
          <H4>{ingredient.title}</H4>
          {ingredient.ingredients.map((i) => (
            <div key={idx}>
              <span className="rounded-sm bg-orange-200 px-1">{i.amount}</span>{" "}
              <span className="rounded-sm bg-red-200 px-1">{i.unit}</span>{" "}
              <span className="rounded-sm bg-blue-200 px-1">
                {i.ingredient}
              </span>
              <span className={`rounded-sm bg-green-200 px-1`}>
                {i.modifier}
              </span>
            </div>
          ))}
        </div>
      ))}
    </ul>
  );

  return (
    <>
      <H3>ingredients</H3>
      <Button onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? "Done" : "Edit"}
      </Button>
      {isEditing ? <IngredientListEditMode recipe={recipe} /> : mainComp}
    </>
  );
}
