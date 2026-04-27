"use client";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

export function AddToMealPlanPopover(props: {
  recipeId: number;
  display?: "icon" | "text";
  className?: string;
}) {
  const { recipeId, display = "icon", className } = props;

  const { handleAddToMealPlan } = useRecipeActions();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isAdding, setIsAdding] = useState(false);

  if (!recipeId) {
    return null;
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (isAdding) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setSelectedDate(undefined);
    }
  };

  const handleSelectDate = async (date: Date | undefined) => {
    if (!date || isAdding) {
      return;
    }

    setSelectedDate(date);
    setIsAdding(true);

    try {
      await handleAddToMealPlan(recipeId, date);
      toast.success(`Added to plan for ${format(date, "MMM d, yyyy")}.`);
      setOpen(false);
      setSelectedDate(undefined);
    } catch {
      toast.error("Could not add this recipe to the plan.");
    } finally {
      setIsAdding(false);
    }
  };

  const picker = (
    <PopoverContent
      className="w-auto p-3"
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      <div className="relative">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelectDate}
          className={isAdding ? "pointer-events-none opacity-60" : undefined}
        />
        {isAdding && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/70">
            <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm shadow-sm">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>Adding to plan</span>
            </div>
          </div>
        )}
      </div>
    </PopoverContent>
  );

  return (
    <div>
      {display === "icon" ? (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <TooltipButton content="Add to plan">
            <span className="inline-flex">
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Add to plan"
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <CalendarPlus className="h-4 w-4 shrink-0" />
                  )}
                </Button>
              </PopoverTrigger>
            </span>
          </TooltipButton>
          {picker}
        </Popover>
      ) : (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <IconTextButton
              variant="outline"
              className={className}
              icon={
                isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarPlus className="h-4 w-4" />
                )
              }
              label="Plan"
              disabled={isAdding}
            />
          </PopoverTrigger>
          {picker}
        </Popover>
      )}
    </div>
  );
}
