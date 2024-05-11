"use client";
import { Button } from "~/components/ui/button";
import { useRecipeActions } from "./useRecipeActions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";

export function AddToMealPlanPopover(props: { recipeId: number }) {
  const { recipeId } = props;

  const { handleAddToMealPlan } = useRecipeActions();

  if (!recipeId) {
    return null;
  }

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
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
