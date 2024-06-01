"use client";

import { H1 } from "~/components/ui/typography";
import { api } from "~/trpc/react";
import { useRecipeActions } from "../useRecipeActions";
import { PlanCard } from "./PlanCard";
import { RecipePickerPopover } from "./RecipePickerPopover";
import { useState } from "react";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";

export function PlanPageClient() {
  const { data: plans = [] } = api.recipe.getMealPlans.useQuery();

  const [shouldHideCompleted, setShouldHideCompleted] = useState(true);

  // TODO: this filtering should be done on the server
  const _plansThisMonth = plans
    .filter((plan) => {
      // filter within -14 days and +14 days
      const date = new Date(plan.date);
      const now = new Date();
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(now.getDate() - 14);
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(now.getDate() + 14);

      return date >= fourteenDaysAgo && date <= fourteenDaysFromNow;
    })
    .filter((plan) => (!shouldHideCompleted ? true : !plan.isMade));

  // sort by date
  const plansThisMonth = _plansThisMonth.sort((a, b) => {
    // verify they are dates
    if (!a?.date || !b?.date) {
      return 0;
    }

    // type guard for dates
    if (!(a.date instanceof Date) || !(b.date instanceof Date)) {
      return 0;
    }

    return a?.date?.getTime() - b?.date?.getTime();
  });

  const { handleAddToMealPlan } = useRecipeActions();

  return (
    <div className="flex flex-col gap-4">
      <H1>Planned Meals</H1>

      <div className="flex items-center gap-2">
        <Switch
          checked={shouldHideCompleted}
          onCheckedChange={setShouldHideCompleted}
          id="hide-completed"
        />
        <Label htmlFor="hide-completed" className="cursor-pointer">
          Hide made meals
        </Label>
      </div>

      <div className="flex flex-wrap gap-2">
        {plansThisMonth.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}

        <div className="flex min-h-28 w-[276px] items-center justify-center rounded border border-gray-200">
          <RecipePickerPopover
            onRecipeSelected={async (recipeId) => {
              await handleAddToMealPlan(recipeId, new Date());
            }}
          />
        </div>
      </div>
    </div>
  );
}
