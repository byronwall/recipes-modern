"use client";

import { Button } from "~/components/ui/button";
import { H1, H2 } from "~/components/ui/typography";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { useRadioList } from "../list/useRadioList";
import { PlanCard } from "./PlanCard";
import { useRecipeActions } from "../useRecipeActions";

const renderModes = ["list", "calendar"] as const;

export function PlanPageClient(props: {
  plans: RouterOutputs["recipe"]["getMealPlans"];
}) {
  const { plans: initPlans } = props;

  const { data: plans = initPlans } = api.recipe.getMealPlans.useQuery();

  // TODO: this filtering should be done on the server
  const plansThisMonth = plans.filter((plan) => {
    // filter within -14 days and +14 days
    const date = new Date(plan.date);
    const now = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(now.getDate() + 14);

    return date >= fourteenDaysAgo && date <= fourteenDaysFromNow;
  });

  const { groupMode, radioGroupComp } = useRadioList(renderModes, "list");

  const { handleAddToMealPlan } = useRecipeActions();

  return (
    <div>
      <H1>Plan</H1>

      <H2>Render mode</H2>
      <div className="flex gap-2">{radioGroupComp}</div>
      <H2>Plans this month</H2>
      {groupMode === "list" && (
        <div className="flex flex-wrap gap-2">
          {plansThisMonth.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}

      {groupMode === "calendar" && (
        <div>
          <CalendarThreeWeeks
            itemRenderer={(date) => {
              const plan = plans.find(
                (plan) => plan.date.toDateString() === date.toDateString(),
              );
              if (!plan) {
                return null;
              }

              return <p>{plan.Recipe.name}</p>;
            }}
          />
        </div>
      )}
    </div>
  );
}

function CalendarThreeWeeks(props: {
  itemRenderer?: (date: Date) => React.ReactNode;
  onAction?: (date: Date) => void;
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

            <Button onClick={() => onAction?.(day)}>Add</Button>

            {itemRenderer?.(day)}
          </div>
        );
      })}
    </div>
  );
}
