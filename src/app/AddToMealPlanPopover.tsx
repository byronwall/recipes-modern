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

export function AddToMealPlanPopover(props: {
  recipeId: number;
  display?: "icon" | "text";
  className?: string;
}) {
  const { recipeId, display = "icon", className } = props;

  const { handleAddToMealPlan } = useRecipeActions();

  if (!recipeId) {
    return null;
  }

  return (
    <div>
      {display === "icon" ? (
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
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={className}>
              <CalendarPlus className="h-4 w-4 shrink-0" />
              <span className="ml-1">Plan</span>
            </Button>
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
      )}
    </div>
  );
}
