"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardTitle } from "~/components/ui/card";
import { useRecipeActions } from "./useRecipeActions";
import { type Recipe } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { handleDelete } = useRecipeActions();

  return (
    <Card key={recipe.name} className="h-40">
      <CardTitle className="p-2">
        <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>

        <Button
          onClick={async () => {
            await handleDelete(recipe.id);
          }}
          className="ml-2"
        >
          Delete
        </Button>

        <AddToMealPlanPopover recipeId={recipe.id} />
      </CardTitle>
    </Card>
  );
}

function AddToMealPlanPopover(props: { recipeId: number }) {
  const { recipeId } = props;

  const { handleAddToMealPlan } = useRecipeActions();

  if (!recipeId) {
    return null;
  }

  return (
    <div>
      <Popover>
        <PopoverTrigger>
          <Button>Add to meal plan</Button>
        </PopoverTrigger>
        <PopoverContent>
          <div>
            <Calendar
              mode="single"
              onSelect={async (date) => {
                if (!date) {
                  return;
                }
                await handleAddToMealPlan(recipeId, date);
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
