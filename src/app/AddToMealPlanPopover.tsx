"use client";
import { Button } from "~/components/ui/button";
import { useRecipeActions } from "./useRecipeActions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { CalendarPlus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export function AddToMealPlanPopover(props: { recipeId: number }) {
  const { recipeId } = props;

  const { handleAddToMealPlan } = useRecipeActions();

  if (!recipeId) {
    return null;
  }

  return (
    <div>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <Popover>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button size="icon" variant="outline" aria-label="Add to plan">
                  <CalendarPlus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
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
          <TooltipContent>Add to plan</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
