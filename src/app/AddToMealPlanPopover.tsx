"use client";
import { Button } from "~/components/ui/button";
import { IconTextButton } from "~/components/ui/icon-text-button";
import { TooltipButton } from "~/components/ui/tooltip-button";
import { useRecipeActions } from "./useRecipeActions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { CalendarPlus } from "lucide-react";

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
        <Popover>
          <TooltipButton content="Add to plan">
            <span className="inline-flex">
              <PopoverTrigger asChild>
                <Button size="icon" variant="outline" aria-label="Add to plan">
                  <CalendarPlus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </span>
          </TooltipButton>
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
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <IconTextButton
              variant="outline"
              className={className}
              icon={<CalendarPlus className="h-4 w-4" />}
              label="Plan"
            />
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
