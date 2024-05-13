"use client";
import { cn } from "~/lib/utils";
import { RecipePickerPopover } from "./RecipePickerPopover";

export function MealPlanThreeWeekView(props: {
  itemRenderer?: (date: Date) => React.ReactNode;
  onAction?: (date: Date, recipeId: number) => void;
}) {
  const { itemRenderer, onAction } = props;

  const startDate = new Date();
  const endDate = new Date();

  // start = find the sunday, 1 week before today
  startDate.setDate(startDate.getDate() - startDate.getDay() - 7);

  // end = 1 weeks after today, saturday
  endDate.setDate(endDate.getDate() - endDate.getDay() + 13);

  const days = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="mb-10 grid grid-cols-7 gap-2">
      {dayHeaders.map((day) => (
        <div key={day} className="text-center">
          {day}
        </div>
      ))}
      {days.map((day) => {
        return (
          <div
            key={day.toISOString()}
            className={cn("border border-gray-200 p-2 text-center", {
              "bg-gray-100": day.getDay() === 0,
              // today = light purple
              "bg-purple-100": day.toDateString() === new Date().toDateString(),
            })}
          >
            {day.toDateString()}

            <RecipePickerPopover
              onRecipeSelected={(recipeId) => {
                onAction?.(day, recipeId);
              }}
            />

            {itemRenderer?.(day)}
          </div>
        );
      })}
    </div>
  );
}
